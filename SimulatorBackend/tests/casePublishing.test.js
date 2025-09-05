import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';
import Case from '../src/models/CaseModel.js';
import User from '../src/models/UserModel.js';
import CasePublishingService from '../src/services/CasePublishingService.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Case Publishing API', () => {
  let educatorToken;
  let adminToken;
  let studentToken;
  let educatorUser;
  let adminUser;
  let studentUser;
  let testCaseId;
  let publishedCaseId;

  before(async () => {
    // Create test users
    const educator = new User({
      username: 'test_pub_educator',
      email: 'pub_educator@test.com',
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

    const admin = new User({
      username: 'test_pub_admin',
      email: 'pub_admin@test.com',
      password: 'password123',
      primaryRole: 'admin',
      profile: {
        firstName: 'Test',
        lastName: 'Admin',
        discipline: 'medicine',
        institution: 'Test University'
      }
    });
    adminUser = await admin.save();

    const student = new User({
      username: 'test_pub_student',
      email: 'pub_student@test.com',
      password: 'password123',
      primaryRole: 'student',
      profile: {
        firstName: 'Test',
        lastName: 'Student',
        discipline: 'medicine',
        institution: 'Test University'
      }
    });
    studentUser = await student.save();

    // Generate tokens
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

    studentToken = jwt.sign(
      { userId: studentUser._id, role: 'student' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create a test case for publishing
    const testCase = new Case({
      case_metadata: {
        title: 'Test Case for Publishing',
        difficulty: 'intermediate',
        specialty: 'cardiology',
        program_area: 'internal_medicine',
        location: 'emergency_room',
        estimated_duration: 45,
        learning_objectives: ['Test objective 1', 'Test objective 2']
      },
      description: 'A test case for publishing functionality',
      patient_persona: {
        name: 'John Doe',
        age: 45,
        gender: 'male',
        chief_complaint: 'Chest pain'
      },
      status: 'approved',
      createdBy: educatorUser._id,
      tags: ['cardiology', 'emergency', 'test']
    });
    const savedCase = await testCase.save();
    testCaseId = savedCase._id;
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: 'pub_@test.com' } });
    await Case.deleteMany({ 
      'case_metadata.title': { $regex: 'Test Case' } 
    });
  });

  describe('CasePublishingService', () => {
    it('should publish a case successfully', async () => {
      const publicationData = {
        accessLevel: 'restricted',
        targetAudience: [
          { discipline: 'medicine', specialty: 'cardiology' }
        ],
        availableFrom: new Date(),
        licensing: {
          type: 'educational',
          attributionRequired: true,
          commercialUse: false
        }
      };

      const publishedCase = await CasePublishingService.publishCase(
        testCaseId.toString(),
        publicationData,
        educatorUser._id.toString()
      );

      expect(publishedCase).to.exist;
      expect(publishedCase.status).to.equal('published');
      expect(publishedCase.publicationMetadata).to.exist;
      expect(publishedCase.publicationMetadata.accessLevel).to.equal('restricted');
      expect(publishedCase.publishedAt).to.exist;
      expect(publishedCase.publishedBy.toString()).to.equal(educatorUser._id.toString());

      publishedCaseId = publishedCase._id;
    });

    it('should check case access permissions', async () => {
      // Test access for authenticated user in target audience
      const accessInfo = await CasePublishingService.checkCaseAccess(
        publishedCaseId.toString(),
        { 
          _id: studentUser._id, 
          discipline: 'medicine',
          profile: { specialization: 'cardiology' }
        }
      );

      expect(accessInfo.accessible).to.be.true;
      expect(accessInfo.case).to.exist;
      expect(accessInfo.case._id.toString()).to.equal(publishedCaseId.toString());
    });

    it('should get published cases with filters', async () => {
      const filters = {
        query: 'cardiology',
        specialties: ['cardiology'],
        difficulties: ['intermediate'],
        page: 1,
        limit: 10
      };

      const result = await CasePublishingService.getPublishedCases(
        filters,
        { _id: studentUser._id, discipline: 'medicine' }
      );

      expect(result).to.have.property('cases');
      expect(result).to.have.property('pagination');
      expect(result.cases).to.be.an('array');
      expect(result.cases.length).to.be.greaterThan(0);
      expect(result.pagination).to.have.property('page', 1);
      expect(result.pagination).to.have.property('total');
    });

    it('should generate case recommendations', async () => {
      const userProfile = {
        _id: studentUser._id,
        discipline: 'medicine',
        profile: { specialization: 'cardiology' }
      };

      const recommendations = await CasePublishingService.getCaseRecommendations(
        userProfile,
        5
      );

      expect(recommendations).to.be.an('array');
    });

    it('should get distribution statistics', async () => {
      const stats = await CasePublishingService.getDistributionStatistics();

      expect(stats).to.have.property('totalPublished');
      expect(stats).to.have.property('totalUsage');
      expect(stats).to.have.property('averageRating');
      expect(stats).to.have.property('specialtyDistribution');
      expect(stats).to.have.property('difficultyDistribution');
      expect(stats).to.have.property('accessLevelDistribution');
    });
  });

  describe('GET /api/publishing/cases', () => {
    it('should get published cases with search and filters', async () => {
      const response = await request(app)
        .get('/api/publishing/cases')
        .query({
          query: 'cardiology',
          specialties: 'cardiology',
          difficulties: 'intermediate',
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('cases');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.cases).to.be.an('array');
    });

    it('should handle empty results gracefully', async () => {
      const response = await request(app)
        .get('/api/publishing/cases')
        .query({
          query: 'nonexistentcasethatdoesnotexist',
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.cases).to.be.an('array');
      expect(response.body.data.cases.length).to.equal(0);
    });
  });

  describe('GET /api/publishing/cases/recommendations', () => {
    it('should get case recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/publishing/cases/recommendations')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/publishing/cases/recommendations')
        .expect(401);
    });
  });

  describe('GET /api/publishing/cases/popular', () => {
    it('should get popular published cases', async () => {
      const response = await request(app)
        .get('/api/publishing/cases/popular')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
    });
  });

  describe('GET /api/publishing/cases/:id/access', () => {
    it('should check case access permissions', async () => {
      const response = await request(app)
        .get(`/api/publishing/cases/${publishedCaseId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('accessible');
      expect(response.body.data).to.have.property('reason');
    });

    it('should handle non-existent case', async () => {
      const fakeCaseId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/publishing/cases/${fakeCaseId}/access`)
        .expect(500);
    });
  });

  describe('POST /api/publishing/cases/:id/publish', () => {
    it('should publish a case (educator)', async () => {
      const publicationData = {
        accessLevel: 'public',
        targetAudience: [
          { discipline: 'medicine', specialty: 'general' }
        ],
        licensing: {
          type: 'educational',
          attributionRequired: true
        }
      };

      const response = await request(app)
        .post(`/api/publishing/cases/${testCaseId}/publish`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(publicationData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Case published successfully');
      expect(response.body.data).to.have.property('status', 'published');
    });

    it('should publish a case (admin)', async () => {
      // Create another test case for admin publishing
      const adminCase = new Case({
        case_metadata: {
          title: 'Admin Published Case',
          difficulty: 'beginner',
          specialty: 'pediatrics'
        },
        status: 'approved',
        createdBy: adminUser._id
      });
      const savedAdminCase = await adminCase.save();

      const response = await request(app)
        .post(`/api/publishing/cases/${savedAdminCase._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          accessLevel: 'restricted',
          targetAudience: [{ discipline: 'medicine' }]
        })
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should require educator or admin role', async () => {
      await request(app)
        .post(`/api/publishing/cases/${testCaseId}/publish`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ accessLevel: 'public' })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/publishing/cases/${testCaseId}/publish`)
        .send({ accessLevel: 'public' })
        .expect(401);
    });
  });

  describe('POST /api/publishing/cases/:id/unpublish', () => {
    it('should unpublish a case', async () => {
      const response = await request(app)
        .post(`/api/publishing/cases/${publishedCaseId}/unpublish`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({ reason: 'Test archival' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Case unpublished successfully');
      expect(response.body.data).to.have.property('status', 'archived');
    });

    it('should require published case for unpublishing', async () => {
      const draftCase = new Case({
        case_metadata: { title: 'Draft Case' },
        status: 'draft',
        createdBy: educatorUser._id
      });
      const savedDraft = await draftCase.save();

      await request(app)
        .post(`/api/publishing/cases/${savedDraft._id}/unpublish`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({ reason: 'Test' })
        .expect(400);
    });
  });

  describe('GET /api/publishing/stats', () => {
    it('should get distribution statistics (admin only)', async () => {
      const response = await request(app)
        .get('/api/publishing/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalPublished');
      expect(response.body.data).to.have.property('totalUsage');
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .get('/api/publishing/stats')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(403);
    });
  });

  describe('POST /api/publishing/cases/:id/track-usage', () => {
    it('should track case usage', async () => {
      const response = await request(app)
        .post(`/api/publishing/cases/${publishedCaseId}/track-usage`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Case usage tracked successfully');
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/publishing/cases/${publishedCaseId}/track-usage`)
        .expect(401);
    });
  });

  describe('GET /api/publishing/cases/:id', () => {
    it('should get published case with access control', async () => {
      const response = await request(app)
        .get(`/api/publishing/cases/${publishedCaseId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('_id');
      expect(response.body.data).to.have.property('case_metadata');
    });

    it('should handle access denied scenarios', async () => {
      // Create a private case
      const privateCase = new Case({
        case_metadata: { title: 'Private Test Case' },
        status: 'published',
        createdBy: educatorUser._id,
        publicationMetadata: {
          accessLevel: 'private',
          publishedAt: new Date(),
          publishedBy: educatorUser._id
        }
      });
      const savedPrivateCase = await privateCase.save();

      const response = await request(app)
        .get(`/api/publishing/cases/${savedPrivateCase._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Access denied');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid case ID format', async () => {
      await request(app)
        .get('/api/publishing/cases/invalid-id')
        .expect(500);
    });

    it('should handle non-existent case', async () => {
      const fakeCaseId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/publishing/cases/${fakeCaseId}`)
        .expect(500);
    });

    it('should handle malformed request data', async () => {
      await request(app)
        .post(`/api/publishing/cases/${testCaseId}/publish`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send('invalid json')
        .expect(400);
    });
  });
});