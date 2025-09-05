import mongoose from 'mongoose';
import AnalyticsService from '../src/services/AnalyticsService.js';
import FeedbackService from '../src/services/FeedbackService.js';
import QualityCheckService from '../src/services/QualityCheckService.js';
import ContributedCase from '../src/models/ContributedCaseModel.js';
import Feedback from '../src/models/FeedbackModel.js';
import PerformanceMetrics from '../src/models/PerformanceMetricsModel.js';

// Mock data for testing
const mockCaseData = {
  contributorId: 'test-contributor-1',
  contributorName: 'Test Contributor',
  contributorEmail: 'test@example.com',
  status: 'approved',
  caseData: {
    case_metadata: {
      case_id: 'TEST-CASE-001',
      title: 'Test Case for Quality Assurance',
      specialty: 'Internal Medicine',
      program_area: 'Specialty Program',
      difficulty: 'Intermediate',
      location: 'Clinic'
    },
    patient_persona: {
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      chief_complaint: 'Chest pain',
      emotional_tone: 'Anxious'
    },
    initial_prompt: 'Patient presents with chest pain',
    clinical_dossier: {
      hidden_diagnosis: 'Myocardial Infarction',
      history_of_presenting_illness: {
        onset: 'Sudden',
        location: 'Chest',
        character: 'Crushing',
        severity: 8
      }
    }
  },
  reviewScore: 4.5,
  qualityRating: 4.2,
  educationalValueRating: 4.0,
  clinicalAccuracyRating: 4.5
};

