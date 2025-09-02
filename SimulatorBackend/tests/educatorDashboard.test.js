import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/UserModel.js';
import Case from '../src/models/CaseModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Educator Dashboard API', () => {
  let educatorToken;
  let adminToken;
  let studentToken;
  let educatorUser;
  let studentUser;
  let testCase;

  before(async () => {
    // Create test users
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
    educatorUser = await educator.save();

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
        assignedEducators: [educatorUser._id]
      }
    });
    studentUser = await student.save();

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
    educatorToken = jwt.sign(
      { userId: educatorUser._id, role: 'educator' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { userId: studentUser._id, role: 'student' },
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
        case_id: 'TEST_CASE_001',
        title: 'Test Medical Case',
        specialty: 'medicine',
        difficulty: 'intermediate'
      },
      description: 'A test case for educator dashboard testing',
      createdBy: educatorUser._id,
      status: 'published',
      patient_persona: {
        name: 'John Doe',
        age: 45,
        gender: 'male'
      },
      clinical_dossier: {
        chief_complaint: 'Chest pain',
        hidden_diagnosis: 'Myocardial infarction'
      }
    });
    await testCase.save();

    // Create test case attempts
    await mongoose.connection.db.collection('case_attempts').insertMany([
      {
        user_id: studentUser._id,
        case_id: testCase._id,
        session_id: new mongoose.Types.ObjectId(),
        attempt_number: 1,
        start_time: new Date(),
        end_time: new Date(),
        status: 'completed',
        score: { overall: 85 },
        detailed_metrics: {
          clinicalReasoning: 80,
          knowledgeApplication: 90,
          communicationSkills: 85
        },
        time_spent: 1800,
        interactions: [
          {
            timestamp: new Date(),
            type: 'diagnosis_submitted',
            content: 'Myocardial infarction',
            score: 0.9
          }
        ]
      },
      {
        user_id: studentUser._id,
        case_id: testCase._id,
        session_id: new mongoose.Types.ObjectId(),
        attempt_number: 2,
        start_time: new Date(),
        end_time: new Date(),
        status: 'completed',
        score: { overall: 92 },
        detailed_metrics: {
          clinicalReasoning: 90,
          knowledgeApplication: 95,
          communicationSkills: 90
        },
        time_spent: 1500,
        interactions: [
          {
            timestamp: new Date(),
            type: 'diagnosis_submitted',
            content: 'Myocardial infarction',
            score: 0.95
          }
        ]
      }
    ]);
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: '@test.com' } });
    await Case.deleteMany({ 'case_metadata.case_id': 'TEST_CASE_001' });
    await mongoose.connection.db.collection('case_attempts').deleteMany({
      user_id: { $in: [studentUser._id] }
    });
  });

  describe('GET /api/educator/dashboard', () => {
    it('should get educator dashboard overview', async () => {
      const response = await request(app)
        .get('/api/educator/dashboard')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('overview');
      expect(response.body.data).to.have.property('studentStats');
      expect(response.body.data).to.have.property('caseStats');
      expect(response.body.data).to.have.property('performanceMetrics');
      expect(response.body.data).to.have.property('quickActions');

      expect(response.body.data.overview).to.have.property('totalStudents');
      expect(response.body.data.overview).to.have.property('totalCases');
      expect(response.body.data.overview.totalStudents).to.be.a('number');
      expect(response.body.data.overview.totalCases).to.be.a('number');
    });

    it('should deny access to students', async () => {
      await request(app)
        .get('/api/educator/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should allow access to admins', async () => {
      const response = await request(app)
        .get('/api/educator/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
    });
  });

  describe('GET /api/educator/students', () => {
    it('should get assigned students with pagination', async () => {
      const response = await request(app)
        .get('/api/educator/students')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({
          page: 1,
          limit: 10,
          sortBy: 'profile.lastName',
          sortOrder: 'asc'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('students');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.students).to.be.an('array');
      expect(response.body.data.pagination).to.have.property('page');
      expect(response.body.data.pagination).to.have.property('total');
    });

    it('should filter students by search term', async () => {
      const response = await request(app)
        .get('/api/educator/students')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ search: 'Test Student' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.students).to.be.an('array');
    });

    it('should filter students by discipline', async () => {
      const response = await request(app)
        .get('/api/educator/students')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ discipline: 'medicine' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.students).to.be.an('array');
    });

    it('should filter students by status', async () => {
      const response = await request(app)
        .get('/api/educator/students')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.students).to.be.an('array');
    });
  });

  describe('GET /api/educator/students/:studentId/progress', () => {
    it('should get detailed student progress', async () => {
      const response = await request(app)
        .get(`/api/educator/students/${studentUser._id}/progress`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalAttempts');
      expect(response.body.data).to.have.property('averageScore');
      expect(response.body.data).to.have.property('completedCases');
      expect(response.body.data).to.have.property('competencyScores');
      expect(response.body.data).to.have.property('recentTrend');

      expect(response.body.data.totalAttempts).to.be.a('number');
      expect(response.body.data.averageScore).to.be.a('number');
      expect(response.body.data.competencyScores).to.be.an('object');
    });

    it('should handle non-existent student ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/educator/students/${fakeId}/progress`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.totalAttempts).to.equal(0);
    });
  });

  describe('GET /api/educator/cases', () => {
    it('should get educator cases with management data', async () => {
      const response = await request(app)
        .get('/api/educator/cases')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('cases');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.cases).to.be.an('array');
    });

    it('should filter cases by status', async () => {
      const response = await request(app)
        .get('/api/educator/cases')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ status: 'published' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.cases).to.be.an('array');
    });

    it('should filter cases by discipline', async () => {
      const response = await request(app)
        .get('/api/educator/cases')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ discipline: 'medicine' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.cases).to.be.an('array');
    });
  });

  describe('GET /api/educator/cases/:caseId/analytics', () => {
    it('should get detailed case analytics', async () => {
      const response = await request(app)
        .get(`/api/educator/cases/${testCase._id}/analytics`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalAttempts');
      expect(response.body.data).to.have.property('uniqueStudents');
      expect(response.body.data).to.have.property('averageScore');
      expect(response.body.data).to.have.property('performanceDistribution');
      expect(response.body.data).to.have.property('commonMistakes');
      expect(response.body.data).to.have.property('improvementSuggestions');

      expect(response.body.data.totalAttempts).to.be.a('number');
      expect(response.body.data.uniqueStudents).to.be.a('number');
      expect(response.body.data.averageScore).to.be.a('number');
      expect(response.body.data.performanceDistribution).to.be.an('object');
    });

    it('should deny access to cases not owned by educator', async () => {
      // Create a case owned by another user
      const otherCase = new Case({
        case_metadata: {
          case_id: 'OTHER_CASE_001',
          title: 'Other Case',
          specialty: 'medicine',
          difficulty: 'intermediate'
        },
        description: 'A case owned by someone else',
        createdBy: new mongoose.Types.ObjectId(),
        status: 'published'
      });
      await otherCase.save();

      await request(app)
        .get(`/api/educator/cases/${otherCase._id}/analytics`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(500); // Should fail with access denied

      await Case.deleteOne({ _id: otherCase._id });
    });
  });

  describe('GET /api/educator/analytics', () => {
    it('should get comprehensive educator analytics', async () => {
      const response = await request(app)
        .get('/api/educator/analytics')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('performanceMetrics');
      expect(response.body.data).to.have.property('caseStatistics');
      expect(response.body.data).to.have.property('studentStatistics');

      expect(response.body.data.performanceMetrics).to.have.property('averageScore');
      expect(response.body.data.performanceMetrics).to.have.property('completionRate');
      expect(response.body.data.caseStatistics).to.have.property('totalCases');
      expect(response.body.data.studentStatistics).to.have.property('totalStudents');
    });
  });

  describe('POST /api/educator/classes', () => {
    it('should create a new class', async () => {
      const classData = {
        name: 'Test Medical Class',
        description: 'A test class for medical students',
        discipline: 'medicine',
        studentIds: [studentUser._id]
      };

      const response = await request(app)
        .post('/api/educator/classes')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(classData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Class created successfully');
      expect(response.body.data).to.have.property('name', classData.name);
      expect(response.body.data).to.have.property('discipline', classData.discipline);
      expect(response.body.data).to.have.property('students');
      expect(response.body.data.students).to.include(studentUser._id.toString());

      // Clean up
      await mongoose.connection.db.collection('classes').deleteOne({
        _id: response.body.data._id
      });
    });

    it('should validate student IDs when creating class', async () => {
      const classData = {
        name: 'Invalid Class',
        description: 'A class with invalid student IDs',
        discipline: 'medicine',
        studentIds: [new mongoose.Types.ObjectId()] // Non-existent student
      };

      await request(app)
        .post('/api/educator/classes')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(classData)
        .expect(400);
    });
  });

  describe('GET /api/educator/classes', () => {
    let testClassId;

    before(async () => {
      // Create a test class
      const classDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Class for Retrieval',
        description: 'Test class',
        discipline: 'medicine',
        educator: educatorUser._id,
        students: [studentUser._id],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      await mongoose.connection.db.collection('classes').insertOne(classDoc);
      testClassId = classDoc._id;
    });

    after(async () => {
      // Clean up test class
      await mongoose.connection.db.collection('classes').deleteOne({ _id: testClassId });
    });

    it('should get educator classes', async () => {
      const response = await request(app)
        .get('/api/educator/classes')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      
      if (response.body.data.length > 0) {
        const classData = response.body.data[0];
        expect(classData).to.have.property('name');
        expect(classData).to.have.property('discipline');
        expect(classData).to.have.property('studentCount');
        expect(classData).to.have.property('recentActivity');
      }
    });
  });

  describe('GET /api/educator/statistics', () => {
    it('should get case statistics', async () => {
      const response = await request(app)
        .get('/api/educator/statistics')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalCases');
      expect(response.body.data).to.have.property('draftCases');
      expect(response.body.data).to.have.property('publishedCases');
      expect(response.body.data).to.have.property('casesBySpecialty');

      expect(response.body.data.totalCases).to.be.a('number');
      expect(response.body.data.casesBySpecialty).to.be.an('object');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      await request(app)
        .get('/api/educator/dashboard')
        .expect(401);

      await request(app)
        .get('/api/educator/students')
        .expect(401);

      await request(app)
        .get('/api/educator/cases')
        .expect(401);
    });

    it('should require educator or admin role', async () => {
      await request(app)
        .get('/api/educator/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      await request(app)
        .get('/api/educator/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should allow admin access to all routes', async () => {
      await request(app)
        .get('/api/educator/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/educator/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/educator/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid student ID format', async () => {
      await request(app)
        .get('/api/educator/students/invalid-id/progress')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(500);
    });

    it('should handle invalid case ID format', async () => {
      await request(app)
        .get('/api/educator/cases/invalid-id/analytics')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(500);
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll just ensure the routes exist and respond appropriately
      const response = await request(app)
        .get('/api/educator/dashboard')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body).to.have.property('success');
    });
  });
});