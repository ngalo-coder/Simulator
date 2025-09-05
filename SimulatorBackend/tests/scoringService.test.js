import ScoringService from '../src/services/ScoringService.js';
import ScoringRubricModel from '../src/models/ScoringRubricModel.js';
import SessionModel from '../src/models/SessionModel.js';

// Mock dependencies
jest.mock('../src/models/ScoringRubricModel.js');
jest.mock('../src/models/SessionModel.js');

describe('ScoringService', () => {
  let scoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
    jest.clearAllMocks();
  });

  describe('initializeScoringRubric', () => {
    it('should create a new scoring rubric successfully', async () => {
      const rubricData = {
        rubricId: 'test-rubric-1',
        name: 'Medical Assessment Rubric',
        discipline: 'medical',
        competencyAreas: [
          {
            area: 'Clinical Skills',
            weight: 0.4,
            criteria: [
              {
                criterion: 'Patient Assessment',
                description: 'Thoroughness of patient evaluation',
                maxScore: 10,
                performanceLevels: [
                  { level: 'Novice', score: 0, description: 'No assessment performed' },
                  { level: 'Competent', score: 7, description: 'Basic assessment completed' },
                  { level: 'Expert', score: 10, description: 'Comprehensive assessment' }
                ]
              }
            ]
          }
        ]
      };

      ScoringRubricModel.prototype.save = jest.fn().mockResolvedValue(rubricData);
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await scoringService.initializeScoringRubric(rubricData);

      expect(result).toEqual(rubricData);
      expect(ScoringRubricModel.findOne).toHaveBeenCalledWith({ rubricId: 'test-rubric-1' });
      expect(ScoringRubricModel.prototype.save).toHaveBeenCalled();
    });

    it('should throw error if rubric already exists', async () => {
      const rubricData = { rubricId: 'existing-rubric' };
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(rubricData);

      await expect(scoringService.initializeScoringRubric(rubricData))
        .rejects
        .toThrow('Scoring rubric with ID existing-rubric already exists');
    });
  });

  describe('scoreSession', () => {
    it('should calculate session score correctly', async () => {
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
          },
          {
            area: 'Treatment Planning',
            weight: 0.4,
            criteria: [
              {
                criterion: 'Medication Administration',
                maxScore: 10,
                performanceLevels: [
                  { level: 'Novice', score: 0 },
                  { level: 'Competent', score: 8 },
                  { level: 'Expert', score: 10 }
                ]
              }
            ]
          }
        ]
      };

      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(rubricData);
      SessionModel.findById = jest.fn().mockResolvedValue(sessionData);
      SessionModel.prototype.save = jest.fn().mockResolvedValue(sessionData);

      const result = await scoringService.scoreSession('session-123', 'medical-rubric');

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('areaScores');
      expect(result.areaScores).toHaveLength(2);
      expect(SessionModel.findById).toHaveBeenCalledWith('session-123');
      expect(ScoringRubricModel.findOne).toHaveBeenCalledWith({ rubricId: 'medical-rubric' });
    });

    it('should throw error if session not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue(null);

      await expect(scoringService.scoreSession('nonexistent-session', 'medical-rubric'))
        .rejects
        .toThrow('Session not found');
    });

    it('should throw error if rubric not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue({});
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(scoringService.scoreSession('session-123', 'nonexistent-rubric'))
        .rejects
        .toThrow('Scoring rubric not found');
    });
  });

  describe('getSessionScores', () => {
    it('should retrieve session scores for a user', async () => {
      const mockSessions = [
        { _id: 'session-1', overallScore: 85, areaScores: [] },
        { _id: 'session-2', overallScore: 92, areaScores: [] }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await scoringService.getSessionScores('user-123', 10);

      expect(result).toEqual(mockSessions);
      expect(SessionModel.find).toHaveBeenCalledWith({ userId: 'user-123', overallScore: { $exists: true } });
    });

    it('should return empty array if no scores found', async () => {
      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      const result = await scoringService.getSessionScores('user-123', 10);
      expect(result).toEqual([]);
    });
  });

  describe('calculateWeightedScore', () => {
    it('should calculate weighted score correctly', () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 80, weight: 0.6 },
        { area: 'Treatment Planning', score: 90, weight: 0.4 }
      ];

      const result = scoringService.calculateWeightedScore(areaScores);
      expect(result).toBe(84); // (80 * 0.6) + (90 * 0.4) = 48 + 36 = 84
    });

    it('should handle zero weights', () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 80, weight: 0 },
        { area: 'Treatment Planning', score: 90, weight: 1 }
      ];

      const result = scoringService.calculateWeightedScore(areaScores);
      expect(result).toBe(90);
    });

    it('should throw error if weights dont sum to 1', () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 80, weight: 0.3 },
        { area: 'Treatment Planning', score: 90, weight: 0.3 }
      ];

      expect(() => scoringService.calculateWeightedScore(areaScores))
        .toThrow('Weights must sum to 1');
    });
  });
});