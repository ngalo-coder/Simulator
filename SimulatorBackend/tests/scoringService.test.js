import ScoringService from '../src/services/ScoringService.js';
import ScoringRubricModel from '../src/models/ScoringRubricModel.js';
import SessionModel from '../src/models/SessionModel.js';
import PerformanceMetrics from '../src/models/PerformanceMetricsModel.js';

// Mock dependencies
jest.mock('../src/models/ScoringRubricModel.js');
jest.mock('../src/models/SessionModel.js');
jest.mock('../src/models/PerformanceMetricsModel.js');

describe('ScoringService', () => {
  let scoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
    jest.clearAllMocks();
  });

  describe('scoreSession', () => {
    it('should calculate session score correctly', async () => {
      const sessionData = {
        _id: 'session-123',
        userId: 'user-456',
        caseId: 'case-789',
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '100mg' } }
        ],
        save: jest.fn().mockReturnThis()
      };

      const performanceMetrics = {
        dataCollectionMetrics: { completeness: 0.8 },
        clinicalSkillsMetrics: { physicalExamAccuracy: 0.9 },
        diagnosticMetrics: { accuracy: 0.7 },
        communicationMetrics: { patientCommunication: 0.85, teamCommunication: 0.95 },
        timeMetrics: { efficiency: 0.75 },
        safetyMetrics: { overallScore: 0.98 }
      };

      SessionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(sessionData),
      });
      PerformanceMetrics.findOne.mockResolvedValue(performanceMetrics);

      const result = await scoringService.scoreSession('session-123');

      expect(result).toHaveProperty('finalScore');
      expect(result).toHaveProperty('criteriaScores');
      expect(result.criteriaScores).toHaveLength(7);
      expect(SessionModel.findById).toHaveBeenCalledWith('session-123');
      expect(PerformanceMetrics.findOne).toHaveBeenCalledWith({ sessionId: 'session-123' });
      expect(sessionData.save).toHaveBeenCalled();
    });

    it('should throw error if session not found', async () => {
      SessionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(scoringService.scoreSession('nonexistent-session'))
        .rejects
        .toThrow('Session not found');
    });

    it('should throw error if performance metrics not found', async () => {
      const sessionData = {
        _id: 'session-123',
        userId: 'user-456',
        caseId: 'case-789',
        actions: []
      };
      SessionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(sessionData),
      });
      PerformanceMetrics.findOne.mockResolvedValue(null);

      await expect(scoringService.scoreSession('session-123'))
        .rejects
        .toThrow('Performance metrics not found for session');
    });
  });
});