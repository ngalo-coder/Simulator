import LearningGoalService from '../services/learningGoalService.js';
import { handleSuccess, handleError } from '../utils/responseHandler.js';
import logger from '../config/logger.js';

// Create a new learning goal
export async function createLearningGoal(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const goalData = req.body;

    const goal = await LearningGoalService.createGoal(userId, goalData);
    log.info({ goalId: goal._id }, 'Learning goal created successfully');
    handleSuccess(res, goal, 201);
  } catch (error) {
    log.error(error, 'Error creating learning goal');
    handleError(res, error, log);
  }
}

// Get all learning goals for a user
export async function getLearningGoals(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { status, category, priority } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;

    const goals = await LearningGoalService.getGoalsByUser(userId, filters);
    log.info({ count: goals.length }, 'Learning goals retrieved successfully');
    handleSuccess(res, goals);
  } catch (error) {
    log.error(error, 'Error retrieving learning goals');
    handleError(res, error, log);
  }
}

// Get a specific learning goal
export async function getLearningGoal(req, res) {
  const log = req.log.child({ goalId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goals = await LearningGoalService.getGoalsByUser(userId);
    const goal = goals.find(g => g._id.toString() === id);

    if (!goal) {
      log.warn('Learning goal not found');
      return handleError(res, { status: 404, message: 'Learning goal not found' }, log);
    }

    log.info('Learning goal retrieved successfully');
    handleSuccess(res, goal);
  } catch (error) {
    log.error(error, 'Error retrieving learning goal');
    handleError(res, error, log);
  }
}

// Update a learning goal
export async function updateLearningGoal(req, res) {
  const log = req.log.child({ goalId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const goal = await LearningGoalService.updateGoal(id, userId, updateData);
    log.info('Learning goal updated successfully');
    handleSuccess(res, goal);
  } catch (error) {
    log.error(error, 'Error updating learning goal');
    handleError(res, error, log);
  }
}

// Delete a learning goal
export async function deleteLearningGoal(req, res) {
  const log = req.log.child({ goalId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await LearningGoalService.deleteGoal(id, userId);
    log.info('Learning goal deleted successfully');
    handleSuccess(res, result);
  } catch (error) {
    log.error(error, 'Error deleting learning goal');
    handleError(res, error, log);
  }
}

// Add action step to a goal
export async function addActionStep(req, res) {
  const log = req.log.child({ goalId: req.params.id, userId: req.user.id });
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { step, dueDate, resources } = req.body;

    const goal = await LearningGoalService.addActionStep(id, userId, {
      step,
      dueDate,
      resources
    });
    log.info('Action step added successfully');
    handleSuccess(res, goal);
  } catch (error) {
    log.error(error, 'Error adding action step');
    handleError(res, error, log);
  }
}

// Complete an action step
export async function completeActionStep(req, res) {
  const log = req.log.child({ goalId: req.params.id, userId: req.user.id, stepIndex: req.params.stepIndex });
  try {
    const { id, stepIndex } = req.params;
    const userId = req.user.id;

    const goal = await LearningGoalService.completeActionStep(id, userId, parseInt(stepIndex));
    log.info('Action step completed successfully');
    handleSuccess(res, goal);
  } catch (error) {
    log.error(error, 'Error completing action step');
    handleError(res, error, log);
  }
}

// Generate SMART goals based on performance
export async function generateSmartGoals(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { performanceData } = req.body;

    const goals = await LearningGoalService.generateSmartGoals(userId, performanceData);
    log.info({ count: goals.length }, 'SMART goals generated successfully');
    handleSuccess(res, goals);
  } catch (error) {
    log.error(error, 'Error generating SMART goals');
    handleError(res, error, log);
  }
}

// Get goal progress statistics
export async function getGoalProgressStats(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const stats = await LearningGoalService.getGoalProgressStats(userId);
    log.info('Goal progress statistics retrieved successfully');
    handleSuccess(res, stats);
  } catch (error) {
    log.error(error, 'Error retrieving goal progress statistics');
    handleError(res, error, log);
  }
}

// Get overdue goals
export async function getOverdueGoals(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const goals = await LearningGoalService.getOverdueGoals(userId);
    log.info({ count: goals.length }, 'Overdue goals retrieved successfully');
    handleSuccess(res, goals);
  } catch (error) {
    log.error(error, 'Error retrieving overdue goals');
    handleError(res, error, log);
  }
}

// Get goals due soon
export async function getGoalsDueSoon(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const goals = await LearningGoalService.getGoalsDueSoon(userId);
    log.info({ count: goals.length }, 'Goals due soon retrieved successfully');
    handleSuccess(res, goals);
  } catch (error) {
    log.error(error, 'Error retrieving goals due soon');
    handleError(res, error, log);
  }
}