import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/UserModel.js';
import caseTemplateService from '../src/services/CaseTemplateService.js';
import jwt from 'jsonwebtoken';

describe('Case Templates API', () => {
  let studentToken;
  let educatorToken;
  let adminToken;
  let studentUser;
  let educatorUser;
  let adminUser;

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
        institution: 'Test University'
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
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: '@test.com' } });
  });

  describe('CaseTemplateService', () => {
    it('should have templates for all disciplines', () => {
      const templates = caseTemplateService.getAllTemplates();
      expect(templates).to.be.an('array');
      expect(templates).to.have.length(5);

      const disciplines = templates.map(t => t.discipline);
      expect(disciplines).to.include.members(['medicine', 'nursing', 'laboratory', 'radiology', 'pharmacy']);
    });

    it('should get template by discipline', () => {
      const template = caseTemplateService.getTemplate('medicine');
      expect(template).to.have.property('discipline', 'medicine');
      expect(template).to.have.property('metadata');
      expect(template).to.have.property('template');
      expect(template.metadata).to.have.property('name');
      expect(template.metadata).to.have.property('description');
    });

    it('should throw error for invalid discipline', () => {
      expect(() => {
        caseTemplateService.getTemplate('invalid');
      }).to.throw('Template not found for discipline: invalid');
    });

    it('should validate case data correctly', () => {
      const validCaseData = {
        case_metadata: {
          title: 'Test Case',
          specialty: 'medicine',
          difficulty: 'intermediate'
        },
        patient_persona: {
          name: 'John Doe',
          age: 45,
          chief_complaint: 'Chest pain'
        },
        clinical_dossier: {
          hidden_diagnosis: 'Myocardial infarction'
        }
      };

      const validation = caseTemplateService.validateCaseData(validCaseData, 'medicine');
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.be.an('array').that.is.empty;
    });

    it('should identify validation errors', () => {
      const invalidCaseData = {
        case_metadata: {
          difficulty: 'invalid_difficulty'
        }
      };

      const validation = caseTemplateService.validateCaseData(invalidCaseData, 'medicine');
      expect(validation.isValid).to.be.false;
      expect(validation.errors).to.be.an('array').that.is.not.empty;
      expect(validation.errors).to.include('Missing required section: patient_persona');
      expect(validation.errors).to.include('Missing required section: clinical_dossier');
    });

    it('should create case from template', () => {
      const customData = {
        case_metadata: {
          title: 'Custom Medical Case'
        },
        patient_persona: {
          name: 'Jane Smith',
          age: 35
        }
      };

      const caseData = caseTemplateService.createCaseFromTemplate('medicine', customData, educatorUser);
      expect(caseData.case_metadata.title).to.equal('Custom Medical Case');
      expect(caseData.patient_persona.name).to.equal('Jane Smith');
      expect(caseData.patient_persona.age).to.equal(35);
      expect(caseData.case_metadata.specialty).to.equal('medicine');
      expect(caseData.case_metadata.created_from_template).to.be.true;
    });
  });

  describe('GET /api/case-templates', () => {
    it('should get all templates', async () => {
      const response = await request(app)
        .get('/api/case-templates')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(5);

      const template = response.body.data[0];
      expect(template).to.have.property('discipline');
      expect(template).to.have.property('metadata');
      expect(template).to.have.property('template');
      expect(template.metadata).to.have.property('name');
      expect(template.metadata).to.have.property('description');
      expect(template.metadata).to.have.property('icon');
      expect(template.metadata).to.have.property('color');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/case-templates')
        .expect(401);
    });
  });

  describe('GET /api/case-templates/:discipline', () => {
    it('should get medical template', async () => {
      const response = await request(app)
        .get('/api/case-templates/medicine')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('medicine');
      expect(response.body.data.template).to.have.property('case_metadata');
      expect(response.body.data.template).to.have.property('patient_persona');
      expect(response.body.data.template).to.have.property('clinical_dossier');
      expect(response.body.data.template.case_metadata.specialty).to.equal('medicine');
    });

    it('should get nursing template', async () => {
      const response = await request(app)
        .get('/api/case-templates/nursing')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('nursing');
      expect(response.body.data.template.case_metadata.specialty).to.equal('nursing');
      expect(response.body.data.template.clinical_dossier).to.have.property('nursing_assessment');
      expect(response.body.data.template.clinical_dossier).to.have.property('care_plan');
    });

    it('should get laboratory template', async () => {
      const response = await request(app)
        .get('/api/case-templates/laboratory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('laboratory');
      expect(response.body.data.template.case_metadata.specialty).to.equal('laboratory');
      expect(response.body.data.template.clinical_dossier).to.have.property('specimen_information');
      expect(response.body.data.template.clinical_dossier).to.have.property('test_requests');
    });

    it('should get radiology template', async () => {
      const response = await request(app)
        .get('/api/case-templates/radiology')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('radiology');
      expect(response.body.data.template.case_metadata.specialty).to.equal('radiology');
      expect(response.body.data.template.clinical_dossier).to.have.property('imaging_study');
      expect(response.body.data.template.clinical_dossier).to.have.property('systematic_review');
    });

    it('should get pharmacy template', async () => {
      const response = await request(app)
        .get('/api/case-templates/pharmacy')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('pharmacy');
      expect(response.body.data.template.case_metadata.specialty).to.equal('pharmacy');
      expect(response.body.data.template.clinical_dossier).to.have.property('medication_history');
      expect(response.body.data.template.clinical_dossier).to.have.property('prescription_review');
    });

    it('should return 404 for invalid discipline', async () => {
      await request(app)
        .get('/api/case-templates/invalid')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('GET /api/case-templates/:discipline/fields', () => {
    it('should get template field structure', async () => {
      const response = await request(app)
        .get('/api/case-templates/medicine/fields')
        .set('Authorization', `Bearer ${educatorToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.discipline).to.equal('medicine');
      expect(response.body.data.fields).to.be.an('object');
      expect(response.body.data.fields).to.have.property('case_metadata.title');
      expect(response.body.data.fields).to.have.property('patient_persona.name');
      expect(response.body.data.fields).to.have.property('clinical_dossier.hidden_diagnosis');
    });
  });

  describe('POST /api/case-templates/:discipline/validate', () => {
    it('should validate valid case data', async () => {
      const validCaseData = {
        case_metadata: {
          title: 'Test Medical Case',
          specialty: 'medicine',
          difficulty: 'intermediate'
        },
        patient_persona: {
          name: 'John Doe',
          age: 45,
          chief_complaint: 'Chest pain'
        },
        clinical_dossier: {
          hidden_diagnosis: 'Myocardial infarction'
        }
      };

      const response = await request(app)
        .post('/api/case-templates/medicine/validate')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(validCaseData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.isValid).to.be.true;
      expect(response.body.data.errors).to.be.an('array').that.is.empty;
    });

    it('should identify validation errors', async () => {
      const invalidCaseData = {
        case_metadata: {
          difficulty: 'invalid'
        }
      };

      const response = await request(app)
        .post('/api/case-templates/medicine/validate')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(invalidCaseData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.isValid).to.be.false;
      expect(response.body.data.errors).to.be.an('array').that.is.not.empty;
    });

    it('should require educator or admin role', async () => {
      const caseData = {
        case_metadata: {
          title: 'Test Case'
        }
      };

      await request(app)
        .post('/api/case-templates/medicine/validate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(caseData)
        .expect(403);
    });
  });

  describe('POST /api/case-templates/:discipline/create', () => {
    it('should create case from template', async () => {
      const customData = {
        case_metadata: {
          title: 'Custom Medical Case'
        },
        patient_persona: {
          name: 'Jane Smith',
          age: 35,
          chief_complaint: 'Abdominal pain'
        }
      };

      const response = await request(app)
        .post('/api/case-templates/medicine/create')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(customData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data.case_metadata.title).to.equal('Custom Medical Case');
      expect(response.body.data.patient_persona.name).to.equal('Jane Smith');
      expect(response.body.data.case_metadata.specialty).to.equal('medicine');
      expect(response.body.data.case_metadata.created_from_template).to.be.true;
      expect(response.body.data.case_metadata.case_id).to.match(/^MED_\d{6}_\d{3}$/);
    });

    it('should create nursing case from template', async () => {
      const customData = {
        case_metadata: {
          title: 'Post-Operative Care Case'
        },
        patient_persona: {
          name: 'Robert Wilson',
          age: 68,
          admission_reason: 'Post-operative monitoring'
        }
      };

      const response = await request(app)
        .post('/api/case-templates/nursing/create')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send(customData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data.case_metadata.specialty).to.equal('nursing');
      expect(response.body.data.case_metadata.case_id).to.match(/^NUR_\d{6}_\d{3}$/);
    });

    it('should require educator or admin role', async () => {
      const customData = {
        case_metadata: {
          title: 'Test Case'
        }
      };

      await request(app)
        .post('/api/case-templates/medicine/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(customData)
        .expect(403);
    });
  });

  describe('Template Structure Validation', () => {
    it('should have consistent structure across all templates', () => {
      const templates = caseTemplateService.getAllTemplates();
      
      templates.forEach(({ discipline, template }) => {
        // All templates should have these core sections
        expect(template).to.have.property('case_metadata');
        expect(template).to.have.property('patient_persona');
        expect(template).to.have.property('clinical_dossier');
        expect(template).to.have.property('evaluation_criteria');
        
        // Case metadata should have required fields
        expect(template.case_metadata).to.have.property('specialty', discipline);
        expect(template.case_metadata).to.have.property('difficulty');
        expect(template.case_metadata).to.have.property('estimated_duration');
        
        // Evaluation criteria should be properly structured
        expect(template.evaluation_criteria).to.be.an('object');
        Object.values(template.evaluation_criteria).forEach(criterion => {
          expect(criterion).to.have.property('weight');
          expect(criterion).to.have.property('max_score');
          expect(criterion.weight).to.be.a('number');
          expect(criterion.max_score).to.be.a('number');
        });
      });
    });

    it('should have discipline-specific sections', () => {
      // Medical template specific sections
      const medicalTemplate = caseTemplateService.getTemplate('medicine');
      expect(medicalTemplate.template.clinical_dossier).to.have.property('physical_examination');
      expect(medicalTemplate.template.clinical_dossier).to.have.property('differential_diagnosis');
      
      // Nursing template specific sections
      const nursingTemplate = caseTemplateService.getTemplate('nursing');
      expect(nursingTemplate.template.clinical_dossier).to.have.property('nursing_assessment');
      expect(nursingTemplate.template.clinical_dossier).to.have.property('care_plan');
      
      // Laboratory template specific sections
      const labTemplate = caseTemplateService.getTemplate('laboratory');
      expect(labTemplate.template.clinical_dossier).to.have.property('specimen_information');
      expect(labTemplate.template.clinical_dossier).to.have.property('analytical_phase');
      
      // Radiology template specific sections
      const radioTemplate = caseTemplateService.getTemplate('radiology');
      expect(radioTemplate.template.clinical_dossier).to.have.property('imaging_study');
      expect(radioTemplate.template.clinical_dossier).to.have.property('systematic_review');
      
      // Pharmacy template specific sections
      const pharmTemplate = caseTemplateService.getTemplate('pharmacy');
      expect(pharmTemplate.template.clinical_dossier).to.have.property('medication_history');
      expect(pharmTemplate.template.clinical_dossier).to.have.property('drug_interactions');
    });
  });

  describe('Template Metadata', () => {
    it('should have complete metadata for all templates', () => {
      const templates = caseTemplateService.getAllTemplates();
      
      templates.forEach(({ discipline, metadata }) => {
        expect(metadata).to.have.property('name');
        expect(metadata).to.have.property('description');
        expect(metadata).to.have.property('icon');
        expect(metadata).to.have.property('color');
        expect(metadata).to.have.property('version');
        
        expect(metadata.name).to.be.a('string').that.is.not.empty;
        expect(metadata.description).to.be.a('string').that.is.not.empty;
        expect(metadata.icon).to.be.a('string').that.is.not.empty;
        expect(metadata.color).to.match(/^#[0-9a-f]{6}$/i);
        expect(metadata.version).to.match(/^\d+\.\d+\.\d+$/);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      await request(app)
        .get('/api/case-templates')
        .expect(401);
    });

    it('should handle invalid discipline gracefully', async () => {
      await request(app)
        .get('/api/case-templates/invalid')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should handle malformed request data', async () => {
      await request(app)
        .post('/api/case-templates/medicine/validate')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send('invalid json')
        .expect(400);
    });
  });
});