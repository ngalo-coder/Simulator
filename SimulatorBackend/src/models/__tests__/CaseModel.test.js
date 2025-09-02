import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Case from '../CaseModel.js';

describe('CaseModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCaseData = {
    version: '1.0',
    description: 'Test case for cardiology',
    system_instruction: 'You are a virtual patient with chest pain',
    case_metadata: {
      case_id: 'TEST-001',
      title: 'Acute Chest Pain Case',
      specialty: 'Cardiology',
      program_area: 'Specialty Program',
      module: 'Cardiovascular System',
      difficulty: 'Intermediate',
      tags: ['chest pain', 'cardiology', 'emergency'],
      location: 'Emergency Department'
    },
    patient_persona: {
      name: 'John Doe',
      age: 55,
      gender: 'Male',
      occupation: 'Engineer',
      chief_complaint: 'Chest pain for 2 hours',
      emotional_tone: 'Anxious and worried',
      background_story: 'Previously healthy engineer with family history of heart disease',
      speaks_for: 'Self',
      patient_is_present: true,
      patient_age_for_communication: 55,
      is_pediatric: false,
      pediatric_threshold: 18
    },
    initial_prompt: 'Hello doctor, I have been having severe chest pain for the past 2 hours.',
    clinical_dossier: {
      comment: 'Classic presentation of acute coronary syndrome',
      hidden_diagnosis: 'ST-elevation myocardial infarction',
      history_of_presenting_illness: {
        onset: 'Sudden onset 2 hours ago',
        location: 'Central chest',
        radiation: 'Left arm and jaw',
        character: 'Crushing, pressure-like',
        severity: 8,
        timing_and_duration: 'Constant for 2 hours',
        exacerbating_factors: 'Physical activity',
        relieving_factors: 'Rest, partially relieved by nitroglycerin',
        associated_symptoms: ['Shortness of breath', 'Nausea', 'Diaphoresis']
      },
      review_of_systems: {
        comment: 'Positive for cardiovascular symptoms',
        positive: ['Chest pain', 'Shortness of breath', 'Nausea'],
        negative: ['Fever', 'Cough', 'Abdominal pain']
      },
      past_medical_history: ['Hypertension', 'Hyperlipidemia'],
      medications: ['Lisinopril 10mg daily', 'Atorvastatin 20mg daily'],
      allergies: ['NKDA'],
      surgical_history: ['Appendectomy 1995'],
      family_history: ['Father - MI at age 60', 'Mother - Diabetes'],
      social_history: {
        smoking_status: 'Former smoker, quit 5 years ago',
        alcohol_use: 'Social drinking, 2-3 drinks per week',
        substance_use: 'None',
        diet_and_exercise: 'Sedentary lifestyle, high-fat diet',
        living_situation: 'Lives with spouse'
      }
    },
    simulation_triggers: {
      end_session: {
        condition_keyword: 'discharge',
        patient_response: 'Thank you doctor, I feel much better now.'
      },
      invalid_input: {
        condition_keyword: 'inappropriate',
        patient_response: 'I don\'t understand what you mean.'
      }
    },
    evaluation_criteria: {
      clinical_reasoning: {
        weight: 0.3,
        description: 'Ability to analyze symptoms and reach correct diagnosis'
      },
      history_taking: {
        weight: 0.2,
        description: 'Thoroughness and appropriateness of history questions'
      },
      physical_examination: {
        weight: 0.2,
        description: 'Appropriate physical examination techniques'
      },
      diagnostic_workup: {
        weight: 0.15,
        description: 'Ordering appropriate diagnostic tests'
      },
      treatment_plan: {
        weight: 0.15,
        description: 'Developing appropriate treatment strategy'
      }
    }
  };

  describe('Schema Validation', () => {
    it('should create a valid case with all required fields', () => {
      const caseDoc = new Case(validCaseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(caseDoc.version).toBe('1.0');
      expect(caseDoc.case_metadata.case_id).toBe('TEST-001');
      expect(caseDoc.patient_persona.name).toBe('John Doe');
    });

    it('should require version field', () => {
      const caseData = { ...validCaseData };
      delete caseData.version;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.version).toBeDefined();
    });

    it('should require description field', () => {
      const caseData = { ...validCaseData };
      delete caseData.description;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
    });

    it('should require system_instruction field', () => {
      const caseData = { ...validCaseData };
      delete caseData.system_instruction;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.system_instruction).toBeDefined();
    });

    it('should require case_metadata field', () => {
      const caseData = { ...validCaseData };
      delete caseData.case_metadata;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.case_metadata).toBeDefined();
    });

    it('should require patient_persona field', () => {
      const caseData = { ...validCaseData };
      delete caseData.patient_persona;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.patient_persona).toBeDefined();
    });

    it('should require initial_prompt field', () => {
      const caseData = { ...validCaseData };
      delete caseData.initial_prompt;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.initial_prompt).toBeDefined();
    });

    it('should require clinical_dossier field', () => {
      const caseData = { ...validCaseData };
      delete caseData.clinical_dossier;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.clinical_dossier).toBeDefined();
    });
  });

  describe('Case Metadata Validation', () => {
    it('should require case_id in metadata', () => {
      const caseData = { ...validCaseData };
      delete caseData.case_metadata.case_id;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['case_metadata.case_id']).toBeDefined();
    });

    it('should require title in metadata', () => {
      const caseData = { ...validCaseData };
      delete caseData.case_metadata.title;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['case_metadata.title']).toBeDefined();
    });

    it('should require specialty in metadata', () => {
      const caseData = { ...validCaseData };
      delete caseData.case_metadata.specialty;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['case_metadata.specialty']).toBeDefined();
    });

    it('should validate program_area enum values', () => {
      const caseData = { ...validCaseData };
      caseData.case_metadata.program_area = 'Invalid Program';

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['case_metadata.program_area']).toBeDefined();
    });

    it('should accept valid program_area values', () => {
      const basicProgram = { ...validCaseData };
      basicProgram.case_metadata.program_area = 'Basic Program';

      const specialtyProgram = { ...validCaseData };
      specialtyProgram.case_metadata.program_area = 'Specialty Program';

      const basicCase = new Case(basicProgram);
      const specialtyCase = new Case(specialtyProgram);

      expect(basicCase.validateSync()).toBeUndefined();
      expect(specialtyCase.validateSync()).toBeUndefined();
    });

    it('should validate difficulty enum values', () => {
      const caseData = { ...validCaseData };
      caseData.case_metadata.difficulty = 'Invalid Difficulty';

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['case_metadata.difficulty']).toBeDefined();
    });

    it('should accept valid difficulty values', () => {
      const difficulties = ['Easy', 'Intermediate', 'Hard'];
      
      difficulties.forEach(difficulty => {
        const caseData = { ...validCaseData };
        caseData.case_metadata.difficulty = difficulty;
        
        const caseDoc = new Case(caseData);
        expect(caseDoc.validateSync()).toBeUndefined();
      });
    });

    it('should require location in metadata', () => {
      const caseData = { ...validCaseData };
      delete caseData.case_metadata.location;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['case_metadata.location']).toBeDefined();
    });

    it('should trim whitespace from string fields', () => {
      const caseData = { ...validCaseData };
      caseData.case_metadata.case_id = '  TEST-002  ';
      caseData.case_metadata.title = '  Test Case Title  ';
      caseData.case_metadata.specialty = '  Cardiology  ';

      const caseDoc = new Case(caseData);
      
      expect(caseDoc.case_metadata.case_id).toBe('TEST-002');
      expect(caseDoc.case_metadata.title).toBe('Test Case Title');
      expect(caseDoc.case_metadata.specialty).toBe('Cardiology');
    });
  });

  describe('Patient Persona Validation', () => {
    it('should require name in patient persona', () => {
      const caseData = { ...validCaseData };
      delete caseData.patient_persona.name;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['patient_persona.name']).toBeDefined();
    });

    it('should require age as number in patient persona', () => {
      const caseData = { ...validCaseData };
      caseData.patient_persona.age = 'fifty-five';

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['patient_persona.age']).toBeDefined();
    });

    it('should require gender in patient persona', () => {
      const caseData = { ...validCaseData };
      delete caseData.patient_persona.gender;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['patient_persona.gender']).toBeDefined();
    });

    it('should require chief_complaint in patient persona', () => {
      const caseData = { ...validCaseData };
      delete caseData.patient_persona.chief_complaint;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['patient_persona.chief_complaint']).toBeDefined();
    });

    it('should require emotional_tone in patient persona', () => {
      const caseData = { ...validCaseData };
      delete caseData.patient_persona.emotional_tone;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['patient_persona.emotional_tone']).toBeDefined();
    });

    it('should handle guardian information for pediatric cases', () => {
      const caseData = { ...validCaseData };
      caseData.patient_persona.is_pediatric = true;
      caseData.patient_persona.guardian = {
        name: 'Jane Doe',
        relationship: 'Mother',
        age: 35,
        occupation: 'Teacher',
        emotional_state: 'Worried',
        background_info: 'Concerned parent',
        communication_style: 'Direct and questioning'
      };

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(caseDoc.patient_persona.guardian.name).toBe('Jane Doe');
      expect(caseDoc.patient_persona.guardian.relationship).toBe('Mother');
    });
  });

  describe('Clinical Dossier Validation', () => {
    it('should require hidden_diagnosis in clinical dossier', () => {
      const caseData = { ...validCaseData };
      delete caseData.clinical_dossier.hidden_diagnosis;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['clinical_dossier.hidden_diagnosis']).toBeDefined();
    });

    it('should handle history of presenting illness with numeric severity', () => {
      const caseData = { ...validCaseData };
      caseData.clinical_dossier.history_of_presenting_illness.severity = 'severe';

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['clinical_dossier.history_of_presenting_illness.severity']).toBeDefined();
    });

    it('should accept valid severity as number', () => {
      const caseData = { ...validCaseData };
      caseData.clinical_dossier.history_of_presenting_illness.severity = 7;

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(caseDoc.clinical_dossier.history_of_presenting_illness.severity).toBe(7);
    });

    it('should handle arrays in clinical dossier', () => {
      const caseDoc = new Case(validCaseData);
      
      expect(Array.isArray(caseDoc.clinical_dossier.past_medical_history)).toBe(true);
      expect(Array.isArray(caseDoc.clinical_dossier.medications)).toBe(true);
      expect(Array.isArray(caseDoc.clinical_dossier.allergies)).toBe(true);
      expect(Array.isArray(caseDoc.clinical_dossier.surgical_history)).toBe(true);
      expect(Array.isArray(caseDoc.clinical_dossier.family_history)).toBe(true);
    });

    it('should handle review of systems with positive and negative arrays', () => {
      const caseDoc = new Case(validCaseData);
      
      expect(Array.isArray(caseDoc.clinical_dossier.review_of_systems.positive)).toBe(true);
      expect(Array.isArray(caseDoc.clinical_dossier.review_of_systems.negative)).toBe(true);
      expect(caseDoc.clinical_dossier.review_of_systems.positive).toContain('Chest pain');
      expect(caseDoc.clinical_dossier.review_of_systems.negative).toContain('Fever');
    });
  });

  describe('Simulation Triggers', () => {
    it('should handle simulation triggers structure', () => {
      const caseDoc = new Case(validCaseData);
      
      expect(caseDoc.simulation_triggers.end_session).toBeDefined();
      expect(caseDoc.simulation_triggers.invalid_input).toBeDefined();
      expect(caseDoc.simulation_triggers.end_session.condition_keyword).toBe('discharge');
      expect(caseDoc.simulation_triggers.invalid_input.patient_response).toBe('I don\'t understand what you mean.');
    });
  });

  describe('Evaluation Criteria', () => {
    it('should handle flexible evaluation criteria as map', () => {
      const caseDoc = new Case(validCaseData);
      
      expect(caseDoc.evaluation_criteria.clinical_reasoning).toBeDefined();
      expect(caseDoc.evaluation_criteria.clinical_reasoning.weight).toBe(0.3);
      expect(caseDoc.evaluation_criteria.history_taking.weight).toBe(0.2);
    });

    it('should allow custom evaluation criteria', () => {
      const caseData = { ...validCaseData };
      caseData.evaluation_criteria.custom_criterion = {
        weight: 0.1,
        description: 'Custom evaluation criterion'
      };

      const caseDoc = new Case(caseData);
      const validationError = caseDoc.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(caseDoc.evaluation_criteria.custom_criterion.weight).toBe(0.1);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const caseDoc = new Case(validCaseData);
      
      expect(caseDoc.createdAt).toBeDefined();
      expect(caseDoc.updatedAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', () => {
      const indexes = Case.schema.indexes();
      const indexFields = indexes.map(index => Object.keys(index[0])[0]);
      
      expect(indexFields).toContain('case_metadata.case_id');
      expect(indexFields).toContain('case_metadata.program_area');
      expect(indexFields).toContain('case_metadata.specialty');
      expect(indexFields).toContain('case_metadata.location');
    });
  });
});