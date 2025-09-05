const AssessmentAnalyticsService = require('../src/services/AssessmentAnalyticsService');
const SessionModel = require('../src/models/SessionModel');
const UserModel = require('../src/models/UserModel');

// Mock dependencies
jest.mock('../src/models/SessionModel');
jest.mock('../src/models/UserModel');

describe('AssessmentAnalyticsService', () => {
  let assessmentAnalyticsService;

  beforeEach(() => {
    assessmentAnalyticsService = new AssessmentAnalyticsService();
    jest.clearAllMocks();
  });

  describe('analyzePerformanceTrends', () => {
    it('should analyze performance trends for a user', async () => {
      const mockSessions = [
        { _id: 'session-1', overallScore: 75, createdAt: new Date('2024-01-01') },
        { _id: 'session-2', overallScore: 85, createdAt: new Date('2024-01-02') },
        { _id: 'session-3', overallScore: 90, createdAt: new Date('2024-01-03') }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await assessmentAnalyticsService.analyzePerformanceTrends('user-123', 10);

      expect(result).toHaveProperty('trendData');
      expect(result).toHaveProperty('trendDirection');
      expect(result).toHaveProperty('improvementRate');
      expect(result).toHaveProperty('consistencyScore');
      expect(SessionModel.find).toHaveBeenCalledWith({ userId: 'user-123', overallScore: { $exists: true } });
    });

    it('should calculate positive trend correctly', async () => {
      const mockSessions = [
        { overallScore: 70, createdAt: new Date('2024-01-01') },
        { overallScore: 80, createdAt: new Date('2024-01-02') },
        { overallScore: 90, createdAt: new Date('2024-01-03') }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await assessmentAnalyticsService.analyzePerformanceTrends('user-123', 3);
      expect(result.trendDirection).toBe('improving');
      expect(result.improvementRate).toBeGreaterThan(0);
    });

    it('should calculate negative trend correctly', async () => {
      const mockSessions = [
        { overallScore: 90, createdAt: new Date('2024-01-01') },
        { overallScore: 80, createdAt: new Date('2024-01-02') },
        { overallScore: 70, createdAt: new Date('2024-01-03') }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await assessmentAnalyticsService.analyzePerformanceTrends('user-123', 3);
      expect(result.trendDirection).toBe('declining');
      expect(result.improvementRate).toBeLessThan(0);
    });

    it('should handle no sessions', async () => {
      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      const result = await assessmentAnalyticsService.analyzePerformanceTrends('user-123', 10);
      expect(result.trendData).toHaveLength(0);
      expect(result.trendDirection).toBe('stable');
    });
  });

  describe('identifyCompetencyGaps', () => {
    it('should identify competency gaps from session data', async () => {
      const mockSessions = [
        {
          areaScores: [
            { area: 'Clinical Skills', score: 60, weight: 0.6 },
            { area: 'Treatment Planning', score: 85, weight: 0.4 }
          ]
        },
        {
          areaScores: [
            { area: 'Clinical Skills', score: 65, weight: 0.6 },
            { area: 'Treatment Planning', score: 90, weight: 0.4 }
          ]
        }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await assessmentAnalyticsService.identifyCompetencyGaps('user-123', 10);

      expect(result).toHaveProperty('gapAreas');
      expect(result).toHaveProperty('priorityAreas');
      expect(result).toHaveProperty('recommendedActions');
      expect(result.gapAreas).toContain('Clinical Skills');
      expect(result.gapAreas).not.toContain('Treatment Planning');
    });

    it('should return empty gaps for consistent high performance', async () => {
      const mockSessions = [
        {
          areaScores: [
            { area: 'Clinical Skills', score: 90, weight: 0.6 },
            { area: 'Treatment Planning', score: 85, weight: 0.4 }
          ]
        }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await assessmentAnalyticsService.identifyCompetencyGaps('user-123', 10);
      expect(result.gapAreas).toHaveLength(0);
    });
  });

  describe('generatePredictiveInsights', () => {
    it('should generate predictive insights based on performance data', async () => {
      const mockSessions = [
        { overallScore: 70, createdAt: new Date('2024-01-01') },
        { overallScore: 75, createdAt: new Date('2024-01-02') },
        { overallScore: 80, createdAt: new Date('2024-01-03') }
      ];

      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      const result = await assessmentAnalyticsService.generatePredictiveInsights('user-123', 10);

      expect(result).toHaveProperty('predictedScore');
      expect(result).toHaveProperty('confidenceLevel');
      expect(result).toHaveProperty('timelineProjection');
      expect(result).toHaveProperty('riskFactors');
      expect(result.predictedScore).toBeGreaterThan(80);
    });

    it('should handle insufficient data for predictions', async () => {
      SessionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      const result = await assessmentAnalyticsService.generatePredictiveInsights('user-123', 10);
      expect(result.predictedScore).toBeNull();
      expect(result.confidenceLevel).toBe('low');
    });
  });

  describe('compareWithPeerPerformance', () => {
    it('should compare user performance with peers', async () => {
      const userSessions = [
        { overallScore: 85, createdAt: new Date('2024-01-01') }
      ];

      const peerSessions = [
        { overallScore: 80, createdAt: new Date('2024-01-01') },
        { overallScore: 90, createdAt: new Date('2024-01-01') },
        { overallScore: 85, createdAt: new Date('2024-01-01') }
      ];

      SessionModel.find = jest.fn()
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(userSessions)
          })
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(peerSessions)
          })
        });

      UserModel.countDocuments = jest.fn().mockResolvedValue(100);

      const result = await assessmentAnalyticsService.compareWithPeerPerformance('user-123', 'medical');

      expect(result).toHaveProperty('percentileRank');
      expect(result).toHaveProperty('comparisonMetrics');
      expect(result).toHaveProperty('benchmarkData');
      expect(result.percentileRank).toBeGreaterThanOrEqual(0);
      expect(result.percentileRank).toBeLessThanOrEqual(100);
    });

    it('should handle no peer data', async () => {
      SessionModel.find = jest.fn()
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ overallScore: 85 }])
          })
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        });

      UserModel.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await assessmentAnalyticsService.compareWithPeerPerformance('user-123', 'medical');
      expect(result.percentileRank).toBeNull();
    });
  });
});