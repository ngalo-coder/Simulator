import express from 'express';
import caseTemplateService from '../services/CaseTemplateService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/case-templates:
 *   get:
 *     summary: Get all available case templates
 *     description: Retrieve all available case templates organized by medical discipline. Accessible to all authenticated users.
 *     tags: [Case Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of all case templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CaseTemplate'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', async (req, res) => {
  try {
    const templates = caseTemplateService.getAllTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve templates'
    });
  }
});

/**
 * @swagger
 * /api/case-templates/{discipline}:
 *   get:
 *     summary: Get template for specific discipline
 *     description: Retrieve the case template for a specific medical discipline. Accessible to all authenticated users.
 *     tags: [Case Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discipline
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical discipline name (e.g., cardiology, neurology, pediatrics)
 *     responses:
 *       200:
 *         description: Successful retrieval of discipline template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CaseTemplate'
 *       404:
 *         description: Template not found for the specified discipline
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:discipline', async (req, res) => {
  try {
    const { discipline } = req.params;
    const template = caseTemplateService.getTemplate(discipline);
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Template not found'
    });
  }
});

/**
 * @swagger
 * /api/case-templates/{discipline}/fields:
 *   get:
 *     summary: Get template field structure for a discipline
 *     description: Retrieve the field structure and schema for a specific medical discipline template. Accessible to all authenticated users.
 *     tags: [Case Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discipline
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical discipline name
 *     responses:
 *       200:
 *         description: Successful retrieval of template fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     discipline:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TemplateField'
 *       404:
 *         description: Template not found for the specified discipline
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:discipline/fields', async (req, res) => {
  try {
    const { discipline } = req.params;
    const fields = caseTemplateService.getTemplateFields(discipline);
    
    res.json({
      success: true,
      data: {
        discipline,
        fields
      }
    });
  } catch (error) {
    console.error('Get template fields error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Template not found'
    });
  }
});

/**
 * @swagger
 * /api/case-templates/{discipline}/validate:
 *   post:
 *     summary: Validate case data against template
 *     description: Validate case data against the template schema for a specific discipline. Requires educator or admin role.
 *     tags: [Case Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discipline
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical discipline name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Case'
 *     responses:
 *       200:
 *         description: Validation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ValidationResult'
 *       400:
 *         description: Validation failed with errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Template not found for the specified discipline
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:discipline/validate', requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { discipline } = req.params;
    const caseData = req.body;
    
    const validation = caseTemplateService.validateCaseData(caseData, discipline);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Validate case data error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Validation failed'
    });
  }
});

/**
 * @swagger
 * /api/case-templates/{discipline}/create:
 *   post:
 *     summary: Create case from template
 *     description: Create a new case using a specific discipline template with custom data. Requires educator or admin role.
 *     tags: [Case Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discipline
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical discipline name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Custom data for the case creation
 *     responses:
 *       201:
 *         description: Case created from template successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Case created from template successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Template not found for the specified discipline
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:discipline/create', requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { discipline } = req.params;
    const customData = req.body;
    
    const caseData = caseTemplateService.createCaseFromTemplate(discipline, customData, req.user);
    
    res.status(201).json({
      success: true,
      message: 'Case created from template successfully',
      data: caseData
    });
  } catch (error) {
    console.error('Create case from template error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create case from template'
    });
  }
});

/**
 * @swagger
 * /api/case-templates/admin/statistics:
 *   get:
 *     summary: Get template usage statistics
 *     description: Retrieve statistics about template usage across the system. Requires admin role.
 *     tags: [Case Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of template statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TemplateStatistics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/admin/statistics', requireAnyRole(['admin']), async (req, res) => {
  try {
    const statistics = caseTemplateService.getTemplateStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get template statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve statistics'
    });
  }
});

export default router;