import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import {
  createLearningGoal,
  getLearningGoals,
  getLearningGoal,
  updateLearningGoal,
  deleteLearningGoal,
  addActionStep,
  completeActionStep,
  generateSmartGoals,
  getGoalProgressStats,
  getOverdueGoals,
  getGoalsDueSoon
} from '../controllers/learningGoalController.js';

const router = express.Router();

// Create a new learning goal
router.post('/goals', protect, createLearningGoal);

// Get all learning goals for authenticated user
router.get('/goals', protect, getLearningGoals);

// Get a specific learning goal
router.get('/goals/:id', protect, getLearningGoal);

// Update a learning goal
router.put('/goals/:id', protect, updateLearningGoal);

// Delete a learning goal
router.delete('/goals/:id', protect, deleteLearningGoal);

// Add action step to a goal
router.post('/goals/:id/actions', protect, addActionStep);

// Complete an action step
router.patch('/goals/:id/actions/:stepIndex/complete', protect, completeActionStep);

// Generate SMART goals based on performance
router.post('/goals/generate-smart', protect, generateSmartGoals);

// Get goal progress statistics
router.get('/goals/stats/progress', protect, getGoalProgressStats);

// Get overdue goals
router.get('/goals/overdue', protect, getOverdueGoals);

// Get goals due soon
router.get('/goals/due-soon', protect, getGoalsDueSoon);

export default router;