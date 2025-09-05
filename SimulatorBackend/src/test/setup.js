// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/simuatech-test';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Global test utilities
global.mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  username: 'testuser',
  primaryRole: 'student',
  discipline: 'medicine',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    discipline: 'medicine',
    institution: 'Test University'
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

global.mockCase = {
  _id: '507f1f77bcf86cd799439012',
  case_id: 'TEST-001',
  title: 'Test Case',
  discipline: 'medicine',
  difficulty: 'intermediate',
  status: 'published',
  creator_id: '507f1f77bcf86cd799439011',
  content: {
    scenario: 'Test scenario',
    questions: []
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};