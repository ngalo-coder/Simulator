import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import {
  validateObjectId,
  validateEndSession,
  validateProgressUpdate,
  validateTreatmentPlan
} from '../validation.js';

// Mock mongoose
jest.mock('mongoose');

describe('validation middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateObjectId', () => {
    it('should call next for valid ObjectId in params', () => {
      const middleware = validateObjectId('userId');
      mockReq.params.userId = '507f1f77bcf86cd799439011';

      middleware(mockReq, mockRes, mockNext);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next for valid ObjectId in body', () => {
      const middleware = validateObjectId('userId');
      mockReq.body.userId = '507f1f77bcf86cd799439011';

      middleware(mockReq, mockRes, mockNext);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ObjectId in params', () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      const middleware = validateObjectId('userId');
      mockReq.params.userId = 'invalid-id';

      middleware(mockReq, mockRes, mockNext);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid userId' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing ObjectId', () => {
      const middleware = validateObjectId('userId');
      // No userId in params or body

      middleware(mockReq, mockRes, mockNext);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(undefined);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid userId' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateEndSession', () => {
    it('should call next for valid sessionId in body', () => {
      mockReq.body.sessionId = '507f1f77bcf86cd799439011';

      validateEndSession(mockReq, mockRes, mockNext);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid sessionId', () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);
      mockReq.body.sessionId = 'invalid-id';

      validateEndSession(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Valid sessionId required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing sessionId', () => {
      // No sessionId in body
      validateEndSession(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Valid sessionId required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateProgressUpdate', () => {
    it('should call next for all valid ObjectIds', () => {
      mockReq.body = {
        userId: '507f1f77bcf86cd799439011',
        caseId: '507f1f77bcf86cd799439012',
        performanceMetricsId: '507f1f77bcf86cd799439013'
      };

      validateProgressUpdate(mockReq, mockRes, mockNext);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledTimes(3);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid userId', () => {
      mongoose.Types.ObjectId.isValid.mockImplementation((id) => id !== 'invalid-id');
      mockReq.body = {
        userId: 'invalid-id',
        caseId: '507f1f77bcf86cd799439012',
        performanceMetricsId: '507f1f77bcf86cd799439013'
      };

      validateProgressUpdate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Valid userId required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing caseId', () => {
      mockReq.body = {
        userId: '507f1f77bcf86cd799439011',
        // caseId missing
        performanceMetricsId: '507f1f77bcf86cd799439013'
      };

      validateProgressUpdate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Valid caseId required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateTreatmentPlan', () => {
    it('should call next for valid treatment plan array', () => {
      mockReq.body.treatmentPlan = [
        {
          intervention: 'Aspirin 81mg daily',
          dosage: '81 mg',
          frequency: 'Daily'
        }
      ];

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for non-array treatment plan', () => {
      mockReq.body.treatmentPlan = 'not an array';

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Treatment plan must be an array' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing treatment plan', () => {
      // No treatmentPlan in body
      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Treatment plan must be an array' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for intervention without description', () => {
      mockReq.body.treatmentPlan = [
        {
          // missing intervention
          dosage: '81 mg'
        }
      ];

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Each intervention must have a valid intervention description' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for non-string intervention', () => {
      mockReq.body.treatmentPlan = [
        {
          intervention: 123, // not a string
          dosage: '81 mg'
        }
      ];

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Each intervention must have a valid intervention description' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for non-string dosage', () => {
      mockReq.body.treatmentPlan = [
        {
          intervention: 'Aspirin 81mg daily',
          dosage: 81 // not a string
        }
      ];

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Dosage must be a string if provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for non-string frequency', () => {
      mockReq.body.treatmentPlan = [
        {
          intervention: 'Aspirin 81mg daily',
          frequency: 1 // not a string
        }
      ];

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Frequency must be a string if provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow missing optional fields', () => {
      mockReq.body.treatmentPlan = [
        {
          intervention: 'Aspirin 81mg daily'
          // no dosage or frequency
        }
      ];

      validateTreatmentPlan(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});