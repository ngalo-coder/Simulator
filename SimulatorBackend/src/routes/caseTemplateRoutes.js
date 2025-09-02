import express from 'express';
import caseTemplateService from '../services/CaseTemplateService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rbacMiddleware from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/case-templates
 * @desc Get all available case templates
 * @access Private (All authenticated users)
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
 * @route GET /api/case-templates/:discipline
 * @desc Get template for specific discipline
 * @access Private (All authenticated users)
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
 * @route GET /api/case-templates/:discipline/fields
 * @desc Get template field structure for a discipline
 * @access Private (All authenticated users)
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
 * @route POST /api/case-templates/:discipline/validate
 * @desc Validate case data against template
 * @access Private (Educator, Admin)
 */
router.post('/:discipline/validate', rbacMiddleware(['educator', 'admin']), async (req, res) => {
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
 * @route POST /api/case-templates/:discipline/create
 * @desc Create case from template
 * @access Private (Educator, Admin)
 */
router.post('/:discipline/create', rbacMiddleware(['educator', 'admin']), async (req, res) => {
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
 * @route GET /api/case-templates/statistics
 * @desc Get template usage statistics
 * @access Private (Admin)
 */
router.get('/admin/statistics', rbacMiddleware(['admin']), async (req, res) => {
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