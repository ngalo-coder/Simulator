const ScoringValidationService = require('../src/services/ScoringValidationService');
const ScoringValidationModel = require('../src/models/ScoringValidationModel');
const SessionModel = require('../src/models/SessionModel');
const UserModel = require('../src/models/UserModel');

// Mock dependencies
jest.mock('../src/models/ScoringValidationModel');
jest.mock('../src/models/SessionModel');
jest.mock('../src/models/UserModel');

describe('ScoringValidationService', () => {
  let scoringValidationService;

  beforeEach(() => {
    scoringValidationService = new ScoringValidationService();
    jest.clearAllMocks();
  });

  describe('validateScoringReliability', () => {
    it('should validate scoring reliability successfully', async () => {
      const sessionData = {
        _id: 'session-123',
        userId: 'user-456',
        caseId: 'case-789',
        overallScore: 85,
        areaScores: [
          { area: 'Clinical Skills', score: 80, weight: 0.6 },
          { area: 'Treatment Planning', score: 90, weight: 0.4 }
        ]
      };

      const evaluatorData = {
        _id: 'evaluator-1',
        role: 'educator',
        expertise: ['medical'],
        validationStats: {
          totalEvaluations: 10,
          agreementRate: 0.85,
          reliabilityScore: 0.9
        }
      };

      SessionModel.findById = jest.fn().mockResolvedValue(sessionData);
      UserModel.findById = jest.fn().mockResolvedValue(evaluatorData);
      ScoringValidationModel.prototype.save = jest.fn().mockResolvedValue({});

      const result = await scoringValidationService.validateScoringReliability(
        'session-123',
        'evaluator-1',
        82, // human score
        0.8 // confidence threshold
      );

      expect(result).toHaveProperty('isReliable');
      expect(result).toHaveProperty('discrepancyScore');
      expect(result).toHaveProperty('agreementStatus');
      expect(SessionModel.findById).toHaveBeenCalledWith('session-123');
      expect(UserModel.findById).toHaveBeenCalledWith('evaluator-1');
    });

    it('should flag unreliable scoring with high discrepancy', async () => {
      const sessionData = { _id: 'session-123', overallScore: 85 };
      const evaluatorData = {
        _id: 'evaluator-1',
        validationStats: { totalEvaluations: 5, agreementRate: 0.6, reliabilityScore: 0.7 }
      };

      SessionModel.findById = jest.fn().mockResolvedValue(sessionData);
      UserModel.findById = jest.fn().mockResolvedValue(evaluatorData);

      const result = await scoringValidationService.validateScoringReliability(
        'session-123',
        'evaluator-1',
        50, // large discrepancy
        0.8 // high confidence threshold
      );

      expect(result.isReliable).toBe(false);
      expect(result.discrepancyScore).toBeGreaterThan(20);
    });

    it('should throw error if session not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue(null);

      await expect(scoringValidationService.validateScoringReliability(
        'nonexistent-session',
        'evaluator-1',
        85,
        0.8
      )).rejects.toThrow('Session not found');
    });

    it('should throw error if evaluator not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue({});
      UserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(scoringValidationService.validateScoringReliability(
        'session-123',
        'nonexistent-evaluator',
        85,
        0.8
      )).rejects.toThrow('Evaluator not found');
    });
  });

  describe('calculateInterRaterReliability', () => {
    it('should calculate IRR for multiple evaluators', async () => {
      const scores = [
        { evaluatorId: 'eval-1', score: 85 },
        { evaluatorId: 'eval-2', score: 82 },
        { evaluatorId: 'eval-3', score: 87 }
      ];

      const result = await scoringValidationService.calculateInterRaterReliability(scores);

      expect(result).toHaveProperty('agreementScore');
      expect(result).toHaveProperty('consistencyMetric');
      expect(result).toHaveProperty('outlierCount');
      expect(result.agreementScore).toBeGreaterThan(0);
      expect(result.agreementScore).toBeLessThanOrEqual(1);
    });

    it('should handle perfect agreement', async () => {
      const scores = [
        { evaluatorId: 'eval-1', score: 85 },
        { evaluatorId: 'eval-2', score: 85 },
        { evaluatorId: 'eval-3', score: 85 }
      ];

      const result = await scoringValidationService.calculateInterRaterReliability(scores);
      expect(result.agreementScore).toBe(1);
      expect(result.outlierCount).toBe(0);
    });

    it('should handle complete disagreement', async () => {
      const scores = [
        { evaluatorId: 'eval-1', score: 30 },
        { evaluatorId: 'eval-2', score: 85 },
        { evaluatorId: 'eval-3', score: 95 }
      ];

      const result = await scoringValidationService.calculateInterRaterReliability(scores);
      expect(result.agreementScore).toBeLessThan(0.5);
      expect(result.outlierCount).toBeGreaterThan(0);
    });
  });

  describe('trackEvaluatorPerformance', () => {
    it('should track evaluator performance metrics', async () => {
      const evaluatorId = 'eval-1';
      const validationRecord = {
        sessionId: 'session-123',
        aiScore: 85,
        humanScore: 82,
        discrepancy: 3,
        isReliable: true
      };

      UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await scoringValidationService.trackEvaluatorPerformance(evaluatorId, validationRecord);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        evaluatorId,
        expect.objectContaining({
          $inc: {
            'validationStats.totalEvaluations': 1,
            'validationStats.reliableEvaluations': 1
          }
        }),
        { new: true }
      );
    });

    it('should update agreement rate correctly', async () => {
      const evaluatorId = 'eval-1';
      const validationRecord = {
        sessionId: 'session-123',
        aiScore: 85,
        humanScore: 82,
        discrepancy: 3,
        isReliable: true
      };

      const existingStats = {
        validationStats: {
          totalEvaluations: 10,
          reliableEvaluations: 8,
          agreementRate: 0.8
        }
      };

      UserModel.findById = jest.fn().mockResolvedValue(existingStats);
      UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await scoringValidationService.trackEvaluatorPerformance(evaluatorId, validationRecord);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        evaluatorId,
        expect.objectContaining({
          $set: {
            'validationStats.agreementRate': expect.any(Number)
          }
        }),
        { new: true }
      );
    });
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', async () => {
      const sessionId = 'session-123';
      const validationRecords = [
        {
          sessionId: 'session-123',
          evaluatorId: 'eval-1',
          aiScore: 85,
          humanScore: 82,
          discrepancy: 3,
          isReliable: true,
          timestamp: new Date()
        },
        {
          sessionId: 'session-123',
          evaluatorId: 'eval-2',
          aiScore: 85,
          humanScore: 87,
          discrepancy: 2,
          isReliable: true,
          timestamp: new Date()
        }
      ];

      ScoringValidationModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(validationRecords)
        })
      });

      const result = await scoringValidationService.generateValidationReport(sessionId);

      expect(result).toHaveProperty('sessionId', sessionId);
      expect(result).toHaveProperty('reliabilityScore');
      expect(result).toHaveProperty('averageDiscrepancy');
      expect(result).toHaveProperty('evaluatorCount');
      expect(result).toHaveProperty('validationRecords');
      expect(result.validationRecords).toHaveLength(2);
    });

    it('should handle no validation records', async () => {
      ScoringValidationModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      const result = await scoringValidationService.generateValidationReport('session-123');
      expect(result.evaluatorCount).toBe(0);
      expect(result.validationRecords).toHaveLength(0);
    });
  });
});