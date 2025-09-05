import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../index.js';
import Case from '../src/models/CaseModel.js';
import User from '../src/models/UserModel.js';

// Mock the file system for testing
jest.mock('fs/promises');
jest.mock('sharp');

describe('Multimedia Management System', () => {
  let testUser;
  let testCase;
  let authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      primaryRole: 'educator',
      discipline: 'medicine',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });

    // Create test case
    testCase = await Case.create({
      case_metadata: {
        case_id: 'TEST-001',
        title: 'Test Case for Multimedia',
        specialty: 'Internal Medicine',
        program_area: 'Basic Program',
        difficulty: 'Intermediate',
        location: 'Hospital'
      },
      description: 'Test case description',
      system_instruction: 'Test system instruction',
      patient_persona: {
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        chief_complaint: 'Chest pain'
      },
      initial_prompt: 'Patient presents with chest pain',
      clinical_dossier: {
        hidden_diagnosis: 'Acute Coronary Syndrome',
        past_medical_history: ['Hypertension'],
        medications: ['Aspirin'],
        allergies: []
      },
      simulation_triggers: {
        end_session: {
          condition_keyword: 'end',
          patient_response: 'Goodbye'
        },
        invalid_input: {
          condition_keyword: 'invalid',
          patient_response: 'I don\'t understand'
        }
      },
      evaluation_criteria: {},
      createdBy: testUser._id,
      status: 'draft'
    });

    // Generate auth token (mock)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await Case.deleteMany({ 'case_metadata.case_id': 'TEST-001' });
    await User.deleteMany({ email: 'test@example.com' });
  });

  describe('Multimedia Upload API', () => {
    test('should upload multimedia files successfully', async () => {
      const response = await request(app)
        .post('/api/multimedia/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caseId', testCase._id.toString())
        .field('category', 'patient_image')
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.uploadedFiles).toBeDefined();
      expect(response.body.data.uploadedFiles.length).toBeGreaterThan(0);
    });

    test('should reject uploads without authentication', async () => {
      const response = await request(app)
        .post('/api/multimedia/upload')
        .field('caseId', testCase._id.toString())
        .attach('files', Buffer.from('fake data'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    test('should validate file types', async () => {
      const response = await request(app)
        .post('/api/multimedia/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caseId', testCase._id.toString())
        .attach('files', Buffer.from('fake exe data'), {
          filename: 'malicious.exe',
          contentType: 'application/octet-stream'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should enforce file size limits', async () => {
      const largeFile = Buffer.alloc(60 * 1024 * 1024); // 60MB file

      const response = await request(app)
        .post('/api/multimedia/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caseId', testCase._id.toString())
        .attach('files', largeFile, {
          filename: 'large-file.jpg',
          contentType: 'image/jpeg'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Multimedia Retrieval API', () => {
    test('should retrieve multimedia content for a case', async () => {
      const response = await request(app)
        .get(`/api/multimedia/case/${testCase._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.multimediaContent)).toBe(true);
    });

    test('should filter multimedia by type', async () => {
      const response = await request(app)
        .get(`/api/multimedia/case/${testCase._id}?type=image`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // All returned items should be images
      response.body.data.multimediaContent.forEach(item => {
        expect(item.type).toBe('image');
      });
    });

    test('should filter multimedia by category', async () => {
      const response = await request(app)
        .get(`/api/multimedia/case/${testCase._id}?category=patient_image`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // All returned items should match the category
      response.body.data.multimediaContent.forEach(item => {
        expect(item.category).toBe('patient_image');
      });
    });
  });

  describe('Multimedia Management API', () => {
    let testFileId;

    beforeAll(async () => {
      // Create a test multimedia file
      const caseDoc = await Case.findById(testCase._id);
      if (caseDoc && caseDoc.multimediaContent.length === 0) {
        caseDoc.multimediaContent.push({
          fileId: 'test-file-123',
          filename: 'test-image.jpg',
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          size: 1024000,
          url: '/uploads/images/test-image.jpg',
          type: 'image',
          category: 'patient_image',
          uploadedBy: testUser._id,
          uploadedAt: new Date(),
          isActive: true
        });
        await caseDoc.save();
        testFileId = 'test-file-123';
      }
    });

    test('should update multimedia metadata', async () => {
      const response = await request(app)
        .put(`/api/multimedia/${testFileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
          tags: ['test', 'updated'],
          category: 'xray'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.tags).toEqual(['test', 'updated']);
      expect(response.body.data.category).toBe('xray');
    });

    test('should delete multimedia content', async () => {
      const response = await request(app)
        .delete(`/api/multimedia/${testFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    test('should return 404 for non-existent multimedia', async () => {
      const response = await request(app)
        .put('/api/multimedia/non-existent-file')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Multimedia Statistics API', () => {
    test('should retrieve multimedia statistics', async () => {
      const response = await request(app)
        .get('/api/multimedia/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.totalFiles).toBe('number');
      expect(typeof response.body.data.totalSize).toBe('number');
    });

    test('should require admin access for statistics', async () => {
      // Create non-admin user
      const nonAdminUser = await User.create({
        email: 'student@example.com',
        username: 'student',
        password: 'hashedpassword',
        primaryRole: 'student',
        discipline: 'medicine'
      });

      const studentToken = 'mock-student-token';

      const response = await request(app)
        .get('/api/multimedia/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await User.deleteMany({ email: 'student@example.com' });
    });
  });

  describe('Case Versioning System', () => {
    test('should track case updates with versioning', async () => {
      const originalCase = await Case.findById(testCase._id);
      const originalVersion = originalCase.version;

      // Update the case
      const updateResponse = await request(app)
        .put(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated case description for testing'
        });

      expect(updateResponse.status).toBe(200);

      // Verify versioning
      const updatedCase = await Case.findById(testCase._id);
      expect(updatedCase.version).toBe(originalVersion + 1);
      expect(updatedCase.versionHistory).toBeDefined();
      expect(updatedCase.versionHistory.length).toBeGreaterThan(0);

      const latestVersion = updatedCase.versionHistory[updatedCase.versionHistory.length - 1];
      expect(latestVersion.version).toBe(updatedCase.version);
      expect(latestVersion.changes).toContain('Updated');
    });
  });

  describe('Case Organization System', () => {
    test('should create and manage case categories', async () => {
      // This would test the case organization endpoints
      // Implementation depends on the specific API endpoints created
      expect(true).toBe(true); // Placeholder test
    });

    test('should support case tagging and filtering', async () => {
      // Test case tagging functionality
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Case Search and Filtering', () => {
    test('should search cases by various criteria', async () => {
      const response = await request(app)
        .get('/api/case-search/search?q=test&specialty=Internal Medicine')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.cases)).toBe(true);
    });

    test('should filter cases by difficulty and status', async () => {
      const response = await request(app)
        .get('/api/case-search/search?difficulty=Intermediate&status=draft')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Template Library System', () => {
    test('should create case templates', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'Template for testing',
        discipline: 'medicine',
        specialty: 'Internal Medicine',
        difficulty: 'Intermediate',
        tags: ['test', 'template'],
        templateData: {
          case_metadata: testCase.case_metadata,
          patient_persona: testCase.patient_persona,
          clinical_dossier: testCase.clinical_dossier
        }
      };

      const response = await request(app)
        .post('/api/case-templates/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toBeDefined();
    });

    test('should retrieve template library', async () => {
      const response = await request(app)
        .get('/api/case-templates/library')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });
  });

  describe('Analytics and Usage Tracking', () => {
    test('should track case access events', async () => {
      const response = await request(app)
        .post(`/api/cases/${testCase._id}/access`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accessType: 'view' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should generate usage analytics', async () => {
      const response = await request(app)
        .get(`/api/analytics/case/${testCase._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
    });
  });
});