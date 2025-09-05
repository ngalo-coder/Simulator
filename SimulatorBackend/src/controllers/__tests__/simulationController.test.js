import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import * as simulationController from '../simulationController.js';
import * as simulationService from '../../services/simulationService.js';
import * as treatmentService from '../../services/treatmentService.js';
import * as aiService from '../../services/aiService.js';
import Session from '../../models/SessionModel.js';

// Mock dependencies
jest.mock('../../services/simulationService.js');
jest.mock('../../services/treatmentService.js');
jest.mock('../../services/aiService.js');
jest.mock('../../models/SessionModel.js');

describe('simulationController', () => {
  const mockSessionId = new mongoose.Types.ObjectId().toString();
  const mockCaseId = 'TEST-001';
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUser = { id: mockUserId, _id: mockUserId };

  const mockSession = {
    _id: mockSessionId,
    case_ref: { _id: new mongoose.Types.ObjectId() },
    history: [],
    save: jest.fn().mockResolvedValue(true)
  };

  const mockTreatmentPlan = [
    {
      medication: 'Aspirin',
      dosage: '81 mg daily',
      duration: 'Lifelong',
      rationale: 'Cardioprotection'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startSimulation', () => {
    it('should start simulation successfully', async () => {
      const mockResult = {
        sessionId: mockSessionId,
        initialPrompt: 'Hello doctor',
        patientName: 'John Doe',
        speaks_for: 'Self'
      };
      simulationService.startSimulation.mockResolvedValue(mockResult);

      const result = await simulationController.startSimulation(mockCaseId);

      expect(simulationService.startSimulation).toHaveBeenCalledWith(mockCaseId);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      simulationService.startSimulation.mockRejectedValue({
        status: 404,
        message: 'Case not found'
      });

      await expect(simulationController.startSimulation('INVALID-CASE'))
        .rejects.toEqual({
          status: 404,
          message: 'Case not found'
        });
    });
  });

  describe('handleAsk', () => {
    const mockQuestion = 'What are your symptoms?';
    const mockResponse = {
      write: jest.fn(),
      end: jest.fn()
    };

    it('should handle ask request successfully', async () => {
      simulationService.handleAsk.mockResolvedValue({});

      const result = await simulationController.handleAsk(mockSessionId, mockQuestion, mockResponse);

      expect(simulationService.handleAsk).toHaveBeenCalledWith(
        mockSessionId,
        mockQuestion,
        mockResponse
      );
      expect(result).toEqual({});
    });

    it('should handle service errors', async () => {
      simulationService.handleAsk.mockRejectedValue({
        status: 404,
        message: 'Session not found'
      });

      await expect(simulationController.handleAsk(mockSessionId, mockQuestion, mockResponse))
        .rejects.toEqual({
          status: 404,
          message: 'Session not found'
        });
    });
  });

  describe('endSimulation', () => {
    it('should end simulation successfully', async () => {
      const mockResult = {
        sessionEnded: true,
        evaluation: 'Good performance',
        history: []
      };
      simulationService.endSession.mockResolvedValue(mockResult);

      const result = await simulationController.endSimulation(mockSessionId, mockUser);

      expect(simulationService.endSession).toHaveBeenCalledWith(mockSessionId, mockUser);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      simulationService.endSession.mockRejectedValue({
        status: 404,
        message: 'Session not found'
      });

      await expect(simulationController.endSimulation(mockSessionId, mockUser))
        .rejects.toEqual({
          status: 404,
          message: 'Session not found'
        });
    });
  });

  describe('submitTreatmentPlan', () => {
    it('should submit treatment plan successfully', async () => {
      const mockAnalysis = {
        success: true,
        analysis: {
          appropriateness: 85,
          completeness: 90,
          safety: 95,
          feedback: 'Appropriate treatment plan'
        }
      };
      treatmentService.analyzeTreatmentPlan.mockResolvedValue(mockAnalysis);

      const result = await simulationController.submitTreatmentPlan(mockSessionId, mockTreatmentPlan);

      expect(treatmentService.analyzeTreatmentPlan).toHaveBeenCalledWith(
        mockSessionId,
        mockTreatmentPlan
      );
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle service errors', async () => {
      treatmentService.analyzeTreatmentPlan.mockRejectedValue({
        status: 400,
        message: 'Invalid treatment plan'
      });

      await expect(simulationController.submitTreatmentPlan(mockSessionId, mockTreatmentPlan))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid treatment plan'
        });
    });

    it('should handle invalid session ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(simulationController.submitTreatmentPlan('invalid-id', mockTreatmentPlan))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid session ID'
        });
    });
  });

  describe('getTreatmentOutcomes', () => {
    it('should get treatment outcomes successfully', async () => {
      const mockOutcomes = [
        {
          medication: 'Aspirin',
          effectiveness: 0.9,
          side_effects: ['GI upset'],
          patient_response: 'Tolerating well'
        }
      ];
      treatmentService.simulateTreatmentOutcomes.mockResolvedValue(mockOutcomes);

      const result = await simulationController.getTreatmentOutcomes(mockSessionId);

      expect(treatmentService.simulateTreatmentOutcomes).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(mockOutcomes);
    });

    it('should handle service errors', async () => {
      treatmentService.simulateTreatmentOutcomes.mockRejectedValue({
        status: 404,
        message: 'No treatment plan found'
      });

      await expect(simulationController.getTreatmentOutcomes(mockSessionId))
        .rejects.toEqual({
          status: 404,
          message: 'No treatment plan found'
        });
    });

    it('should handle invalid session ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(simulationController.getTreatmentOutcomes('invalid-id'))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid session ID'
        });
    });
  });

  describe('getTreatmentHistory', () => {
    it('should get treatment history successfully', async () => {
      const mockHistory = [
        {
          type: 'treatment_plan',
          content: 'Prescribed Aspirin',
          timestamp: new Date(),
          confidence: 0.8,
          is_correct: true,
          feedback: 'Good choice'
        }
      ];
      treatmentService.getTreatmentHistory.mockResolvedValue(mockHistory);

      const result = await simulationController.getTreatmentHistory(mockSessionId);

      expect(treatmentService.getTreatmentHistory).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(mockHistory);
    });

    it('should handle service errors', async () => {
      treatmentService.getTreatmentHistory.mockRejectedValue({
        status: 500,
        message: 'Database error'
      });

      await expect(simulationController.getTreatmentHistory(mockSessionId))
        .rejects.toEqual({
          status: 500,
          message: 'Database error'
        });
    });

    it('should handle invalid session ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(simulationController.getTreatmentHistory('invalid-id'))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid session ID'
        });
    });
  });
});