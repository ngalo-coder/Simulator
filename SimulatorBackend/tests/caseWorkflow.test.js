import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/UserModel.js';
import caseCreationWorkflowService from '../src/services/CaseCreationWorkflowService.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Case Creation Workflow API', () => {
  let educatorToken;
  let adminToken;
  let studentToken;
  let educatorUser;
  let adminUser;
  let studentUser;
  let testDraftId;

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
    adminUser = await admin.save();

    const student = new User({
      username: 'test_student',
      email: 'student@test.com',
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
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: '@test.com' } });
    await mongoose.connection.db.collection('case_drafts').deleteMany({
      createdBy: { $in: [educatorUser._id, adminUser._id] }
    });
  });

  describe('CaseCreationWorkflowService', () => {
    it('should initialize workflow correctly', async () => {
      const workflowData = await caseCreationWorkflowService.initializeWorkflow(educatorUser, 'medicine');
      
      expect(workflowData).to.have.property('draftId');
      expect(workflowData).to.have.property('discipline', 'medicine');
      expect(workflowData).to.have.property('template');
      expect(workflowData).to.have.property('currentStep', 'template_selection');
      expect(workflowData).to.have.property('workflowSteps');
      expect(workflowData).to.have.property('caseData');
      expect(workflowData).to.have.property('status', 'created');

      expect(workflowData.workflowSteps).to.be.an('array');
      expect(workflowData.workflowSteps).to.have.length(6);
      
      testDraftId = workflowData.draftId;
    });

    it('should get workflow steps for discipline', () => {
      const steps = caseCreationWorkflowService.getWorkflowSteps('nursing');
      
      expect(steps).to.be.an('array');
      expect(steps).to.have.length(6);
      
      const stepIds = steps.map(step => step.id);
      expect(stepIds).to.include.members([
        'template_selection',
        'basic_info',
        'patient_persona',
        'clinical_dossier',
        'evaluation_criteria',
        'review_submit'
      ]);

      steps.forEach(step => {
        expect(step).to.have.property('id');
        expect(step).to.have.property('name');
        expect(step).to.have.property('description');
        expect(step).to.have.property('icon');
        expect(step).to.have.property('required');
        expect(step).to.have.property('estimatedTime');
      });
    });

    it('should validate step data correctly', async () => {
      // Valid basic info
      const validBasicInfo = {
        case_metadata: {
          title: 'Test Medical Case',
          difficulty: 'intermediate',
          estimated_duration: 45
        }
      };

      const validValidation = await caseCreationWorkflowService.validateStepData(
        'basic_info', validBasicInfo, 'medicine'
      );
      expect(validValidation.isValid).to.be.true;
      expect(validValidation.errors).to.be.empty;

      // Invalid basic info
      const invalidBasicInfo = {
        case_metadata: {
          estimated_duration: 200 // Too long
        }
      };

      const invalidValidation = await caseCreationWorkflowService.validateStepData(
        'basic_info', invalidBasicInfo, 'medicine'
      );
      expect(invalidValidation.isValid).to.be.false;
      expect(invalidValidation.errors).to.include('Case title is required');
      expect(invalidValidation.errors).to.include('Difficulty level is required');
    });

    it('should get terminology suggestions', () => {
      const suggestions = caseCreationWorkflowService.getTerminologySuggestions('card', 'all');
      
      expect(suggestions).to.be.an('array');
      expect(suggestions.length).to.be.greaterThan(0);
      
      const cardiology = suggestions.find(s => s.term === 'cardiology');
      expect(cardiology).to.exist;
      expect(cardiology).to.have.property('term', 'cardiology');
      expect(cardiology).to.have.property('category');
      expect(cardiology).to.have.property('definition');
    });
  });

  describe('POST /api/case-workflow/initialize', () => {
    it('should initialize workflow for educator', async () => {
      const response = await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({ discipline: 'nursing' })
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('draftId');
      expect(response.body.data).to.have.property('discipline', 'nursing');
      expect(response.body.data).to.have.property('template');
      expect(response.body.data).to.have.property('currentStep', 'template_selection');
      expect(response.body.data).to.have.property('workflowSteps');
      expect(response.body.data.workflowSteps).to.be.an('array');
    });

    it('should initialize workflow for admin', async () => {
      const response = await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ discipline: 'pharmacy' })
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('pharmacy');
    });

    it('should require discipline parameter', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({})
        .expect(400);
    });

    it('should deny access to students', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ discipline: 'medicine' })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .send({ discipline: 'medicine' })
        .expect(401);
    });
  });

  describe('GET /api/case-workflow/drafts', () => {
    it('should get user drafts', async () => {
      const response = await request(app)
        .get('/api/case-workflow/drafts')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('drafts');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.drafts).to.be.an('array');
      expect(response.body.data.pagination).to.have.property('page');
      expect(response.body.data.pagination).to.have.property('total');
    });

    it('should filter drafts by status', async () => {
      const response = await request(app)
        .get('/api/case-workflow/drafts')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ status: 'created' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.drafts).to.be.an('array');
    });

    it('should filter drafts by discipline', async () => {
      const response = await request(app)
        .get('/api/case-workflow/drafts')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ discipline: 'medicine' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.drafts).to.be.an('array');
    });
  });

  describe('GET /api/case-workflow/drafts/:draftId', () => {
    it('should get draft by ID', async () => {
      if (!testDraftId) {
        const workflowData = await caseCreationWorkflowService.initializeWorkflow(educatorUser, 'medicine');
        testDraftId = workflowData.draftId;
      }

      const response = await request(app)
        .get(`/api/case-workflow/drafts/${testDraftId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('draftId');
      expect(response.body.data).to.have.property('discipline');
      expect(response.body.data).to.have.property('status');
      expect(response.body.data).to.have.property('currentStep');
      expect(response.body.data).to.have.property('caseData');
      expect(response.body.data).to.have.property('template');
      expect(response.body.data).to.have.property('workflowSteps');
      expect(response.body.data).to.have.property('completionPercentage');
    });

    it('should return 404 for non-existent draft', async () => {
      const fakeDraftId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/case-workflow/drafts/${fakeDraftId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/case-workflow/drafts/:draftId/steps/:stepId', () => {
    it('should update basic info step', async () => {
      if (!testDraftId) {
        const workflowData = await caseCreationWorkflowService.initializeWorkflow(educatorUser, 'medicine');
        testDraftId = workflowData.draftId;
      }

      const stepData = {
        case_metadata: {
          title: 'Acute Myocardial Infarction Case',
          difficulty: 'intermediate',
          estimated_duration: 45,
          learning_objectives: [
            'Recognize MI symptoms',
            'Order appropriate tests',
            'Initiate treatment'
          ]
        },
        description: 'A comprehensive case study of acute MI presentation and management'
      };

      const response = await request(app)
        .put(`/api/case-workflow/drafts/${testDraftId}/steps/basic_info`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(stepData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('currentStep', 'basic_info');
      expect(response.body.data).to.have.property('caseData');
      expect(response.body.data.caseData.case_metadata.title).to.equal('Acute Myocardial Infarction Case');
    });

    it('should update patient persona step', async () => {
      const stepData = {
        patient_persona: {
          name: 'John Smith',
          age: 58,
          gender: 'male',
          chief_complaint: 'Chest pain',
          medical_history: ['Hypertension', 'Diabetes'],
          medications: ['Lisinopril', 'Metformin']
        }
      };

      const response = await request(app)
        .put(`/api/case-workflow/drafts/${testDraftId}/steps/patient_persona`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(stepData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.caseData.patient_persona.name).to.equal('John Smith');
      expect(response.body.data.caseData.patient_persona.age).to.equal(58);
    });

    it('should validate step data and return errors', async () => {
      const invalidStepData = {
        patient_persona: {
          age: 150 // Invalid age
        }
      };

      const response = await request(app)
        .put(`/api/case-workflow/drafts/${testDraftId}/steps/patient_persona`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(invalidStepData)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors).to.include('Patient age must be between 0 and 120');
    });
  });

  describe('POST /api/case-workflow/drafts/:draftId/save', () => {
    it('should save draft', async () => {
      const caseData = {
        case_metadata: {
          title: 'Updated Case Title',
          difficulty: 'advanced'
        },
        patient_persona: {
          name: 'Jane Doe',
          age: 45
        }
      };

      const response = await request(app)
        .post(`/api/case-workflow/drafts/${testDraftId}/save`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(caseData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('draftId');
      expect(response.body.data).to.have.property('validation');
      expect(response.body.data).to.have.property('savedAt');
    });
  });

  describe('POST /api/case-workflow/drafts/:draftId/collaborators', () => {
    it('should add collaborator to draft', async () => {
      const collaboratorData = {
        userId: adminUser._id,
        role: 'editor',
        permissions: ['read', 'write']
      };

      const response = await request(app)
        .post(`/api/case-workflow/drafts/${testDraftId}/collaborators`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(collaboratorData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('collaborators');
      expect(response.body.data.collaborators).to.be.an('array');
    });

    it('should validate collaborator user exists', async () => {
      const collaboratorData = {
        userId: new mongoose.Types.ObjectId(),
        role: 'editor',
        permissions: ['read', 'write']
      };

      await request(app)
        .post(`/api/case-workflow/drafts/${testDraftId}/collaborators`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(collaboratorData)
        .expect(400);
    });
  });

  describe('GET /api/case-workflow/terminology', () => {
    it('should get terminology suggestions', async () => {
      const response = await request(app)
        .get('/api/case-workflow/terminology')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ query: 'card', category: 'all' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('query', 'card');
      expect(response.body.data).to.have.property('category', 'all');
      expect(response.body.data).to.have.property('suggestions');
      expect(response.body.data.suggestions).to.be.an('array');

      if (response.body.data.suggestions.length > 0) {
        const suggestion = response.body.data.suggestions[0];
        expect(suggestion).to.have.property('term');
        expect(suggestion).to.have.property('category');
        expect(suggestion).to.have.property('definition');
      }
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/case-workflow/terminology')
        .set('Authorization', `Bearer ${educatorToken}`)
        .query({ query: 'acute', category: 'common' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.suggestions).to.be.an('array');
    });
  });

  describe('GET /api/case-workflow/steps/:discipline', () => {
    it('should get workflow steps for discipline', async () => {
      const response = await request(app)
        .get('/api/case-workflow/steps/medicine')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('discipline', 'medicine');
      expect(response.body.data).to.have.property('steps');
      expect(response.body.data.steps).to.be.an('array');
      expect(response.body.data.steps).to.have.length(6);

      const step = response.body.data.steps[0];
      expect(step).to.have.property('id');
      expect(step).to.have.property('name');
      expect(step).to.have.property('description');
      expect(step).to.have.property('icon');
      expect(step).to.have.property('required');
      expect(step).to.have.property('estimatedTime');
    });

    it('should customize steps for nursing discipline', async () => {
      const response = await request(app)
        .get('/api/case-workflow/steps/nursing')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('nursing');
      
      const clinicalStep = response.body.data.steps.find(step => step.id === 'clinical_dossier');
      expect(clinicalStep.description).to.include('nursing assessment');
    });
  });

  describe('DELETE /api/case-workflow/drafts/:draftId', () => {
    it('should delete draft', async () => {
      // Create a new draft for deletion test
      const workflowData = await caseCreationWorkflowService.initializeWorkflow(educatorUser, 'laboratory');
      const draftToDelete = workflowData.draftId;

      const response = await request(app)
        .delete(`/api/case-workflow/drafts/${draftToDelete}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Draft deleted successfully');

      // Verify draft is deleted
      await request(app)
        .get(`/api/case-workflow/drafts/${draftToDelete}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent draft', async () => {
      const fakeDraftId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/case-workflow/drafts/${fakeDraftId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(400);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .send({ discipline: 'medicine' })
        .expect(401);

      await request(app)
        .get('/api/case-workflow/drafts')
        .expect(401);

      await request(app)
        .get('/api/case-workflow/terminology')
        .expect(401);
    });

    it('should require educator or admin role', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ discipline: 'medicine' })
        .expect(403);

      await request(app)
        .get('/api/case-workflow/drafts')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should allow admin access to all routes', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ discipline: 'radiology' })
        .expect(201);

      await request(app)
        .get('/api/case-workflow/drafts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/case-workflow/terminology')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid draft ID format', async () => {
      await request(app)
        .get('/api/case-workflow/drafts/invalid-id')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(404);
    });

    it('should handle invalid step ID', async () => {
      if (!testDraftId) {
        const workflowData = await caseCreationWorkflowService.initializeWorkflow(educatorUser, 'medicine');
        testDraftId = workflowData.draftId;
      }

      await request(app)
        .put(`/api/case-workflow/drafts/${testDraftId}/steps/invalid_step`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({ test: 'data' })
        .expect(400);
    });

    it('should handle malformed request data', async () => {
      await request(app)
        .post('/api/case-workflow/initialize')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send('invalid json')
        .expect(400);
    });
  });
});