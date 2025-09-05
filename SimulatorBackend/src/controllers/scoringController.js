import ScoringService from '../services/ScoringService.js';
import { handleSuccess, handleError } from '../utils/responseHandler.js';
import logger from '../config/logger.js';

// Initialize default rubrics for a user (admin only)
export async function initializeDefaultRubrics(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const rubrics = await ScoringService.initializeDefaultRubrics(userId);
    log.info('Default rubrics initialized successfully');
    handleSuccess(res, rubrics, 201);
  } catch (error) {
    log.error(error, 'Error initializing default rubrics');
    handleError(res, error, log);
  }
}

// Score a session using the appropriate rubric
export async function scoreSession(req, res) {
  const log = req.log.child({ userId: req.user.id, sessionId: req.params.sessionId });
  try {
    const { sessionId } = req.params;
    const { rubricId, evaluatorId } = req.body;

    const scoringResult = await ScoringService.scoreSession(sessionId, rubricId, evaluatorId);
    log.info({ scoringResult }, 'Session scored successfully');
    handleSuccess(res, scoringResult);
  } catch (error) {
    log.error(error, 'Error scoring session');
    handleError(res, error, log);
  }
}

// Get scoring analytics for a specific rubric
export async function getScoringAnalytics(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const { rubricId } = req.params;
    const { timeframe } = req.query;

    const analytics = await ScoringService.getScoringAnalytics(rubricId, timeframe);
    log.info('Scoring analytics retrieved successfully');
    handleSuccess(res, analytics);
  } catch (error) {
    log.error(error, 'Error retrieving scoring analytics');
    handleError(res, error, log);
  }
}

// Get all active rubrics for a discipline
export async function getActiveRubrics(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const { discipline, specialty } = req.query;

    const rubrics = await ScoringService.getActiveRubrics(discipline, specialty);
    log.info('Active rubrics retrieved successfully');
    handleSuccess(res, rubrics);
  } catch (error) {
    log.error(error, 'Error retrieving active rubrics');
    handleError(res, error, log);
  }
}

// Get rubric by ID
export async function getRubricById(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const { rubricId } = req.params;

    const rubric = await ScoringService.getRubricById(rubricId);
    log.info('Rubric retrieved successfully');
    handleSuccess(res, rubric);
  } catch (error) {
    log.error(error, 'Error retrieving rubric');
    handleError(res, error, log);
  }
}

// Create a new scoring rubric
export async function createScoringRubric(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const rubricData = req.body;
    rubricData.createdBy = req.user.id;

    const rubric = await ScoringService.createScoringRubric(rubricData);
    log.info({ rubricId: rubric.rubricId }, 'Scoring rubric created successfully');
    handleSuccess(res, rubric, 201);
  } catch (error) {
    log.error(error, 'Error creating scoring rubric');
    handleError(res, error, log);
  }
}

// Update an existing scoring rubric
export async function updateScoringRubric(req, res) {
  const log = req.log.child({ userId: req.user.id, rubricId: req.params.rubricId });
  try {
    const { rubricId } = req.params;
    const updateData = req.body;
    updateData.lastUpdatedBy = req.user.id;

    const rubric = await ScoringService.updateScoringRubric(rubricId, updateData);
    log.info('Scoring rubric updated successfully');
    handleSuccess(res, rubric);
  } catch (error) {
    log.error(error, 'Error updating scoring rubric');
    handleError(res, error, log);
  }
}

// Delete a scoring rubric
export async function deleteScoringRubric(req, res) {
  const log = req.log.child({ userId: req.user.id, rubricId: req.params.rubricId });
  try {
    const { rubricId } = req.params;

    await ScoringService.deleteScoringRubric(rubricId);
    log.info('Scoring rubric deleted successfully');
    handleSuccess(res, { message: 'Rubric deleted successfully' });
  } catch (error) {
    log.error(error, 'Error deleting scoring rubric');
    handleError(res, error, log);
  }
}