import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import simulationRoutes from '../simulationRoutes.js';
import * as simulationController from '../../controllers/simulationController.js';
import { validateTreatmentPlan } from '../../middleware/validation.js';

// Mock dependencies
jest.mock('../../controllers/simulationController.js');
jest.mock('../../middleware/validation.js');

describe('simulationRoutes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/simulation', simulationRoutes);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /simulation/treatment-plan/:sessionId', () => {
    const mockSessionId = 'test-session-123';
    const mockTreatmentPlan = [
      {
        medication: 'Aspirin',
        dosage: '81 mg daily',
        duration: 'Lifelong',
        rationale: 'Cardioprotection'
      }
    ];

    it('should submit treatment plan successfully', async () => {
      simulationController.submitTreatmentPlan.mockResolvedValue({
        success: true,
        analysis: {
          appropriateness: 85,
          completeness: 90,
          safety: 95,
          feedback: 'Appropriate treatment plan'
        }
      });

      validateTreatmentPlan.mockImplementation((req, res, next) => next());

      const response = await request(app)
        .post(`/simulation/treatment-plan/${mockSessionId}`)
        .send(mockTreatmentPlan)
        .expect(200);

      expect(validateTreatmentPlan).toHaveBeenCalled();
      expect(simulationController.submitTreatmentPlan).toHaveBeenCalledWith(
        mockSessionId,
        mockTreatmentPlan
      );
      expect(response.body).toEqual({
        success: true,
        analysis: {
          appropriateness: 85,
          completeness: 90,
          safety: 95,
          feedback: 'Appropriate treatment plan'
        }
      });
    });

    it('should handle validation errors', async () => {
      validateTreatmentPlan.mockImplementation((req, res, next) => {
        res.status(400).json({ error: 'Invalid treatment plan format' });
      });

      const response = await request(app)
        .post(`/simulation/treatment-plan/${mockSessionId}`)
        .send([{ invalid: 'data' }])
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid treatment plan format' });
      expect(simulationController.submitTreatmentPlan).not.toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      validateTreatmentPlan.mockImplementation((req, res, next) => next());
      simulationController.submitTreatmentPlan.mockRejectedValue({
        status: 500,
        message: 'Internal server error'
      });

      const response = await request(app)
        .post(`/simulation/treatment-plan/${mockSessionId}`)
        .send(mockTreatmentPlan)
        .expect(500);

      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('GET /simulation/treatment-outcomes/:sessionId', () => {
    const mockSessionId = 'test-session-123';
    const mockOutcomes = [
      {
        medication: 'Aspirin',
        effectiveness: 0.9,
        side_effects: ['GI upset'],
        patient_response: 'Tolerating well'
      }
    ];

    it('should get treatment outcomes successfully', async () => {
      simulationController.getTreatmentOutcomes.mockResolvedValue(mockOutcomes);

      const response = await request(app)
        .get(`/simulation/treatment-outcomes/${mockSessionId}`)
        .expect(200);

      expect(simulationController.getTreatmentOutcomes).toHaveBeenCalledWith(mockSessionId);
      expect(response.body).toEqual(mockOutcomes);
    });

    it('should handle no outcomes found', async () => {
      simulationController.getTreatmentOutcomes.mockResolvedValue([]);

      const response = await request(app)
        .get(`/simulation/treatment-outcomes/${mockSessionId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle controller errors', async () => {
      simulationController.getTreatmentOutcomes.mockRejectedValue({
        status: 404,
        message: 'Session not found'
      });

      const response = await request(app)
        .get(`/simulation/treatment-outcomes/${mockSessionId}`)
        .expect(404);

      expect(response.body).toEqual({ message: 'Session not found' });
    });
  });

  describe('POST /simulation/start', () => {
    it('should start simulation successfully', async () => {
      const mockCaseId = 'TEST-001';
      const mockResult = {
        sessionId: 'new-session-123',
        initialPrompt: 'Hello doctor, I have chest pain.',
        patientName: 'John Doe',
        speaks_for: 'Self'
      };

      simulationController.startSimulation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/simulation/start')
        .send({ caseId: mockCaseId })
        .expect(200);

      expect(simulationController.startSimulation).toHaveBeenCalledWith(mockCaseId);
      expect(response.body).toEqual(mockResult);
    });

    it('should handle missing caseId', async () => {
      const response = await request(app)
        .post('/simulation/start')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'caseId is required' });
      expect(simulationController.startSimulation).not.toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      simulationController.startSimulation.mockRejectedValue({
        status: 404,
        message: 'Case not found'
      });

      const response = await request(app)
        .post('/simulation/start')
        .send({ caseId: 'NONEXISTENT' })
        .expect(404);

      expect(response.body).toEqual({ message: 'Case not found' });
    });
  });

  describe('POST /simulation/ask/:sessionId', () => {
    const mockSessionId = 'test-session-123';
    const mockQuestion = 'What are your symptoms?';

    it('should handle ask request successfully', async () => {
      simulationController.handleAsk.mockResolvedValue({});

      const response = await request(app)
        .post(`/simulation/ask/${mockSessionId}`)
        .send({ question: mockQuestion })
        .expect(200);

      expect(simulationController.handleAsk).toHaveBeenCalledWith(mockSessionId, mockQuestion);
      expect(response.body).toEqual({});
    });

    it('should handle missing question', async () => {
      const response = await request(app)
        .post(`/simulation/ask/${mockSessionId}`)
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'question is required' });
      expect(simulationController.handleAsk).not.toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      simulationController.handleAsk.mockRejectedValue({
        status: 404,
        message: 'Session not found'
      });

      const response = await request(app)
        .post(`/simulation/ask/${mockSessionId}`)
        .send({ question: mockQuestion })
        .expect(404);

      expect(response.body).toEqual({ message: 'Session not found' });
    });
  });

  describe('POST /simulation/end/:sessionId', () => {
    const mockSessionId = 'test-session-123';
    const mockUser = { id: 'user-123' };

    it('should end simulation successfully', async () => {
      const mockResult = {
        sessionEnded: true,
        evaluation: 'Good performance',
        history: []
      };

      simulationController.endSimulation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post(`/simulation/end/${mockSessionId}`)
        .send({ user: mockUser })
        .expect(200);

      expect(simulationController.endSimulation).toHaveBeenCalledWith(mockSessionId, mockUser);
      expect(response.body).toEqual(mockResult);
    });

    it('should handle missing user', async () => {
      const response = await request(app)
        .post(`/simulation/end/${mockSessionId}`)
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'user is required' });
      expect(simulationController.endSimulation).not.toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      simulationController.endSimulation.mockRejectedValue({
        status: 404,
        message: 'Session not found'
      });

      const response = await request(app)
        .post(`/simulation/end/${mockSessionId}`)
        .send({ user: mockUser })
        .expect(404);

      expect(response.body).toEqual({ message: 'Session not found' });
    });
  });
});