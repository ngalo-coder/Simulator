import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Session from '../SessionModel.js';

describe('SessionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validSessionData = {
    case_ref: new mongoose.Types.ObjectId(),
    original_case_id: 'VP-ABD-002',
    history: [
      {
        role: 'Clinician',
        content: 'Hello, what brings you in today?',
        timestamp: new Date()
      },
      {
        role: 'Patient',
        content: 'I have been having chest pain for the past 2 hours.',
        timestamp: new Date()
      }
    ],
    evaluation: 'Good clinical reasoning demonstrated',
    sessionEnded: false
  };

  describe('Schema Validation', () => {
    it('should create a valid session with required fields', () => {
      const session = new Session(validSessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(session.case_ref).toEqual(validSessionData.case_ref);
      expect(session.original_case_id).toBe('VP-ABD-002');
      expect(session.sessionEnded).toBe(false);
    });

    it('should require case_ref field', () => {
      const sessionData = { ...validSessionData };
      delete sessionData.case_ref;

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.case_ref).toBeDefined();
    });

    it('should require original_case_id field', () => {
      const sessionData = { ...validSessionData };
      delete sessionData.original_case_id;

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.original_case_id).toBeDefined();
    });

    it('should validate case_ref as ObjectId', () => {
      const sessionData = { ...validSessionData };
      sessionData.case_ref = 'invalid-object-id';

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.case_ref).toBeDefined();
    });

    it('should trim whitespace from original_case_id', () => {
      const sessionData = { ...validSessionData };
      sessionData.original_case_id = '  VP-ABD-003  ';

      const session = new Session(sessionData);
      
      expect(session.original_case_id).toBe('VP-ABD-003');
    });

    it('should have default values for optional fields', () => {
      const minimalSessionData = {
        case_ref: new mongoose.Types.ObjectId(),
        original_case_id: 'VP-ABD-004'
      };

      const session = new Session(minimalSessionData);
      
      expect(session.evaluation).toBeNull();
      expect(session.sessionEnded).toBe(false);
      expect(Array.isArray(session.history)).toBe(true);
      expect(session.history).toHaveLength(0);
    });
  });

  describe('Message Schema Validation', () => {
    it('should validate message role enum values', () => {
      const sessionData = { ...validSessionData };
      sessionData.history = [{
        role: 'InvalidRole',
        content: 'Test message',
        timestamp: new Date()
      }];

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['history.0.role']).toBeDefined();
    });

    it('should accept valid message role values', () => {
      const validRoles = ['Clinician', 'Patient', 'System', 'AI Evaluator'];
      
      validRoles.forEach(role => {
        const sessionData = {
          case_ref: new mongoose.Types.ObjectId(),
          original_case_id: 'VP-TEST-001',
          history: [{
            role: role,
            content: 'Test message',
            timestamp: new Date()
          }]
        };

        const session = new Session(sessionData);
        const validationError = session.validateSync();
        
        expect(validationError).toBeUndefined();
        expect(session.history[0].role).toBe(role);
      });
    });

    it('should require message content', () => {
      const sessionData = { ...validSessionData };
      sessionData.history = [{
        role: 'Clinician',
        timestamp: new Date()
      }];

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['history.0.content']).toBeDefined();
    });

    it('should require message role', () => {
      const sessionData = { ...validSessionData };
      sessionData.history = [{
        content: 'Test message',
        timestamp: new Date()
      }];

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['history.0.role']).toBeDefined();
    });

    it('should trim whitespace from message content', () => {
      const sessionData = { ...validSessionData };
      sessionData.history = [{
        role: 'Clinician',
        content: '  Hello, how are you feeling?  ',
        timestamp: new Date()
      }];

      const session = new Session(sessionData);
      
      expect(session.history[0].content).toBe('Hello, how are you feeling?');
    });

    it('should have default timestamp for messages', () => {
      const sessionData = {
        case_ref: new mongoose.Types.ObjectId(),
        original_case_id: 'VP-TEST-002',
        history: [{
          role: 'Patient',
          content: 'I feel sick'
        }]
      };

      const session = new Session(sessionData);
      
      expect(session.history[0].timestamp).toBeDefined();
      expect(session.history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle multiple messages in history', () => {
      const sessionData = { ...validSessionData };
      sessionData.history = [
        {
          role: 'Clinician',
          content: 'What brings you in today?',
          timestamp: new Date('2023-01-01T10:00:00Z')
        },
        {
          role: 'Patient',
          content: 'I have chest pain',
          timestamp: new Date('2023-01-01T10:01:00Z')
        },
        {
          role: 'System',
          content: 'Vital signs recorded',
          timestamp: new Date('2023-01-01T10:02:00Z')
        },
        {
          role: 'AI Evaluator',
          content: 'Good questioning technique',
          timestamp: new Date('2023-01-01T10:03:00Z')
        }
      ];

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(session.history).toHaveLength(4);
      expect(session.history[0].role).toBe('Clinician');
      expect(session.history[1].role).toBe('Patient');
      expect(session.history[2].role).toBe('System');
      expect(session.history[3].role).toBe('AI Evaluator');
    });
  });

  describe('Evaluation Field', () => {
    it('should accept string evaluation', () => {
      const sessionData = { ...validSessionData };
      sessionData.evaluation = 'Excellent clinical reasoning and communication skills demonstrated.';

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(session.evaluation).toBe('Excellent clinical reasoning and communication skills demonstrated.');
    });

    it('should trim whitespace from evaluation', () => {
      const sessionData = { ...validSessionData };
      sessionData.evaluation = '  Good performance overall  ';

      const session = new Session(sessionData);
      
      expect(session.evaluation).toBe('Good performance overall');
    });

    it('should handle null evaluation', () => {
      const sessionData = { ...validSessionData };
      sessionData.evaluation = null;

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(session.evaluation).toBeNull();
    });

    it('should handle empty string evaluation', () => {
      const sessionData = { ...validSessionData };
      sessionData.evaluation = '';

      const session = new Session(sessionData);
      
      expect(session.evaluation).toBe('');
    });
  });

  describe('Session Status', () => {
    it('should handle sessionEnded boolean values', () => {
      const activeSession = new Session({
        ...validSessionData,
        sessionEnded: false
      });

      const endedSession = new Session({
        ...validSessionData,
        sessionEnded: true
      });

      expect(activeSession.sessionEnded).toBe(false);
      expect(endedSession.sessionEnded).toBe(true);
    });

    it('should convert truthy values to boolean', () => {
      const sessionData = { ...validSessionData };
      sessionData.sessionEnded = 'true';

      const session = new Session(sessionData);
      
      expect(session.sessionEnded).toBe(true);
    });

    it('should convert falsy values to boolean', () => {
      const sessionData = { ...validSessionData };
      sessionData.sessionEnded = '';

      const session = new Session(sessionData);
      
      expect(session.sessionEnded).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const session = new Session(validSessionData);
      
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe('References', () => {
    it('should reference Case model correctly', () => {
      const session = new Session(validSessionData);
      
      expect(session.case_ref).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(session.schema.paths.case_ref.options.ref).toBe('Case');
    });

    it('should handle valid ObjectId for case_ref', () => {
      const objectId = new mongoose.Types.ObjectId();
      const sessionData = { ...validSessionData };
      sessionData.case_ref = objectId;

      const session = new Session(sessionData);
      
      expect(session.case_ref).toEqual(objectId);
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', () => {
      const indexes = Session.schema.indexes();
      const indexFields = indexes.map(index => Object.keys(index[0])[0]);
      
      expect(indexFields).toContain('case_ref');
      expect(indexFields).toContain('original_case_id');
      expect(indexFields).toContain('createdAt');
    });

    it('should have descending index on createdAt', () => {
      const indexes = Session.schema.indexes();
      const createdAtIndex = indexes.find(index => index[0].createdAt !== undefined);
      
      expect(createdAtIndex).toBeDefined();
      expect(createdAtIndex[0].createdAt).toBe(-1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle a complete session lifecycle', () => {
      const sessionData = {
        case_ref: new mongoose.Types.ObjectId(),
        original_case_id: 'VP-CARDIO-001',
        history: [
          {
            role: 'System',
            content: 'Session started',
            timestamp: new Date('2023-01-01T09:00:00Z')
          },
          {
            role: 'Clinician',
            content: 'Good morning, what brings you to the clinic today?',
            timestamp: new Date('2023-01-01T09:01:00Z')
          },
          {
            role: 'Patient',
            content: 'I have been experiencing chest pain since yesterday.',
            timestamp: new Date('2023-01-01T09:02:00Z')
          },
          {
            role: 'Clinician',
            content: 'Can you describe the pain? Is it sharp or dull?',
            timestamp: new Date('2023-01-01T09:03:00Z')
          },
          {
            role: 'Patient',
            content: 'It is a sharp, stabbing pain that comes and goes.',
            timestamp: new Date('2023-01-01T09:04:00Z')
          },
          {
            role: 'AI Evaluator',
            content: 'Good follow-up question about pain characteristics.',
            timestamp: new Date('2023-01-01T09:05:00Z')
          },
          {
            role: 'System',
            content: 'Session ended by user',
            timestamp: new Date('2023-01-01T09:15:00Z')
          }
        ],
        evaluation: 'Student demonstrated good questioning technique and gathered relevant clinical information. Suggested areas for improvement: explore associated symptoms more thoroughly.',
        sessionEnded: true
      };

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(session.history).toHaveLength(7);
      expect(session.sessionEnded).toBe(true);
      expect(session.evaluation).toContain('good questioning technique');
    });

    it('should handle empty history array', () => {
      const sessionData = {
        case_ref: new mongoose.Types.ObjectId(),
        original_case_id: 'VP-EMPTY-001',
        history: []
      };

      const session = new Session(sessionData);
      const validationError = session.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(session.history).toHaveLength(0);
    });
  });
});