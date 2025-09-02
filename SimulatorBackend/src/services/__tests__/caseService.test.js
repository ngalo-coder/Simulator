import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CaseService } from '../caseService.js';
import Case from '../../models/CaseModel.js';

// Mock the Case model
jest.mock('../../models/CaseModel.js');

describe('CaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildQuery', () => {
    it('should build query with program_area filter', () => {
      const filters = { program_area: 'Specialty Program' };
      const query = CaseService.buildQuery(filters);
      
      expect(query).toEqual({
        'case_metadata.program_area': 'Specialty Program'
      });
    });

    it('should build query with specialty filter', () => {
      const filters = { specialty: 'Cardiology' };
      const query = CaseService.buildQuery(filters);
      
      expect(query).toEqual({
        'case_metadata.specialty': 'Cardiology'
      });
    });

    it('should build query with specialized_area filter', () => {
      const filters = { specialized_area: 'Interventional Cardiology' };
      const query = CaseService.buildQuery(filters);
      
      expect(query).toEqual({
        'case_metadata.specialized_area': 'Interventional Cardiology'
      });
    });

    it('should handle null/empty specialized_area values', () => {
      const nullFilters = { specialized_area: 'null' };
      const noneFilters = { specialized_area: 'None' };
      const emptyFilters = { specialized_area: '' };
      
      const nullQuery = CaseService.buildQuery(nullFilters);
      const noneQuery = CaseService.buildQuery(noneFilters);
      const emptyQuery = CaseService.buildQuery(emptyFilters);
      
      const expectedQuery = {
        'case_metadata.specialized_area': { $in: [null, ""] }
      };
      
      expect(nullQuery).toEqual(expectedQuery);
      expect(noneQuery).toEqual(expectedQuery);
      expect(emptyQuery).toEqual(expectedQuery);
    });

    it('should build query with multiple filters', () => {
      const filters = {
        program_area: 'Specialty Program',
        specialty: 'Cardiology',
        specialized_area: 'Interventional Cardiology'
      };
      const query = CaseService.buildQuery(filters);
      
      expect(query).toEqual({
        'case_metadata.program_area': 'Specialty Program',
        'case_metadata.specialty': 'Cardiology',
        'case_metadata.specialized_area': 'Interventional Cardiology'
      });
    });

    it('should return empty query when no filters provided', () => {
      const filters = {};
      const query = CaseService.buildQuery(filters);
      
      expect(query).toEqual({});
    });

    it('should ignore undefined filter values', () => {
      const filters = {
        program_area: 'Specialty Program',
        specialty: undefined,
        specialized_area: null
      };
      const query = CaseService.buildQuery(filters);
      
      expect(query).toEqual({
        'case_metadata.program_area': 'Specialty Program'
      });
    });
  });

  describe('formatCase', () => {
    const mockCaseData = {
      case_metadata: {
        case_id: 'TEST-001',
        title: 'Acute Chest Pain with Complications',
        program_area: 'Specialty Program',
        specialized_area: 'Cardiology',
        tags: ['chest pain', 'emergency']
      },
      description: 'A case about acute chest pain',
      patient_persona: {
        age: 55,
        gender: 'Male',
        chief_complaint: 'Chest pain for 2 hours'
      },
      clinical_dossier: {
        history_of_presenting_illness: {
          associated_symptoms: ['Shortness of breath', 'Nausea', 'Diaphoresis']
        }
      }
    };

    it('should format case data correctly', () => {
      const formatted = CaseService.formatCase(mockCaseData);
      
      expect(formatted).toEqual({
        id: 'TEST-001',
        title: 'Acute Chest Pain',
        description: 'A case about acute chest pain',
        category: 'Cardiology',
        program_area: 'Specialty Program',
        specialized_area: 'Cardiology',
        patient_age: 55,
        patient_gender: 'Male',
        chief_complaint: 'Chest pain for 2 hours',
        presenting_symptoms: ['Shortness of breath', 'Nausea', 'Diaphoresis'],
        tags: ['chest pain', 'emergency']
      });
    });

    it('should handle missing case_metadata', () => {
      const caseData = { ...mockCaseData };
      delete caseData.case_metadata;
      
      const formatted = CaseService.formatCase(caseData);
      
      expect(formatted.id).toBeUndefined();
      expect(formatted.title).toBeUndefined();
      expect(formatted.program_area).toBeUndefined();
    });

    it('should handle missing patient_persona', () => {
      const caseData = { ...mockCaseData };
      delete caseData.patient_persona;
      
      const formatted = CaseService.formatCase(caseData);
      
      expect(formatted.patient_age).toBeUndefined();
      expect(formatted.patient_gender).toBeUndefined();
      expect(formatted.chief_complaint).toBeUndefined();
    });

    it('should handle missing clinical_dossier', () => {
      const caseData = { ...mockCaseData };
      delete caseData.clinical_dossier;
      
      const formatted = CaseService.formatCase(caseData);
      
      expect(formatted.presenting_symptoms).toEqual([]);
    });

    it('should handle missing associated_symptoms', () => {
      const caseData = { ...mockCaseData };
      delete caseData.clinical_dossier.history_of_presenting_illness.associated_symptoms;
      
      const formatted = CaseService.formatCase(caseData);
      
      expect(formatted.presenting_symptoms).toEqual([]);
    });

    it('should remove " with.*" from title', () => {
      const caseData = {
        ...mockCaseData,
        case_metadata: {
          ...mockCaseData.case_metadata,
          title: 'Acute Chest Pain with Multiple Complications and Risk Factors'
        }
      };
      
      const formatted = CaseService.formatCase(caseData);
      
      expect(formatted.title).toBe('Acute Chest Pain');
    });

    it('should handle missing tags', () => {
      const caseData = { ...mockCaseData };
      delete caseData.case_metadata.tags;
      
      const formatted = CaseService.formatCase(caseData);
      
      expect(formatted.tags).toEqual([]);
    });
  });

  describe('getCases', () => {
    const mockCases = [
      {
        case_metadata: {
          case_id: 'TEST-001',
          title: 'Test Case 1',
          program_area: 'Specialty Program',
          specialized_area: 'Cardiology'
        },
        description: 'Test case 1',
        patient_persona: { age: 55, gender: 'Male', chief_complaint: 'Chest pain' },
        clinical_dossier: { history_of_presenting_illness: { associated_symptoms: [] } }
      },
      {
        case_metadata: {
          case_id: 'TEST-002',
          title: 'Test Case 2',
          program_area: 'Basic Program',
          specialized_area: 'General Medicine'
        },
        description: 'Test case 2',
        patient_persona: { age: 45, gender: 'Female', chief_complaint: 'Headache' },
        clinical_dossier: { history_of_presenting_illness: { associated_symptoms: [] } }
      }
    ];

    beforeEach(() => {
      // Mock the Case.find chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCases)
      };
      
      Case.find.mockReturnValue(mockQuery);
      Case.countDocuments.mockResolvedValue(2);
    });

    it('should get cases with default pagination', async () => {
      const result = await CaseService.getCases({});
      
      expect(Case.find).toHaveBeenCalledWith({});
      expect(result.cases).toHaveLength(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.totalCases).toBe(2);
    });

    it('should handle pagination parameters', async () => {
      const queryParams = { page: 2, limit: 10 };
      
      await CaseService.getCases(queryParams);
      
      const mockQuery = Case.find.mock.results[0].value;
      expect(mockQuery.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should handle string pagination parameters', async () => {
      const queryParams = { page: '3', limit: '5' };
      
      await CaseService.getCases(queryParams);
      
      const mockQuery = Case.find.mock.results[0].value;
      expect(mockQuery.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should apply filters to query', async () => {
      const queryParams = {
        program_area: 'Specialty Program',
        specialty: 'Cardiology'
      };
      
      await CaseService.getCases(queryParams);
      
      expect(Case.find).toHaveBeenCalledWith({
        'case_metadata.program_area': 'Specialty Program',
        'case_metadata.specialty': 'Cardiology'
      });
    });

    it('should calculate total pages correctly', async () => {
      Case.countDocuments.mockResolvedValue(25);
      
      const result = await CaseService.getCases({ limit: 10 });
      
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
      expect(result.totalCases).toBe(25);
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      
      Case.find.mockReturnValue(mockQuery);
      Case.countDocuments.mockResolvedValue(0);
      
      const result = await CaseService.getCases({});
      
      expect(result.cases).toEqual([]);
      expect(result.totalCases).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      Case.find.mockImplementation(() => {
        throw dbError;
      });
      
      await expect(CaseService.getCases({})).rejects.toThrow('Database connection failed');
    });
  });

  describe('getCaseCategories', () => {
    beforeEach(() => {
      Case.distinct.mockImplementation((field, query) => {
        if (field === 'case_metadata.program_area') {
          return Promise.resolve(['Basic Program', 'Specialty Program']);
        }
        if (field === 'case_metadata.specialty') {
          return Promise.resolve(['Cardiology', 'Neurology', 'Orthopedics']);
        }
        if (field === 'case_metadata.specialized_area') {
          return Promise.resolve(['Interventional Cardiology', 'Pediatric Neurology', '']);
        }
        return Promise.resolve([]);
      });
      
      Case.countDocuments.mockResolvedValue(5);
    });

    it('should get all categories without program_area filter', async () => {
      const result = await CaseService.getCaseCategories();
      
      expect(Case.distinct).toHaveBeenCalledWith('case_metadata.program_area');
      expect(Case.distinct).toHaveBeenCalledWith('case_metadata.specialty', {});
      expect(Case.distinct).toHaveBeenCalledWith('case_metadata.specialized_area');
      
      expect(result.program_areas).toEqual(['Basic Program', 'Specialty Program']);
      expect(result.specialties).toEqual(['Cardiology', 'Neurology', 'Orthopedics']);
      expect(result.specialized_areas).toEqual(['Interventional Cardiology', 'Pediatric Neurology']);
      expect(result.specialty_counts).toEqual({});
    });

    it('should get categories with program_area filter and counts', async () => {
      const result = await CaseService.getCaseCategories('Specialty Program');
      
      expect(Case.distinct).toHaveBeenCalledWith('case_metadata.specialty', {
        'case_metadata.program_area': 'Specialty Program'
      });
      
      expect(result.specialty_counts).toEqual({
        'Cardiology': 5,
        'Neurology': 5,
        'Orthopedics': 5
      });
    });

    it('should filter out empty/null values', async () => {
      Case.distinct.mockImplementation((field) => {
        if (field === 'case_metadata.specialty') {
          return Promise.resolve(['Cardiology', '', null, 'Neurology', '   ']);
        }
        if (field === 'case_metadata.specialized_area') {
          return Promise.resolve(['Area1', '', null, 'Area2', '   ']);
        }
        return Promise.resolve([]);
      });
      
      const result = await CaseService.getCaseCategories();
      
      expect(result.specialties).toEqual(['Cardiology', 'Neurology']);
      expect(result.specialized_areas).toEqual(['Area1', 'Area2']);
    });

    it('should sort categories alphabetically', async () => {
      Case.distinct.mockImplementation((field) => {
        if (field === 'case_metadata.program_area') {
          return Promise.resolve(['Specialty Program', 'Basic Program', 'Advanced Program']);
        }
        if (field === 'case_metadata.specialty') {
          return Promise.resolve(['Neurology', 'Cardiology', 'Orthopedics']);
        }
        return Promise.resolve([]);
      });
      
      const result = await CaseService.getCaseCategories();
      
      expect(result.program_areas).toEqual(['Advanced Program', 'Basic Program', 'Specialty Program']);
      expect(result.specialties).toEqual(['Cardiology', 'Neurology', 'Orthopedics']);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database query failed');
      Case.distinct.mockRejectedValue(dbError);
      
      await expect(CaseService.getCaseCategories()).rejects.toThrow('Database query failed');
    });

    it('should handle empty specialty list for counts', async () => {
      Case.distinct.mockImplementation((field) => {
        if (field === 'case_metadata.specialty') {
          return Promise.resolve([]);
        }
        return Promise.resolve(['Basic Program']);
      });
      
      const result = await CaseService.getCaseCategories('Basic Program');
      
      expect(result.specialty_counts).toEqual({});
    });
  });

  describe('shouldEndSession', () => {
    it('should return true for diagnosis trigger words', () => {
      const diagnosisQuestions = [
        'I think this is a heart attack',
        'The patient has myocardial infarction',
        'This is an emergency situation',
        'We need to admit the patient',
        'Patient should be admitted to the ward',
        'Start emergency treatment',
        'Transfer to emergency care'
      ];
      
      diagnosisQuestions.forEach(question => {
        expect(CaseService.shouldEndSession(question)).toBe(true);
      });
    });

    it('should return false for non-diagnosis questions', () => {
      const regularQuestions = [
        'What is your age?',
        'Tell me about your symptoms',
        'When did this start?',
        'Do you have any allergies?',
        'What medications are you taking?',
        'Can you describe the pain?'
      ];
      
      regularQuestions.forEach(question => {
        expect(CaseService.shouldEndSession(question)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      const mixedCaseQuestions = [
        'HEART ATTACK',
        'Heart Attack',
        'heart attack',
        'MYOCARDIAL INFARCTION',
        'Myocardial Infarction',
        'EMERGENCY',
        'Emergency'
      ];
      
      mixedCaseQuestions.forEach(question => {
        expect(CaseService.shouldEndSession(question)).toBe(true);
      });
    });

    it('should handle partial matches', () => {
      const partialMatches = [
        'I suspect a heart attack based on symptoms',
        'Could this be myocardial infarction?',
        'This looks like an emergency to me',
        'Should we admit this patient?',
        'Emergency care is needed immediately'
      ];
      
      partialMatches.forEach(question => {
        expect(CaseService.shouldEndSession(question)).toBe(true);
      });
    });

    it('should handle empty or null input', () => {
      expect(CaseService.shouldEndSession('')).toBe(false);
      expect(CaseService.shouldEndSession(null)).toBe(false);
      expect(CaseService.shouldEndSession(undefined)).toBe(false);
    });

    it('should handle special characters and punctuation', () => {
      const questionsWithPunctuation = [
        'Heart attack!',
        'Heart attack?',
        'Heart attack.',
        'Heart attack, right?',
        'Heart-attack symptoms'
      ];
      
      questionsWithPunctuation.forEach(question => {
        expect(CaseService.shouldEndSession(question)).toBe(true);
      });
    });
  });

  describe('CASE_FIELDS constant', () => {
    it('should contain expected fields', () => {
      const expectedFields = [
        'case_metadata.case_id',
        'case_metadata.title',
        'description',
        'case_metadata.program_area',
        'case_metadata.specialized_area',
        'patient_persona.age',
        'patient_persona.gender',
        'patient_persona.chief_complaint',
        'clinical_dossier.history_of_presenting_illness.associated_symptoms',
        'case_metadata.tags'
      ];
      
      const fieldsString = CaseService.CASE_FIELDS;
      
      expectedFields.forEach(field => {
        expect(fieldsString).toContain(field);
      });
    });
  });

  describe('DIAGNOSIS_TRIGGERS constant', () => {
    it('should contain expected trigger words', () => {
      const expectedTriggers = [
        'heart attack',
        'myocardial infarction',
        'emergency',
        'admit',
        'admitted',
        'treatment',
        'ward',
        'emergency care'
      ];
      
      expectedTriggers.forEach(trigger => {
        expect(CaseService.DIAGNOSIS_TRIGGERS).toContain(trigger);
      });
    });
  });
});