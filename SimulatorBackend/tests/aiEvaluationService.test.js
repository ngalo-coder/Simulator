const AIEvaluationService = require('../src/services/AIEvaluationService');
const SessionModel = require('../src/models/SessionModel');
const ScoringRubricModel = require('../src/models/ScoringRubricModel');

// Mock dependencies
jest.mock('../src/models/SessionModel');
jest.mock('../src/models/ScoringRubricModel');
jest.mock('../src/services/ScoringService', () => {
  return jest.fn().mockImplementation(() => ({
    scoreSession: jest.fn().mockResolvedValue({
      overallScore: 85,
      areaScores: [
        { area: 'Clinical Skills', score: 80, weight: 0.6 },
        { area: 'Treatment Planning', score: 90, weight: 0.4 }
      ]
    })
  }));
});

describe('AIEvaluationService', () => {
  let aiEvaluationService;

  beforeEach(() => {
    aiEvaluationService = new AIEvaluationService();
    jest.clearAllMocks();
  });

  describe('evaluateSessionWithAI', () => {
    it('should perform AI evaluation successfully', async () => {
      const sessionData = {
        _id: 'session-123',
        userId: 'user-456',
        caseId: 'case-789',
        discipline: 'medical',
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '100mg' } }
        ]
      };

      const rubricData = {
        rubricId: 'medical-rubric',
        competencyAreas: [
          {
            area: 'Clinical Skills',
            weight: 0.6,
            criteria: [
              {
                criterion: 'Patient Assessment',
                maxScore: 10,
                performanceLevels: [
                  { level: 'Novice', score: 0 },
                  { level: 'Competent', score: 7 },
                  { level: 'Expert', score: 10 }
                ]
              }
            ]
          }
        ]
      };

      SessionModel.findById = jest.fn().mockResolvedValue(sessionData);
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(rubricData);

      const result = await aiEvaluationService.evaluateSessionWithAI('session-123', 'medical-rubric');

      expect(result).toHaveProperty('aiScore');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('patternAnalysis');
      expect(result).toHaveProperty('anomalies');
      expect(SessionModel.findById).toHaveBeenCalledWith('session-123');
      expect(ScoringRubricModel.findOne).toHaveBeenCalledWith({ rubricId: 'medical-rubric' });
    });

    it('should throw error if session not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue(null);

      await expect(aiEvaluationService.evaluateSessionWithAI('nonexistent-session', 'medical-rubric'))
        .rejects
        .toThrow('Session not found');
    });

    it('should throw error if rubric not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue({});
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(aiEvaluationService.evaluateSessionWithAI('session-123', 'nonexistent-rubric'))
        .rejects
        .toThrow('Scoring rubric not found');
    });
  });

  describe('analyzePatterns', () => {
    it('should analyze patterns correctly', async () => {
      const sessionData = {
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '100mg' } }
        ]
      };

      const result = await aiEvaluationService.analyzePatterns(sessionData);

      expect(result).toHaveProperty('commonPatterns');
      expect(result).toHaveProperty('efficiencyMetrics');
      expect(result).toHaveProperty('decisionMakingPatterns');
    });

    it('should handle empty actions', async () => {
      const sessionData = { actions: [] };
      const result = await aiEvaluationService.analyzePatterns(sessionData);
      expect(result.commonPatterns).toHaveLength(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies correctly', async () => {
      const sessionData = {
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '1000mg' } } // High dose anomaly
        ]
      };

      const result = await aiEvaluationService.detectAnomalies(sessionData);

      expect(result).toHaveProperty('medicationAnomalies');
      expect(result).toHaveProperty('timingAnomalies');
      expect(result).toHaveProperty('sequenceAnomalies');
      expect(result.medicationAnomalies.length).toBeGreaterThan(0);
    });

    it('should return empty anomalies for normal session', async () => {
      const sessionData = {
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '100mg' } }
        ]
      };

      const result = await aiEvaluationService.detectAnomalies(sessionData);
      expect(result.medicationAnomalies).toHaveLength(0);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate confidence score based on data quality', async () => {
      const sessionData = {
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80', timestamp: new Date() } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '100mg', timestamp: new Date() } }
        ],
        duration: 300 // 5 minutes
      };

      const result = await aiEvaluationService.calculateConfidenceScore(sessionData);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should have lower confidence for incomplete data', async () => {
      const sessionData = {
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure' } } // Missing value and timestamp
        ],
        duration: 60 // 1 minute
      };

      const result = await aiEvaluationService.calculateConfidenceScore(sessionData);
      expect(result).toBeLessThan(0.5);
    });
  });
});