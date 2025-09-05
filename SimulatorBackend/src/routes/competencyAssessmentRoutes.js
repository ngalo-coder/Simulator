import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import {
  getCompetencyAssessment,
  initializeCompetencyAssessment,
  updateCompetencyLevels,
  addAssessmentResult,
  addPortfolioItem,
  checkCertificationRequirements,
  syncExternalAssessment,
  generateCompetencyReport
} from '../controllers/competencyAssessmentController.js';

const router = express.Router();

// Get competency assessment for authenticated user
router.get('/competency-assessment', protect, getCompetencyAssessment);

// Initialize competency assessment
router.post('/competency-assessment/initialize', protect, initializeCompetencyAssessment);

// Update competency levels based on performance
router.patch('/competency-assessment/levels', protect, updateCompetencyLevels);

// Add assessment result
router.post('/competency-assessment/assessments', protect, addAssessmentResult);

// Add portfolio item
router.post('/competency-assessment/portfolio', protect, addPortfolioItem);

// Check certification requirements
router.get('/competency-assessment/certifications/:certificationId/check', protect, checkCertificationRequirements);

// Sync external assessment
router.post('/competency-assessment/external-sync', protect, syncExternalAssessment);

// Generate competency report
router.get('/competency-assessment/report', protect, generateCompetencyReport);

export default router;