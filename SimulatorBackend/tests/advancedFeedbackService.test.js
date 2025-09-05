const AdvancedFeedbackService = require('../src/services/AdvancedFeedbackService');
const SessionModel = require('../src/models/SessionModel');
const ScoringRubricModel = require('../src/models/ScoringRubricModel');

// Mock dependencies
jest.mock('../src/models/SessionModel');
jest.mock('../src/models/ScoringRubricModel');

describe('AdvancedFeedbackService', () => {
  let advancedFeedbackService;

  beforeEach(() => {
    advancedFeedbackService = new AdvancedFeedbackService();
    jest.clearAllMocks();
  });

  describe('generateDetailedFeedback', () => {
    it('should generate detailed feedback for a session', async () => {
      const sessionData = {
        _id: 'session-123',
        userId: 'user-456',
        caseId: 'case-789',
        overallScore: 85,
        areaScores: [
          { area: 'Clinical Skills', score: 80, weight: 0.6 },
          { area: 'Treatment Planning', score: 90, weight: 0.4 }
        ],
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
                  { level: 'Novice', score: 0, description: 'No assessment performed' },
                  { level: 'Competent', score: 7, description: 'Basic assessment completed' },
                  { level: 'Expert', score: 10, description: 'Comprehensive assessment' }
                ]
              }
            ]
          }
        ]
      };

      SessionModel.findById = jest.fn().mockResolvedValue(sessionData);
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(rubricData);

      const result = await advancedFeedbackService.generateDetailedFeedback('session-123', 'medical-rubric');

      expect(result).toHaveProperty('sessionId', 'session-123');
      expect(result).toHaveProperty('overallScore', 85);
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('improvementAreas');
      expect(result).toHaveProperty('personalizedRecommendations');
      expect(result).toHaveProperty('actionableInsights');
      expect(SessionModel.findById).toHaveBeenCalledWith('session-123');
      expect(ScoringRubricModel.findOne).toHaveBeenCalledWith({ rubricId: 'medical-rubric' });
    });

    it('should throw error if session not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue(null);

      await expect(advancedFeedbackService.generateDetailedFeedback('nonexistent-session', 'medical-rubric'))
        .rejects
        .toThrow('Session not found');
    });

    it('should throw error if rubric not found', async () => {
      SessionModel.findById = jest.fn().mockResolvedValue({});
      ScoringRubricModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(advancedFeedbackService.generateDetailedFeedback('session-123', 'nonexistent-rubric'))
        .rejects
        .toThrow('Scoring rubric not found');
    });
  });

  describe('identifyStrengths', () => {
    it('should identify strengths based on high scores', async () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 90, weight: 0.6 },
        { area: 'Treatment Planning', score: 85, weight: 0.4 }
      ];

      const result = await advancedFeedbackService.identifyStrengths(areaScores);

      expect(result).toContain('Clinical Skills');
      expect(result).toContain('Treatment Planning');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for low scores', async () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 50, weight: 0.6 },
        { area: 'Treatment Planning', score: 55, weight: 0.4 }
      ];

      const result = await advancedFeedbackService.identifyStrengths(areaScores);
      expect(result).toHaveLength(0);
    });
  });

  describe('identifyImprovementAreas', () => {
    it('should identify improvement areas based on low scores', async () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 60, weight: 0.6 },
        { area: 'Treatment Planning', score: 85, weight: 0.4 }
      ];

      const result = await advancedFeedbackService.identifyImprovementAreas(areaScores);

      expect(result).toContain('Clinical Skills');
      expect(result).not.toContain('Treatment Planning');
      expect(result.length).toBe(1);
    });

    it('should return empty array for high scores', async () => {
      const areaScores = [
        { area: 'Clinical Skills', score: 90, weight: 0.6 },
        { area: 'Treatment Planning', score: 85, weight: 0.4 }
      ];

      const result = await advancedFeedbackService.identifyImprovementAreas(areaScores);
      expect(result).toHaveLength(0);
    });
  });

  describe('generatePersonalizedRecommendations', () => {
    it('should generate personalized recommendations', async () => {
      const sessionData = {
        overallScore: 75,
        areaScores: [
          { area: 'Clinical Skills', score: 70, weight: 0.6 },
          { area: 'Treatment Planning', score: 80, weight: 0.4 }
        ],
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } }
        ]
      };

      const rubricData = {
        competencyAreas: [
          {
            area: 'Clinical Skills',
            criteria: [
              {
                criterion: 'Patient Assessment',
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

      const result = await advancedFeedbackService.generatePersonalizedRecommendations(sessionData, rubricData);

      expect(result).toHaveProperty('learningResources');
      expect(result).toHaveProperty('practiceSuggestions');
      expect(result).toHaveProperty('skillDevelopment');
      expect(result.learningResources.length).toBeGreaterThan(0);
      expect(result.practiceSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('createActionableInsights', () => {
    it('should create actionable insights from session data', async () => {
      const sessionData = {
        actions: [
          { type: 'assessment', data: { finding: 'blood pressure', value: '120/80' } },
          { type: 'treatment', data: { medication: 'aspirin', dose: '100mg' } }
        ],
        duration: 300,
        overallScore: 85
      };

      const result = await advancedFeedbackService.createActionableInsights(sessionData);

      expect(result).toHaveProperty('efficiencyTips');
      expect(result).toHaveProperty('decisionMaking');
      expect(result).toHaveProperty('timeManagement');
      expect(result.efficiencyTips.length).toBeGreaterThan(0);
      expect(result.decisionMaking.length).toBeGreaterThan(0);
    });

    it('should handle empty actions', async () => {
      const sessionData = { actions: [], duration: 60, overallScore: 50 };
      const result = await advancedFeedbackService.createActionableInsights(sessionData);
      expect(result.efficiencyTips).toContain('Consider more comprehensive assessments');
    });
  });
});