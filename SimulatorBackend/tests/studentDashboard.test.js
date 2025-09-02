import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/UserModel.js';
import Case from '../src/models/CaseModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Student Dashboard API', () => {
  let studentToken;
  let adminToken;
  let educatorToken;
  let studentUser;
  let testCase;

  before(async () => {
    // Create test users
    const student = new User({
      username: 'test_student',
      email: 'student@test.com',
      password: 'password123',
      primaryRole: 'student',
      profile: {
        firstName: 'Test',
        lastName: 'Student',
        discipline: 'medicine',
        institution: 'Test University',
        yearOfStudy: 3
      }
    });
    studentUser = await student.save();

    const educator = new User({
      username: 'test_educator',
      email: 'educator@test.com',
      password: 'password123',
      primaryRole: 'educator',
      profile: {
        firstName: 'Test',
        lastName: 'Educator',
        discipline: 'medicine',
        institution: 'Test University'
      }
    });
    const educatorUser = await educator.save();

    const admin = new User({
      username: 'test_admin',
      email: 'admin@test.com',
      password: 'password123',
      primaryRole: 'admin',
      profile: {
        firstName: 'Test',
        lastName: 'Admin',
        discipline: 'medicine',
        institution: 'Test University'
      }
    });
    const adminUser = await admin.save();

    // Generate tokens
    studentToken = jwt.sign(
      { userId: studentUser._id, role: 'student' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    educatorToken = jwt.sign(
      { userId: educatorUser._id, role: 'educator' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test case
    testCase = new Case({
      case_metadata: {
        case_id: 'TEST_STUDENT_CASE_001',
        title: 'Test Medical Case for Students',
        specialty: 'medicine',
        difficulty: 'intermediate'
      },
      description: 'A test case for student dashboard testing',
      status: 'published',
      patient_persona: {
        name: 'Jane Doe',
        age: 35,
        gender: 'female',
        chief_complaint: 'Abdominal pain'
      },
      clinical_dossier: {
        hidden_diagnosis: 'Appendicitis'
      },
      createdBy: educatorUser._id
    });
    await testCase.save();

    // Create test case attempts
    await mongoose.connection.db.collection('case_attempts').insertMany([
      {
        user_id: studentUser._id,
        case_id: testCase._id,
        session_id: new mongoose.Types.ObjectId(),
        attempt_number: 1,
        start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1800000), // 30 min later
        status: 'completed',
        score: { overall: 75 },
        detailed_metrics: {
          clinical_reasoning: 70,
          knowledge_application: 80,
          communication_skills: 75
        },
        time_spent: 1800
      },
      {
        user_id: studentUser._id,
        case_id: testCase._id,
        session_id: new mongoose.Types.ObjectId(),
        attempt_number: 2,
        start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1500000), // 25 min later
        status: 'completed',
        score: { overall: 85 },
        detailed_metrics: {
          clinical_reasoning: 85,
          knowledge_application: 90,
          communication_skills: 80
        },
        time_spent: 1500
      }
    ]);
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: '@test.com' } });
    await Case.deleteMany({ 'case_metadata.case_id': 'TEST_STUDENT_CASE_001' });
    await mongoose.connection.db.collection('case_attempts').deleteMany({
      user_id: { $in: [studentUser._id] }
    });
  });

  describe('GET /api/student/dashboard', () => {
    it('should get student dashboard overview', async () => {
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('student');
      expect(response.body.data).to.have.property('progressSummary');
      expect(response.body.data).to.have.property('recommendedCases');
      expect(response.body.data).to.have.property('recentActivity');
      expect(response.body.data).to.have.property('achievements');
      expect(response.body.data).to.have.property('learningPath');
      expect(response.body.data).to.have.property('quickActions');

      // Verify student information
      expect(response.body.data.student).to.have.property('discipline', 'medicine');
      expect(response.body.data.student).to.have.property('disciplineConfig');
      expect(response.body.data.student.disciplineConfig).to.have.property('name', 'Medicine');

      // Verify progress summary
      expect(response.body.data.progressSummary).to.have.property('totalAttempts');
      expect(response.body.data.progressSummary).to.have.property('averageScore');
      expect(response.body.data.progressSummary).to.have.property('competencyScores');
      expect(response.body.data.progressSummary.totalAttempts).to.be.a('number');
      expect(response.body.data.progressSummary.averageScore).to.be.a('number');
    });

    it('should deny access to educators', async () => {
      await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(403);
    });

    it('should allow access to admins', async () => {
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
    });
  });

  describe('GET /api/student/cases', () => {
    it('should get available cases with pagination', async () => {
      const response = await request(app)
        .get('/api/student/cases')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({
          page: 1,
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('cases');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.cases).to.be.an('array');
      expect(response.body.data.pagination).to.have.property('page');
      expect(response.body.data.pagination).to.have.property('total');
    });

    it('should filter cases by difficulty', async () => {
      const response = await request(app)
        .get('/api/student/cases')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ difficulty: 'intermediate,advanced' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.cases).to.be.an('array');
    });

    it('should search cases by title and description', async () => {
      const response = await request(app)
        .get('/api/student/cases')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ search: 'medical' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.cases).to.be.an('array');
    });
  });

  describe('GET /api/student/recommendations', () => {
    it('should get personalized case recommendations', async () => {
      const response = await request(app)
        .get('/api/student/recommendations')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ limit: 6 })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.most(6);

      if (response.body.data.length > 0) {
        const recommendation = response.body.data[0];
        expect(recommendation).to.have.property('id');
        expect(recommendation).to.have.property('title');
        expect(recommendation).to.have.property('difficulty');
        expect(recommendation).to.have.property('relevanceScore');
        expect(recommendation).to.have.property('recommendationReason');
      }
    });

    it('should limit recommendations to specified number', async () => {
      const response = await request(app)
        .get('/api/student/recommendations')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.most(3);
    });
  });

  describe('GET /api/student/progress', () => {
    it('should get detailed progress information', async () => {
      const response = await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalAttempts');
      expect(response.body.data).to.have.property('completedCases');
      expect(response.body.data).to.have.property('averageScore');
      expect(response.body.data).to.have.property('overallProgress');
      expect(response.body.data).to.have.property('competencyScores');
      expect(response.body.data).to.have.property('recentTrend');
      expect(response.body.data).to.have.property('studyStreak');

      expect(response.body.data.totalAttempts).to.be.a('number');
      expect(response.body.data.averageScore).to.be.a('number');
      expect(response.body.data.competencyScores).to.be.an('object');
      expect(response.body.data.recentTrend).to.be.oneOf(['improving', 'declining', 'stable']);
    });
  });

  describe('GET /api/student/achievements', () => {
    it('should get student achievements and badges', async () => {
      const response = await request(app)
        .get('/api/student/achievements')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('badges');
      expect(response.body.data).to.have.property('milestones');
      expect(response.body.data).to.have.property('totalPoints');

      expect(response.body.data.badges).to.be.an('array');
      expect(response.body.data.milestones).to.be.an('array');
      expect(response.body.data.totalPoints).to.be.a('number');

      if (response.body.data.badges.length > 0) {
        const badge = response.body.data.badges[0];
        expect(badge).to.have.property('id');
        expect(badge).to.have.property('name');
        expect(badge).to.have.property('icon');
      }

      if (response.body.data.milestones.length > 0) {
        const milestone = response.body.data.milestones[0];
        expect(milestone).to.have.property('id');
        expect(milestone).to.have.property('name');
        expect(milestone).to.have.property('target');
        expect(milestone).to.have.property('current');
        expect(milestone).to.have.property('completed');
      }
    });
  });

  describe('GET /api/student/learning-path', () => {
    it('should get personalized learning path', async () => {
      const response = await request(app)
        .get('/api/student/learning-path')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('currentLevel');
      expect(response.body.data).to.have.property('focusAreas');

      expect(response.body.data.currentLevel).to.be.a('number');
      expect(response.body.data.focusAreas).to.be.an('array');

      if (response.body.data.focusAreas.length > 0) {
        const focusArea = response.body.data.focusAreas[0];
        expect(focusArea).to.have.property('competency');
        expect(focusArea).to.have.property('currentScore');
        expect(focusArea).to.have.property('targetScore');
        expect(focusArea).to.have.property('priority');
      }
    });
  });

  describe('GET /api/student/activity', () => {
    it('should get recent activity history', async () => {
      const response = await request(app)
        .get('/api/student/activity')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.most(5);

      if (response.body.data.length > 0) {
        const activity = response.body.data[0];
        expect(activity).to.have.property('id');
        expect(activity).to.have.property('type');
        expect(activity).to.have.property('title');
        expect(activity).to.have.property('status');
        expect(activity).to.have.property('startTime');
      }
    });
  });

  describe('GET /api/student/discipline-config', () => {
    it('should get discipline-specific configuration', async () => {
      const response = await request(app)
        .get('/api/student/discipline-config')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('discipline');
      expect(response.body.data).to.have.property('config');

      expect(response.body.data.discipline).to.equal('medicine');
      expect(response.body.data.config).to.have.property('name');
      expect(response.body.data.config).to.have.property('icon');
      expect(response.body.data.config).to.have.property('primaryColor');
      expect(response.body.data.config).to.have.property('competencies');
      expect(response.body.data.config).to.have.property('caseTypes');

      expect(response.body.data.config.competencies).to.be.an('array');
      expect(response.body.data.config.caseTypes).to.be.an('array');
    });
  });

  describe('Help and Guidance Endpoints', () => {
    describe('GET /api/student/help/contextual', () => {
      it('should get contextual help for dashboard', async () => {
        const response = await request(app)
          .get('/api/student/help/contextual')
          .set('Authorization', `Bearer ${studentToken}`)
          .query({ page: 'dashboard' })
          .expect(200);

        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('contextualHelp');
        expect(response.body.data).to.have.property('quickTips');
        expect(response.body.data).to.have.property('relatedTutorials');
        expect(response.body.data).to.have.property('discipline');

        expect(response.body.data.contextualHelp).to.be.an('array');
        expect(response.body.data.quickTips).to.be.an('array');
        expect(response.body.data.relatedTutorials).to.be.an('array');
      });

      it('should get contextual help for case page', async () => {
        const response = await request(app)
          .get('/api/student/help/contextual')
          .set('Authorization', `Bearer ${studentToken}`)
          .query({ 
            page: 'case', 
            caseId: testCase._id.toString(),
            difficulty: 'intermediate'
          })
          .expect(200);

        expect(response.body.success).to.be.true;
        expect(response.body.data.contextualHelp).to.be.an('array');
      });
    });

    describe('GET /api/student/help/search', () => {
      it('should search help content', async () => {
        const response = await request(app)
          .get('/api/student/help/search')
          .set('Authorization', `Bearer ${studentToken}`)
          .query({ q: 'case' })
          .expect(200);

        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('query');
        expect(response.body.data).to.have.property('results');
        expect(response.body.data).to.have.property('totalResults');

        expect(response.body.data.results).to.have.property('faq');
        expect(response.body.data.results).to.have.property('tutorials');
        expect(response.body.data.results.faq).to.be.an('array');
        expect(response.body.data.results.tutorials).to.be.an('array');
      });

      it('should require search query', async () => {
        await request(app)
          .get('/api/student/help/search')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(400);
      });
    });

    describe('GET /api/student/help/categories', () => {
      it('should get all help categories', async () => {
        const response = await request(app)
          .get('/api/student/help/categories')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');

        if (response.body.data.length > 0) {
          const category = response.body.data[0];
          expect(category).to.have.property('id');
          expect(category).to.have.property('name');
          expect(category).to.have.property('icon');
          expect(category).to.have.property('description');
        }
      });
    });

    describe('GET /api/student/guidance', () => {
      it('should get personalized guidance', async () => {
        const response = await request(app)
          .get('/api/student/guidance')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('recommendations');
        expect(response.body.data).to.have.property('studyTips');
        expect(response.body.data).to.have.property('nextSteps');
        expect(response.body.data).to.have.property('motivationalMessage');

        expect(response.body.data.recommendations).to.be.an('array');
        expect(response.body.data.studyTips).to.be.an('array');
        expect(response.body.data.nextSteps).to.be.an('array');
        expect(response.body.data.motivationalMessage).to.be.a('string');
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      await request(app)
        .get('/api/student/dashboard')
        .expect(401);

      await request(app)
        .get('/api/student/cases')
        .expect(401);

      await request(app)
        .get('/api/student/progress')
        .expect(401);
    });

    it('should require student or admin role', async () => {
      await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(403);

      await request(app)
        .get('/api/student/cases')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(403);
    });

    it('should allow admin access to all routes', async () => {
      await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/student/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/student/cases')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ 
          page: 'invalid',
          limit: 'invalid',
          sortOrder: 'invalid'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      // Should use default values for invalid parameters
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll just ensure the routes exist and respond appropriately
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).to.have.property('success');
    });
  });
});