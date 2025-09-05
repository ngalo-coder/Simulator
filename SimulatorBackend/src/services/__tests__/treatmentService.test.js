import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import TreatmentService from '../treatmentService.js';
import Session from '../../models/SessionModel.js';

// Mock dependencies
jest.mock('../../models/SessionModel.js');

describe('TreatmentService', () => {
  const mockSessionId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  const mockSession = {
    _id: new mongoose.Types.ObjectId(),
    differential_diagnosis: [],
    diagnostic_tests: [],
    treatment_plan: [],
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockReturnThis()
  };

  const mockTreatmentPlan = [
    {
      medication: 'Aspirin',
      dosage: '81 mg daily',
      duration: 'Lifelong',
      rationale: 'Cardioprotection'
    },
    {
      medication: 'Atorvastatin',
      dosage: '40 mg daily',
      duration: 'Lifelong',
      rationale: 'Cholesterol management'
    }
  ];

  const mockDiagnosticTests = [
    {
      test: 'ECG',
      rationale: 'Assess for STEMI',
      results: 'Normal sinus rhythm'
    }
  ];

  const mockDifferentialDiagnosis = [
    {
      condition: 'Acute Coronary Syndrome',
      confidence: 0.8,
      rationale: 'Chest pain with risk factors'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeTreatmentPlan', () => {
    it('should analyze treatment plan successfully', async () => {
      Session.findById.mockResolvedValue(mockSession);

      const result = await TreatmentService.analyzeTreatmentPlan(mockSessionId, mockTreatmentPlan);

      expect(Session.findById).toHaveBeenCalledWith(mockSessionId);
      expect(mockSession.treatment_plan).toEqual(mockTreatmentPlan);
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        analysis: expect.objectContaining({
          appropriateness: expect.any(Number),
          completeness: expect.any(Number),
          safety: expect.any(Number),
          feedback: expect.any(String)
        })
      });
    });

    it('should handle invalid session ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(TreatmentService.analyzeTreatmentPlan('invalid-id', mockTreatmentPlan))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid session ID'
        });
    });

    it('should handle session not found', async () => {
      Session.findById.mockResolvedValue(null);

      await expect(TreatmentService.analyzeTreatmentPlan(mockSessionId, mockTreatmentPlan))
        .rejects.toEqual({
          status: 404,
          message: 'Session not found'
        });
    });

    it('should handle empty treatment plan', async () => {
      Session.findById.mockResolvedValue(mockSession);

      await expect(TreatmentService.analyzeTreatmentPlan(mockSessionId, []))
        .rejects.toEqual({
          status: 400,
          message: 'Treatment plan cannot be empty'
        });
    });

    it('should handle database save errors', async () => {
      Session.findById.mockResolvedValue({
        ...mockSession,
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      });

      await expect(TreatmentService.analyzeTreatmentPlan(mockSessionId, mockTreatmentPlan))
        .rejects.toThrow('Database save failed');
    });
  });

  describe('simulateTreatmentOutcomes', () => {
    it('should simulate treatment outcomes successfully', async () => {
      Session.findById.mockResolvedValue(mockSession);

      const result = await TreatmentService.simulateTreatmentOutcomes(mockSessionId);

      expect(Session.findById).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual({
        success: true,
        outcomes: expect.arrayContaining([
          expect.objectContaining({
            medication: expect.any(String),
            effectiveness: expect.any(Number),
            side_effects: expect.any(Array),
            patient_response: expect.any(String)
          })
        ]),
        overall_effectiveness: expect.any(Number),
        recommendations: expect.any(String)
      });
    });

    it('should handle no treatment plan found', async () => {
      Session.findById.mockResolvedValue({
        ...mockSession,
        treatment_plan: []
      });

      await expect(TreatmentService.simulateTreatmentOutcomes(mockSessionId))
        .rejects.toEqual({
          status: 400,
          message: 'No treatment plan found for this session'
        });
    });
  });

  describe('recordTreatmentDecisions', () => {
    it('should record treatment decisions successfully', async () => {
      Session.findById.mockResolvedValue(mockSession);

      const treatmentDecision = {
        type: 'treatment_plan',
        content: 'Prescribed Aspirin 81mg daily',
        confidence: 0.9,
        is_correct: true,
        feedback: 'Appropriate for cardioprotection'
      };

      const result = await TreatmentService.recordTreatmentDecisions(mockSessionId, treatmentDecision);

      expect(Session.findById).toHaveBeenCalledWith(mockSessionId);
      expect(mockSession.treatment_decisions).toContainEqual(
        expect.objectContaining(treatmentDecision)
      );
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle invalid decision type', async () => {
      Session.findById.mockResolvedValue(mockSession);

      const invalidDecision = {
        type: 'invalid_type',
        content: 'Some decision',
        confidence: 0.5
      };

      await expect(TreatmentService.recordTreatmentDecisions(mockSessionId, invalidDecision))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid decision type. Must be one of: differential_diagnosis, diagnostic_test, treatment_plan'
        });
    });
  });

  describe('getTreatmentHistory', () => {
    it('should get treatment history successfully', async () => {
      const sessionWithHistory = {
        ...mockSession,
        treatment_decisions: [
          {
            type: 'treatment_plan',
            content: 'Prescribed medication',
            timestamp: new Date(),
            confidence: 0.8,
            is_correct: true,
            feedback: 'Good choice'
          }
        ]
      };
      Session.findById.mockResolvedValue(sessionWithHistory);

      const result = await TreatmentService.getTreatmentHistory(mockSessionId);

      expect(Session.findById).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(sessionWithHistory.treatment_decisions);
    });

    it('should handle no treatment decisions found', async () => {
      Session.findById.mockResolvedValue(mockSession);

      const result = await TreatmentService.getTreatmentHistory(mockSessionId);

      expect(result).toEqual([]);
    });
  });
});