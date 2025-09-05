import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import {
  createLearningPath,
  generateAdaptiveLearningPath,
  getLearningPaths,
  getLearningPath,
  updatePathProgress,
  getNextModule,
  adjustPathDifficulty
} from '../controllers/learningPathController.js';

const router = express.Router();

// Create a new learning path
router.post('/learning-paths', protect, createLearningPath);

// Generate an adaptive learning path
router.post('/learning-paths/generate-adaptive', protect, generateAdaptiveLearningPath);

// Get all learning paths for authenticated user
router.get('/learning-paths', protect, getLearningPaths);

// Get a specific learning path
router.get('/learning-paths/:id', protect, getLearningPath);

// Update learning path progress
router.patch('/learning-paths/:id/progress', protect, updatePathProgress);

// Get next recommended module
router.get('/learning-paths/:id/next-module', protect, getNextModule);

// Adjust learning path difficulty
router.patch('/learning-paths/:id/adjust-difficulty', protect, adjustPathDifficulty);

export default router;