describe('Quality Assurance and Analytics System', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/simulator_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await ContributedCase.deleteMany({});
    await Feedback.deleteMany({});
    await PerformanceMetrics.deleteMany({});
  });

  describe('AnalyticsService', () => {
    test('should get case usage analytics', async () => {
      // Create test case
      const testCase = await ContributedCase.create(mockCaseData);

      const analytics = await AnalyticsService.getCaseUsageAnalytics({
        timeRange: '7d',
        specialty: 'Internal Medicine'
      });

      expect(analytics).toHaveProperty('usage');
      expect(analytics).toHaveProperty('performance');
      expect(analytics).toHaveProperty('reviewQuality');
      expect(analytics).toHaveProperty('engagement');
      expect(analytics).toHaveProperty('difficultyEffectiveness');
      expect(analytics.timeRange).toBe('7d');
    });

    test('should get case effectiveness metrics', async () => {
      const testCase = await ContributedCase.create(mockCaseData);
      
      const metrics = await AnalyticsService.getCaseEffectivenessMetrics(testCase._id);
      
      expect(Array.isArray(metrics)).toBe(true);
    });

    test('should get difficulty analysis', async () => {
      await ContributedCase.create(mockCaseData);
      
      const analysis = await AnalyticsService.getDifficultyAnalysis({
        specialty: 'Internal Medicine'
      });
      
      expect(Array.isArray(analysis)).toBe(true);
    });

    test('should get performance trends', async () => {
      const trends = await AnalyticsService.getPerformanceTrends('30d', 'week');
      
      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('FeedbackService', () => {
    test('should submit and process feedback', async () => {
      const testCase = await ContributedCase.create(mockCaseData);
      
      const feedbackData = {
        userId: 'test-user-1',
        caseId: testCase._id,
        feedbackType: 'case_quality',
        rating: 4,
        comments: 'Excellent case, very educational'
      };

      const feedback = await FeedbackService.submitFeedback(feedbackData);
      
      expect(feedback).toHaveProperty('_id');
      expect(feedback.feedbackType).toBe('case_quality');
      expect(feedback.rating).toBe(4);
      expect(feedback.sentiment).toBeDefined();

      // Verify case ratings were updated
      const updatedCase = await ContributedCase.findById(testCase._id);
      expect(updatedCase.studentFeedbackCount).toBe(1);
      expect(updatedCase.averageStudentRating).toBe(4);
    });

    test('should get feedback analytics', async () => {
      const testCase = await ContributedCase.create(mockCaseData);
      
      // Submit multiple feedback entries
      await FeedbackService.submitFeedback({
        userId: 'user1',
        caseId: testCase._id,
        feedbackType: 'case_quality',
        rating: 5,
        comments: 'Great case!'
      });

      await FeedbackService.submitFeedback({
        userId: 'user2',
        caseId: testCase._id,
        feedbackType: 'case_quality',
        rating: 3,
        comments: 'Average case'
      });

      const analytics = await FeedbackService.getFeedbackAnalytics({
        timeRange: '7d',
        feedbackType: 'case_quality'
      });

      expect(analytics).toHaveProperty('summary');
      expect(analytics).toHaveProperty('sentimentDistribution');
      expect(analytics).toHaveProperty('trendingIssues');
      expect(analytics.totalFeedback).toBeGreaterThan(0);
    });
  });

  describe('QualityCheckService', () => {
    test('should run quality checks on case', async () => {
      const testCase = await ContributedCase.create(mockCaseData);
      
      const qualityResults = await QualityCheckService.runQualityChecks(testCase._id);
      
      expect(qualityResults).toHaveProperty('caseId');
      expect(qualityResults).toHaveProperty('overallScore');
      expect(qualityResults).toHaveProperty('passed');
      expect(qualityResults).toHaveProperty('checks');
      expect(qualityResults).toHaveProperty('recommendations');
      
      // Verify quality flags were updated
      const updatedCase = await ContributedCase.findById(testCase._id);
      expect(updatedCase.qualityFlags.lastQualityCheck).toBeDefined();
    });

    test('should validate required fields', async () => {
      const testCase = await ContributedCase.create(mockCaseData);
      
      const results = await QualityCheckService.runQualityChecks(testCase._id);
      
      // Check that required fields validation passed
      const requiredFieldsCheck = results.checks.requiredFields;
      expect(requiredFieldsCheck.passed).toBe(true);
      expect(requiredFieldsCheck.missingFields).toHaveLength(0);
    });

    test('should detect missing required fields', async () => {
      const incompleteCase = { ...mockCaseData };
      delete incompleteCase.caseData.patient_persona.name;
      
      const testCase = await ContributedCase.create(incompleteCase);
      
      const results = await QualityCheckService.runQualityChecks(testCase._id);
      
      const requiredFieldsCheck = results.checks.requiredFields;
      expect(requiredFieldsCheck.passed).toBe(false);
      expect(requiredFieldsCheck.missingFields.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should update case metrics with performance data', async () => {
      const testCase = await ContributedCase.create(mockCaseData);
      
      // Create performance metrics
      await PerformanceMetrics.create({
        session_ref: new mongoose.Types.ObjectId(),
        case_ref: testCase._id,
        user_ref: new mongoose.Types.ObjectId(),
        metrics: {
          overall_score: 85,
          history_taking_rating: 'Excellent',
          risk_factor_assessment_rating: 'Good',
          communication_and_empathy_rating: 'Excellent'
        },
        raw_evaluation_text: 'Excellent performance'
      });

      // Run quality checks which should update case effectiveness metrics
      await QualityCheckService.runQualityChecks(testCase._id);
      
      const updatedCase = await ContributedCase.findById(testCase._id);
      
      expect(updatedCase.effectivenessMetrics.totalSessions).toBe(1);
      expect(updatedCase.effectivenessMetrics.averageScore).toBe(85);
      expect(updatedCase.effectivenessMetrics.passRate).toBe(100);
      expect(updatedCase.effectivenessMetrics.excellentRate).toBe(100);
    });

    test('should handle batch quality checks', async () => {
      // Create multiple test cases
      await ContributedCase.create(mockCaseData);
      await ContributedCase.create({
        ...mockCaseData,
        caseData: {
          ...mockCaseData.caseData,
          case_metadata: {
            ...mockCaseData.caseData.case_metadata,
            case_id: 'TEST-CASE-002'
          }
        }
      });

      const batchResults = await QualityCheckService.runBatchQualityChecks();
      
      expect(Array.isArray(batchResults)).toBe(true);
      expect(batchResults.length).toBe(2);
      batchResults.forEach(result => {
        expect(result).toHaveProperty('caseId');
        expect(result).toHaveProperty('passed');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent case in quality checks', async () => {
      const nonExistentCaseId = new mongoose.Types.ObjectId();
      
      await expect(QualityCheckService.runQualityChecks(nonExistentCaseId))
        .rejects
        .toThrow('Case not found');
    });

    test('should handle invalid feedback submission', async () => {
      await expect(FeedbackService.submitFeedback({
        userId: 'test-user',
        // Missing required fields
      })).rejects.toThrow();
    });

    test('should handle analytics with no data', async () => {
      const analytics = await AnalyticsService.getCaseUsageAnalytics({
        timeRange: '7d',
        specialty: 'NonExistentSpecialty'
      });
      
      expect(analytics).toBeDefined();
      expect(analytics.usage).toBeDefined();
      expect(analytics.performance).toBeDefined();
    });
  });
});