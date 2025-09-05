import mongoose from 'mongoose';
import adaptiveLearningService from '../src/services/AdaptiveLearningService.js';
import userPreferencesService from '../src/services/UserPreferencesService.js';
import User from '../src/models/UserModel.js';
import Case from '../src/models/CaseModel.js';
import StudentProgress from '../src/models/StudentProgressModel.js';

// Mock user data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  email: 'test.student@example.com',
  profile: {
    firstName: 'Test',
    lastName: 'Student',
    discipline: 'medicine'
  }
};

// Mock case data
const mockCase = {
  _id: new mongoose.Types.ObjectId(),
  case_metadata: {
    title: 'Test Medical Case',
    difficulty: 'intermediate',
    specialty: 'internal_medicine',
    competencies: ['diagnosis', 'treatment_planning']
  },
  description: 'A test medical case for adaptive learning testing',
  patient_persona: {
    age_group: 'adult',
    gender: 'male'
  }
};

// Mock interactions data
const mockInteractions = [
  {
    user_id: mockUser._id,
    content_type: 'video',
    interaction_type: 'view',
    duration: 300, // 5 minutes
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    user_id: mockUser._id,
    content_type: 'text',
    interaction_type: 'read',
    duration: 600, // 10 minutes
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1) // 1 hour ago
  },
  {
    user_id: mockUser._id,
    content_type: 'interactive',
    interaction_type: 'practice',
    duration: 900, // 15 minutes
    timestamp: new Date() // now
  }
];

// Mock progress data
const mockProgress = [
  {
    userId: mockUser._id,
    performanceScore: 85,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 1 week ago
  },
  {
    userId: mockUser._id,
    performanceScore: 92,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
  },
  {
    userId: mockUser._id,
    performanceScore: 78,
    createdAt: new Date() // now
  }
];

describe('Adaptive Learning Service', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/simulator_test');
  });

  beforeEach(async () => {
    // Clear collections
    await mongoose.connection.db.collection('user_interactions').deleteMany({});
    await mongoose.connection.db.collection('repetition_schedules').deleteMany({});
    await StudentProgress.deleteMany({});
    
    // Insert test data
    await mongoose.connection.db.collection('user_interactions').insertMany(mockInteractions);
    await StudentProgress.insertMany(mockProgress);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Learning Style Assessment', () => {
    test('should assess learning style based on interactions', async () => {
      const assessment = await adaptiveLearningService.assessLearningStyle(mockUser);
      
      expect(assessment).toHaveProperty('dominantStyle');
      expect(assessment).toHaveProperty('styleScores');
      expect(assessment).toHaveProperty('confidence');
      expect(assessment).toHaveProperty('assessmentDate');
      expect(assessment).toHaveProperty('recommendations');
      
      expect(assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(assessment.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(assessment.recommendations)).toBe(true);
    });

    test('should return valid learning style recommendations', () => {
      const recommendations = adaptiveLearningService.getLearningStyleRecommendations('visual');
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(rec => typeof rec === 'string')).toBe(true);
    });
  });

  describe('Difficulty Adjustment', () => {
    test('should adjust difficulty based on performance', async () => {
      const adjustment = await adaptiveLearningService.adjustDifficulty(mockUser, mockCase, 85);
      
      expect(adjustment).toHaveProperty('originalDifficulty');
      expect(adjustment).toHaveProperty('adjustedDifficulty');
      expect(adjustment).toHaveProperty('adjustmentReason');
      expect(adjustment).toHaveProperty('confidence');
      expect(adjustment).toHaveProperty('recommendedCases');
      
      expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(adjustment.adjustedDifficulty);
      expect(adjustment.confidence).toBeGreaterThanOrEqual(0);
      expect(adjustment.confidence).toBeLessThanOrEqual(100);
    });

    test('should calculate appropriate difficulty adjustment', () => {
      const adjustment = adaptiveLearningService.calculateDifficultyAdjustment(85, { attempts: 10, scores: [80, 85, 90] }, 'intermediate');
      
      expect(typeof adjustment).toBe('number');
      expect(adjustment).toBeGreaterThanOrEqual(-2);
      expect(adjustment).toBeLessThanOrEqual(2);
    });

    test('should apply difficulty adjustment correctly', () => {
      const adjusted = adaptiveLearningService.applyDifficultyAdjustment('intermediate', 1);
      expect(adjusted).toBe('advanced');
      
      const decreased = adaptiveLearningService.applyDifficultyAdjustment('intermediate', -1);
      expect(decreased).toBe('beginner');
    });
  });

  describe('Spaced Repetition', () => {
    test('should schedule spaced repetition', async () => {
      const schedule = await adaptiveLearningService.scheduleSpacedRepetition(mockUser, 'diagnosis', 85);
      
      expect(schedule).toHaveProperty('competency');
      expect(schedule).toHaveProperty('nextReviewDate');
      expect(schedule).toHaveProperty('interval');
      expect(schedule).toHaveProperty('performanceScore');
      expect(schedule).toHaveProperty('confidence');
      expect(schedule).toHaveProperty('recommendedActivities');
      
      expect(schedule.competency).toBe('diagnosis');
      expect(schedule.performanceScore).toBe(85);
      expect(schedule.interval).toBeGreaterThan(0);
      expect(Array.isArray(schedule.recommendedActivities)).toBe(true);
    });

    test('should calculate next interval correctly', () => {
      const history = [
        { performanceScore: 85, interval: 1 },
        { performanceScore: 90, interval: 4 }
      ];
      
      const interval = adaptiveLearningService.calculateNextInterval(95, history);
      expect(interval).toBeGreaterThan(0);
    });
  });

  describe('Learning Efficiency Optimization', () => {
    test('should optimize learning efficiency', async () => {
      const efficiency = await adaptiveLearningService.optimizeLearningEfficiency(mockUser);
      
      expect(efficiency).toHaveProperty('efficiencyScore');
      expect(efficiency).toHaveProperty('learningPatterns');
      expect(efficiency).toHaveProperty('performanceData');
      expect(efficiency).toHaveProperty('scheduleAnalysis');
      expect(efficiency).toHaveProperty('recommendations');
      
      expect(efficiency.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(efficiency.efficiencyScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(efficiency.recommendations)).toBe(true);
    });
  });
});

