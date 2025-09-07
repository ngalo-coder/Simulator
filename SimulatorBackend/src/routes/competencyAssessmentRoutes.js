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

/**
 * @swagger
 * /api/competency-assessment:
 *   get:
 *     summary: Get competency assessment for authenticated user
 *     description: Retrieve the current competency assessment data for the authenticated user, including competency levels, assessment history, and portfolio items.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of competency assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CompetencyAssessment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/competency-assessment', protect, getCompetencyAssessment);

/**
 * @swagger
 * /api/competency-assessment/initialize:
 *   post:
 *     summary: Initialize competency assessment
 *     description: Initialize a new competency assessment profile for the authenticated user, typically called when a user first starts using the system.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Competency assessment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CompetencyAssessment'
 *       400:
 *         description: Assessment already exists or invalid initialization data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/competedy-assessment/initialize', protect, initializeCompetencyAssessment);

/**
 * @swagger
 * /api/competency-assessment/levels:
 *   patch:
 *     summary: Update competency levels based on performance
 *     description: Update user competency levels based on recent performance data from simulations, assessments, or other learning activities.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - competencyUpdates
 *             properties:
 *               competencyUpdates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CompetencyUpdate'
 *                 description: Array of competency level updates
 *               performanceData:
 *                 type: object
 *                 description: Performance data supporting the competency updates
 *     responses:
 *       200:
 *         description: Competency levels updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CompetencyAssessment'
 *       400:
 *         description: Invalid competency update data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/competency-assessment/levels', protect, updateCompetencyLevels);

/**
 * @swagger
 * /api/competency-assessment/assessments:
 *   post:
 *     summary: Add assessment result
 *     description: Add a new assessment result to the user's competency profile, including test scores, simulation results, or external assessment data.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assessmentType
 *               - score
 *             properties:
 *               assessmentType:
 *                 type: string
 *                 description: Type of assessment (e.g., simulation, written_test, practical_exam)
 *               score:
 *                 type: number
 *                 description: Assessment score or result
 *               maxScore:
 *                 type: number
 *                 description: Maximum possible score for the assessment
 *               competencyAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Competency areas assessed
 *               feedback:
 *                 type: string
 *                 description: Assessment feedback or comments
 *               assessmentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of assessment
 *     responses:
 *       201:
 *         description: Assessment result added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentResult'
 *       400:
 *         description: Invalid assessment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/competency-assessment/assessments', protect, addAssessmentResult);

/**
 * @swagger
 * /api/competency-assessment/portfolio:
 *   post:
 *     summary: Add portfolio item
 *     description: Add a portfolio item to the user's competency assessment, such as case studies, projects, or other evidence of competency.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemType
 *               - title
 *             properties:
 *               itemType:
 *                 type: string
 *                 description: Type of portfolio item (e.g., case_study, project, presentation)
 *               title:
 *                 type: string
 *                 description: Title of the portfolio item
 *               description:
 *                 type: string
 *                 description: Detailed description of the item
 *               competencies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Competency areas demonstrated by this item
 *               evidenceUrl:
 *                 type: string
 *                 description: URL or reference to supporting evidence
 *               completionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date when the item was completed
 *     responses:
 *       201:
 *         description: Portfolio item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PortfolioItem'
 *       400:
 *         description: Invalid portfolio item data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/competency-assessment/portfolio', protect, addPortfolioItem);

/**
 * @swagger
 * /api/competency-assessment/certifications/{certificationId}/check:
 *   get:
 *     summary: Check certification requirements
 *     description: Check if the user meets the requirements for a specific certification based on their current competency assessment.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the certification to check requirements for
 *     responses:
 *       200:
 *         description: Certification requirements check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CertificationCheck'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Certification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/competency-assessment/certifications/:certificationId/check', protect, checkCertificationRequirements);

/**
 * @swagger
 * /api/competency-assessment/external-sync:
 *   post:
 *     summary: Sync external assessment
 *     description: Synchronize assessment data from external systems or platforms with the user's competency profile.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - externalSystem
 *               - assessmentData
 *             properties:
 *               externalSystem:
 *                 type: string
 *                 description: Name of the external system (e.g., lms, assessment_platform)
 *               assessmentData:
 *                 type: object
 *                 description: Assessment data from the external system
 *               syncDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of synchronization
 *     responses:
 *       200:
 *         description: External assessment synchronized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExternalSyncResult'
 *       400:
 *         description: Invalid external assessment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/competency-assessment/external-sync', protect, syncExternalAssessment);

/**
 * @swagger
 * /api/competency-assessment/report:
 *   get:
 *     summary: Generate competency report
 *     description: Generate a comprehensive competency report for the user, including assessment history, competency levels, portfolio items, and certification status.
 *     tags: [Competency Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Competency report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CompetencyReport'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/competency-assessment/report', protect, generateCompetencyReport);

export default router;