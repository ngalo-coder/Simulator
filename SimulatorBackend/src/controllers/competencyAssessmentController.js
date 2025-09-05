import CompetencyAssessmentService from '../services/CompetencyAssessmentService.js';
import { handleSuccess, handleError } from '../utils/responseHandler.js';
import logger from '../config/logger.js';

// Get competency assessment for a user
export async function getCompetencyAssessment(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const assessment = await CompetencyAssessmentService.getUserAssessment(userId);
    log.info('Competency assessment retrieved successfully');
    handleSuccess(res, assessment);
  } catch (error) {
    log.error(error, 'Error retrieving competency assessment');
    handleError(res, error, log);
  }
}

// Initialize competency assessment for a user
export async function initializeCompetencyAssessment(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const assessment = await CompetencyAssessmentService.initializeUserAssessment(userId);
    log.info({ assessmentId: assessment._id }, 'Competency assessment initialized successfully');
    handleSuccess(res, assessment, 201);
  } catch (error) {
    log.error(error, 'Error initializing competency assessment');
    handleError(res, error, log);
  }
}

// Update competency levels based on performance
export async function updateCompetencyLevels(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { performanceData } = req.body;

    const assessment = await CompetencyAssessmentService.updateCompetencyLevels(userId, performanceData);
    log.info('Competency levels updated successfully');
    handleSuccess(res, assessment);
  } catch (error) {
    log.error(error, 'Error updating competency levels');
    handleError(res, error, log);
  }
}

// Add assessment result
export async function addAssessmentResult(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const assessmentData = req.body;

    const assessment = await CompetencyAssessmentService.addAssessmentResult(userId, assessmentData);
    log.info('Assessment result added successfully');
    handleSuccess(res, assessment);
  } catch (error) {
    log.error(error, 'Error adding assessment result');
    handleError(res, error, log);
  }
}

// Add portfolio item
export async function addPortfolioItem(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const portfolioData = req.body;

    const assessment = await CompetencyAssessmentService.addPortfolioItem(userId, portfolioData);
    log.info('Portfolio item added successfully');
    handleSuccess(res, assessment);
  } catch (error) {
    log.error(error, 'Error adding portfolio item');
    handleError(res, error, log);
  }
}

// Check certification requirements
export async function checkCertificationRequirements(req, res) {
  const log = req.log.child({ userId: req.user.id, certificationId: req.params.certificationId });
  try {
    const userId = req.user.id;
    const { certificationId } = req.params;

    const certification = await CompetencyAssessmentService.checkCertificationRequirements(userId, certificationId);
    log.info('Certification requirements checked successfully');
    handleSuccess(res, certification);
  } catch (error) {
    log.error(error, 'Error checking certification requirements');
    handleError(res, error, log);
  }
}

// Sync external assessment
export async function syncExternalAssessment(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const externalData = req.body;

    const assessment = await CompetencyAssessmentService.syncExternalAssessment(userId, externalData);
    log.info('External assessment synced successfully');
    handleSuccess(res, assessment);
  } catch (error) {
    log.error(error, 'Error syncing external assessment');
    handleError(res, error, log);
  }
}

// Generate competency report
export async function generateCompetencyReport(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;

    const report = await CompetencyAssessmentService.generateCompetencyReport(userId);
    log.info('Competency report generated successfully');
    handleSuccess(res, report);
  } catch (error) {
    log.error(error, 'Error generating competency report');
    handleError(res, error, log);
  }
}