describe('User Preferences Service', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/simulator_test');
  });

  beforeEach(async () => {
    await mongoose.connection.db.collection('user_preferences').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should get default preferences for new user', async () => {
    const preferences = await userPreferencesService.getUserPreferences(mockUser);
    
    expect(preferences).toHaveProperty('theme');
    expect(preferences).toHaveProperty('layout');
    expect(preferences).toHaveProperty('fontSize');
    expect(preferences).toHaveProperty('notifications');
    expect(preferences).toHaveProperty('accessibility');
    expect(preferences).toHaveProperty('learning_goals');
    expect(preferences).toHaveProperty('interface');
    expect(preferences).toHaveProperty('content_preferences');
  });

  test('should update user preferences', async () => {
    const updates = {
      theme: 'dark',
      fontSize: 'large',
      notifications: {
        enabled: true,
        channels: ['email', 'in_app']
      }
    };

    const updated = await userPreferencesService.updateUserPreferences(mockUser, updates);
    
    expect(updated.theme).toBe('dark');
    expect(updated.fontSize).toBe('large');
    expect(updated.notifications.channels).toEqual(['email', 'in_app']);
  });

  test('should reset preferences to defaults', async () => {
    const defaults = await userPreferencesService.resetToDefaults(mockUser);
    
    expect(defaults.theme).toBe('light');
    expect(defaults.fontSize).toBe('medium');
    expect(defaults.layout).toBe('focused');
  });

  test('should validate preference updates', () => {
    const validUpdates = { theme: 'dark', fontSize: 'large' };
    const invalidUpdates = { theme: 'invalid', fontSize: 'huge' };
    
    const validErrors = userPreferencesService.validatePreferences(validUpdates);
    const invalidErrors = userPreferencesService.validatePreferences(invalidUpdates);
    
    expect(validErrors.length).toBe(0);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });

  test('should generate theme CSS', async () => {
    const css = await userPreferencesService.generateThemeCSS(mockUser);
    
    expect(typeof css).toBe('string');
    expect(css).toContain(':root');
    expect(css).toContain('--primary-color');
    expect(css).toContain('--font-size-multiplier');
  });

  test('should apply content preferences', async () => {
    const contentList = [
      { type: 'video', difficulty: 'intermediate', title: 'Video Tutorial' },
      { type: 'text', difficulty: 'easy', title: 'Study Guide' },
      { type: 'interactive', difficulty: 'hard', title: 'Simulation' }
    ];

    const filtered = await userPreferencesService.applyContentPreferences(mockUser, contentList);
    
    expect(Array.isArray(filtered)).toBe(true);
    expect(filtered.length).toBeLessThanOrEqual(contentList.length);
  });
});