import express from 'express';
import { handleSystemFailure, attemptRecovery, checkSystemStatus } from '../services/simulationStateService.js';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/simulation/system/failure:
 *   post:
 *     summary: Handle simulation system failure
 *     description: Handle and log a simulation system failure, such as patient not responding
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - sessionId
 *             - errorType
 *           properties:
 *             sessionId:
 *               type: string
 *             errorType:
 *               type: string
 *               enum: [PATIENT_NONRESPONSIVE, SYSTEM_ERROR]
 *     responses:
 *       200:
 *         description: System failure handled successfully
 */
router.post('/system/failure', protect, validateObjectId('sessionId'), async (req, res) => {
    try {
        const { sessionId, errorType } = req.body;
        const result = await handleSystemFailure(sessionId, errorType);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR',
            message: 'Failed to handle system failure',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/simulation/system/recovery/{sessionId}:
 *   post:
 *     summary: Attempt system recovery
 *     description: Attempt to recover from a system failure
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/system/recovery/:sessionId', protect, validateObjectId('sessionId'), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await attemptRecovery(sessionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Recovery attempt failed',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/simulation/system/status/{sessionId}:
 *   get:
 *     summary: Check system status
 *     description: Get the current system status for a simulation session
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/system/status/:sessionId', protect, validateObjectId('sessionId'), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const status = await checkSystemStatus(sessionId);
        res.json(status);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to check system status',
            error: error.message
        });
    }
});

export default router;
