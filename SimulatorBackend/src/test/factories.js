import { jest } from '@jest/globals';

// Mock Mongoose connection
export const mockMongoose = {
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn()
  }
};

// User Factory
export const createMockUser = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  username: 'testuser',
  primaryRole: 'student',
  secondaryRoles: [],
  discipline: 'medicine',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    discipline: 'medicine',
    specialization: 'cardiology',
    yearOfStudy: 3,
    institution: 'Test University',
    competencies: [],
    preferences: {}
  },
  permissions: [],
  isActive: true,
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date(),
  save: jest.fn().mockResolvedValue(this),
  toJSON: jest.fn().mockReturnValue(this),
  ...overrides
});

// Case Factory
export const createMockCase = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439012',
  case_id: 'TEST-001',
  title: 'Test Medical Case',
  description: 'A test case for medical students',
  discipline: 'medicine',
  difficulty: 'intermediate',
  status: 'published',
  creator_id: '507f1f77bcf86cd799439011',
  content: {
    scenario: 'Patient presents with chest pain',
    clinicalPresentation: {
      chiefComplaint: 'Chest pain',
      historyOfPresentIllness: 'Sharp chest pain for 2 hours',
      pastMedicalHistory: 'Hypertension',
      medications: ['Lisinopril 10mg daily'],
      allergies: 'NKDA',
      socialHistory: 'Non-smoker',
      familyHistory: 'Father with MI at age 55'
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is the most likely diagnosis?',
        options: ['MI', 'PE', 'Pneumothorax', 'GERD'],
        correctAnswer: 'MI',
        explanation: 'Given the presentation and risk factors...'
      }
    ],
    learningObjectives: ['Diagnose acute coronary syndrome'],
    assessmentCriteria: [
      {
        criterion: 'Clinical Reasoning',
        weight: 0.4,
        description: 'Ability to analyze clinical data'
      }
    ]
  },
  metadata: {
    tags: ['cardiology', 'emergency'],
    estimatedDuration: 30,
    targetAudience: ['medical_students']
  },
  workflow: {
    currentStep: 'published',
    history: []
  },
  analytics: {
    totalAttempts: 0,
    averageScore: 0,
    completionRate: 0
  },
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
  toJSON: jest.fn().mockReturnValue(this),
  ...overrides
});

// Case Attempt Factory
export const createMockCaseAttempt = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439013',
  user_id: '507f1f77bcf86cd799439011',
  case_id: '507f1f77bcf86cd799439012',
  session_id: '507f1f77bcf86cd799439014',
  attemptNumber: 1,
  startTime: new Date(),
  endTime: new Date(),
  status: 'completed',
  score: {
    overall: 85,
    breakdown: {
      clinicalReasoning: 90,
      knowledgeApplication: 80,
      communicationSkills: 85
    },
    percentile: 75,
    feedback: 'Good performance overall',
    improvementAreas: ['Consider differential diagnosis more thoroughly']
  },
  detailedMetrics: {
    clinicalReasoning: 90,
    knowledgeApplication: 80,
    communicationSkills: 85,
    professionalBehavior: 88,
    technicalSkills: 82,
    criticalThinking: 87
  },
  interactions: [
    {
      timestamp: new Date(),
      type: 'question_asked',
      content: 'What are the risk factors for MI?',
      context: { questionId: 'q1' },
      aiResponse: 'Risk factors include age, smoking, hypertension...',
      score: 8
    }
  ],
  feedback: {
    overall: 'Good performance',
    specific: ['Strong clinical reasoning', 'Consider more differentials'],
    recommendations: ['Review ECG interpretation']
  },
  timeSpent: 1800, // 30 minutes in seconds
  createdAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
  toJSON: jest.fn().mockReturnValue(this),
  ...overrides
});

// Progress Factory
export const createMockProgress = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439015',
  userId: '507f1f77bcf86cd799439011',
  discipline: 'medicine',
  overallProgress: {
    completedCases: 15,
    totalCases: 50,
    averageScore: 82,
    competencyLevel: 'intermediate',
    streakDays: 7,
    totalTimeSpent: 45000 // in seconds
  },
  competencyProgress: [
    {
      competency: 'Clinical Reasoning',
      currentLevel: 75,
      targetLevel: 85,
      trend: 'improving',
      lastAssessed: new Date(),
      milestones: ['Basic diagnosis', 'Differential diagnosis']
    },
    {
      competency: 'Knowledge Application',
      currentLevel: 80,
      targetLevel: 90,
      trend: 'stable',
      lastAssessed: new Date(),
      milestones: ['Pathophysiology understanding', 'Treatment selection']
    }
  ],
  learningPath: {
    currentMilestone: 'Cardiovascular System',
    completedMilestones: ['Basic Assessment', 'History Taking'],
    nextRecommendations: ['Cardiology Cases', 'ECG Interpretation'],
    estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  achievements: [
    {
      id: 'first_case',
      name: 'First Case Completed',
      description: 'Completed your first simulation case',
      earnedAt: new Date(),
      category: 'milestone'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
  toJSON: jest.fn().mockReturnValue(this),
  ...overrides
});

// Mock Express Request
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: createMockUser(),
  ...overrides
});

// Mock Express Response
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis()
  };
  return res;
};

// Mock Next Function
export const createMockNext = () => jest.fn();