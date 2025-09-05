import mongoose from 'mongoose';
import ProgressAnalyticsService from '../src/services/ProgressAnalyticsService.js';
import StudentProgress from '../src/models/StudentProgressModel.js';
import ClinicianProgress from '../src/models/ClinicianProgressModel.js';
import PerformanceMetrics from '../src/models/PerformanceMetricsModel.js';
import Case from '../src/models/CaseModel.js';
import User from '../src/models/UserModel.js';

// Mock data for testing
const mockUserId = new mongoose.Types.ObjectId();
const mockCaseId = new mongoose.Types.ObjectId();
const mockCompetencyId = new mongoose.Types.ObjectId();

describe('Progress Analytics Service', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/test_simulator');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await StudentProgress.deleteMany({});
    await ClinicianProgress.deleteMany({});
    await PerformanceMetrics.deleteMany({});
    await Case.deleteMany({});
    await User.deleteMany({});

    // Create test user
    await User.create({
      _id: mockUserId,
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'student',
      firstName: 'Test',
      lastName: 'User'
    });

    // Create test case
    await Case.create({
      _id: mockCaseId,
      case_metadata: {
        title: 'Test Case',
        difficulty: 'Beginner',
        specialty: 'General Medicine',
        program_area: 'Internal Medicine',
        competencies: [mockCompetencyId]
      }
    });

    // Create test performance metrics
    await PerformanceMetrics.create({
      user_ref: mockUserId,
      case_ref: mockCaseId,
      metrics: {
        overall_score: 85,
        history_taking_rating: 4,
        risk_factor_assessment_rating: 3,
        differential_diagnosis_questioning_rating: 4,
        communication_and_empathy_rating: 5,
        clinical_urgency_rating: 3
      },
      session_duration: 1800,
      evaluated_at: new Date()
    });
  });

  describe('Real-time Progress Calculation', () => {
    test('should return real-time progress data for a user', async () => {
      // Create test student progress
      await StudentProgress.create({
        userId: mockUserId,
        overallProgress: {
          totalCasesAttempted: 10,
          totalCasesCompleted: 8,
          totalLearningHours: 5,
          overallScore: 82,
          currentLevel: 'Competent',
          experiencePoints: 500
        },
        competencies: [{
          competencyId: mockCompetencyId,
          competencyName: 'Diagnostic Accuracy',
          proficiencyLevel: 'Competent',
          score: 82,
          casesAttempted: 5,
          casesMastered: 3,
          lastAssessed: new Date()
        }],
        caseAttempts: [{
          caseId: mockCaseId,
          caseTitle: 'Test Case',
          attemptNumber: 1,
          startTime: new Date(Date.now() - 86400000), // 1 day ago
          endTime: new Date(Date.now() - 86300000), // 1 day ago + 1000 seconds
          duration: 1000,
          score: 85,
          status: 'completed'
        }]
      });

      const progressData = await ProgressAnalyticsService.getRealTimeProgress(mockUserId);

      expect(progressData).toBeDefined();
      expect(progressData.studentProgress).toBeDefined();
      expect(progressData.clinicianProgress).toBeDefined();
      expect(progressData.recentPerformance).toBeDefined();
      expect(progressData.currentLevel).toBe('Competent');
      expect(progressData.progressRate).toBeDefined();
      expect(progressData.competencyTrends).toBeDefined();
      expect(progressData.benchmarkComparison).toBeDefined();
      expect(progressData.predictedOutcomes).toBeDefined();
    });

    test('should handle users with no progress data', async () => {
      const progressData = await ProgressAnalyticsService.getRealTimeProgress(new mongoose.Types.ObjectId());

      expect(progressData).toBeDefined();
      expect(progressData.studentProgress).toEqual({});
      expect(progressData.clinicianProgress).toEqual({});
      expect(progressData.currentLevel).toBe('Novice');
    });
  });

  describe('Competency Trend Analysis', () => {
    test('should analyze competency trends over time', async () => {
      await StudentProgress.create({
        userId: mockUserId,
        competencies: [{
          competencyId: mockCompetencyId,
          competencyName: 'Diagnostic Accuracy',
          proficiencyLevel: 'Competent',
          score: 82,
          casesAttempted: 5,
          casesMastered: 3,
          lastAssessed: new Date()
        }],
        caseAttempts: [
          {
            caseId: mockCaseId,
            caseTitle: 'Test Case 1',
            attemptNumber: 1,
            startTime: new Date(Date.now() - 86400000 * 7), // 7 days ago
            endTime: new Date(Date.now() - 86400000 * 7 + 1000),
            duration: 1000,
            score: 70,
            status: 'completed'
          },
          {
            caseId: mockCaseId,
            caseTitle: 'Test Case 2',
            attemptNumber: 2,
            startTime: new Date(Date.now() - 86400000 * 3), // 3 days ago
            endTime: new Date(Date.now() - 86400000 * 3 + 800),
            duration: 800,
            score: 85,
            status: 'completed'
          }
        ]
      });

      const trends = await ProgressAnalyticsService.analyzeCompetencyTrends(mockUserId, {
        timeRange: '30d',
        granularity: 'week'
      });

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    test('should handle empty case attempts', async () => {
      await StudentProgress.create({
        userId: mockUserId,
        competencies: [],
        caseAttempts: []
      });

      const trends = await ProgressAnalyticsService.analyzeCompetencyTrends(mockUserId);
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(0);
    });
  });

  describe('Benchmark Comparison', () => {
    test('should compare user performance against benchmarks', async () => {
      await StudentProgress.create({
        userId: mockUserId,
        overallProgress: {
          totalCasesAttempted: 15,
          totalCasesCompleted: 12,
          overallScore: 78,
          currentLevel: 'Competent'
        }
      });

      const comparison = await ProgressAnalyticsService.compareToBenchmarks(mockUserId, {
        specialty: 'General Medicine'
      });

      expect(comparison).toBeDefined();
      expect(comparison.userPerformance).toBeDefined();
      expect(comparison.peerComparison).toBeDefined();
      expect(comparison.expertGap).toBeDefined();
      expect(comparison.relativeRanking).toBeDefined();
      expect(comparison.improvementAreas).toBeDefined();
    });
  });

  describe('Learning Outcome Prediction', () => {
    test('should predict learning outcomes based on progress', async () => {
      await StudentProgress.create({
        userId: mockUserId,
        competencies: [{
          competencyId: mockCompetencyId,
          competencyName: 'Diagnostic Accuracy',
          proficiencyLevel: 'Competent',
          score: 78,
          casesAttempted: 8,
          casesMastered: 4,
          lastAssessed: new Date()
        }],
        caseAttempts: [
          {
            caseId: mockCaseId,
            caseTitle: 'Test Case',
            attemptNumber: 1,
            startTime: new Date(Date.now() - 86400000 * 14), // 14 days ago
            endTime: new Date(Date.now() - 86400000 * 14 + 1200),
            duration: 1200,
            score: 65,
            status: 'completed'
          },
          {
            caseId: mockCaseId,
            caseTitle: 'Test Case',
            attemptNumber: 2,
            startTime: new Date(Date.now() - 86400000 * 7), // 7 days ago
            endTime: new Date(Date.now() - 86400000 * 7 + 900),
            duration: 900,
            score: 78,
            status: 'completed'
          }
        ]
      });

      const predictions = await ProgressAnalyticsService.predictLearningOutcomes(mockUserId);

      expect(predictions).toBeDefined();
      expect(predictions.predictedProficiency).toBeDefined();
      expect(predictions.estimatedMasteryTime).toBeDefined();
      expect(predictions.competencyGapAnalysis).toBeDefined();
      expect(predictions.recommendedLearningPath).toBeDefined();
      expect(predictions.confidenceScores).toBeDefined();
    });
  });

  describe('Visualization Data Generation', () => {
    test('should generate visualization-ready data', async () => {
      await StudentProgress.create({
        userId: mockUserId,
        overallProgress: {
          totalCasesAttempted: 10,
          totalCasesCompleted: 8,
          overallScore: 82,
          currentLevel: 'Competent'
        },
        competencies: [{
          competencyId: mockCompetencyId,
          competencyName: 'Diagnostic Accuracy',
          proficiencyLevel: 'Competent',
          score: 82,
          casesAttempted: 5,
          casesMastered: 3,
          lastAssessed: new Date()
        }]
      });

      const visualizationData = await ProgressAnalyticsService.getVisualizationData(mockUserId);

      expect(visualizationData).toBeDefined();
      expect(visualizationData.progressCharts).toBeDefined();
      expect(visualizationData.trendGraphs).toBeDefined();
      expect(visualizationData.benchmarkVisualizations).toBeDefined();
      expect(visualizationData.predictionVisualizations).toBeDefined();
      expect(visualizationData.summaryMetrics).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    test('should clear analytics cache', async () => {
      // First call to populate cache
      await ProgressAnalyticsService.getRealTimeProgress(mockUserId);
      
      // Clear cache
      ProgressAnalyticsService.clearCache();
      
      // The service should continue to work after cache clearance
      const progressData = await ProgressAnalyticsService.getRealTimeProgress(mockUserId);
      expect(progressData).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid user IDs gracefully', async () => {
      await expect(ProgressAnalyticsService.getRealTimeProgress('invalid-id'))
        .rejects
        .toThrow();
    });

    test('should handle database errors gracefully', async () => {
      // Simulate database error by closing connection
      await mongoose.connection.close();
      
      await expect(ProgressAnalyticsService.getRealTimeProgress(mockUserId))
        .rejects
        .toThrow();
      
      // Reconnect for other tests
      await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/test_simulator');
    });
  });
});