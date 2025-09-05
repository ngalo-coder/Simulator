import LearningPathService from '../services/LearningPathService.js';
import { handleSuccess, handleError } from '../utils/responseHandler.js';
import logger from '../config/logger.js';

// Create a new learning path
export async function createLearningPath(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const pathData = req.body;

    const learningPath = await LearningPathService.createLearningPath(userId, pathData);
    log.info({ pathId: learningPath._id }, 'Learning path created successfully');
    handleSuccess(res, learningPath, 201);
  } catch (error) {
    log.error(error, 'Error creating learning path');
    handleError(res, error, log);
  }
}

// Generate an adaptive learning path
export async function generateAdaptiveLearningPath(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { specialty, programArea, targetLevel } = req.body;

    const learningPath = await LearningPathService.generateAdaptiveLearningPath(userId, {
      specialty,
      programArea,
      targetLevel
    });
    log.info({ pathId: learningPath._id }, 'Adaptive learning path generated successfully');
    handleSuccess(res, learningPath, 201);
  } catch (error) {
    log.error(error, 'Error generating adaptive learning path');
    handleError(res, error, log);
  }
}

// Get all learning paths for a user
export async function getLearningPaths(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { status, specialty, programArea } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (specialty) filters.specialty = specialty;
    if (programArea) filters.programArea = programArea;

    const paths = await LearningPathService.getLearningPaths(userId, filters);
    log.info({ count: paths.length }, 'Learning paths retrieved successfully');
    handleSuccess(res, paths);
  } catch (error) {
    log.error(error, 'Error retrieving learning paths');
    handleError(res, error, log);
  }
}

// Get a specific learning path
export async function getLearningPath(req, res) {
  const log = req.log.child({ pathId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const path = await LearningPathService.getLearningPath(id, userId);
    log.info('Learning path retrieved successfully');
    handleSuccess(res, path);
  } catch (error) {
    log.error(error, 'Error retrieving learning path');
    handleError(res, error, log);
  }
}

// Update learning path progress
export async function updatePathProgress(req, res) {
  const log = req.log.child({ pathId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { moduleId, score, timeSpent } = req.body;

    const path = await LearningPathService.updatePathProgress(userId, id, moduleId, score, timeSpent);
    log.info('Learning path progress updated successfully');
    handleSuccess(res, path);
  } catch (error) {
    log.error(error, 'Error updating learning path progress');
    handleError(res, error, log);
  }
}

// Get next recommended module
export async function getNextModule(req, res) {
  const log = req.log.child({ pathId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const nextModule = await LearningPathService.getNextModule(userId, id);
    log.info('Next module retrieved successfully');
    handleSuccess(res, nextModule);
  } catch (error) {
    log.error(error, 'Error retrieving next module');
    handleError(res, error, log);
  }
}

// Adjust learning path difficulty
export async function adjustPathDifficulty(req, res) {
  const log = req.log.child({ pathId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { performanceData } = req.body;

    const path = await LearningPathService.adjustPathDifficulty(userId, id, performanceData);
    log.info('Learning path difficulty adjusted successfully');
    handleSuccess(res, path);
  } catch (error) {
    log.error(error, 'Error adjusting learning path difficulty');
    handleError(res, error, log);
  }
}