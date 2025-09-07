import express from 'express';
import caseCreationWorkflowService from '../services/CaseCreationWorkflowService.js';
import Case from '../models/CaseModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply RBAC middleware to ensure only educators and admins can access
router.use(requireAnyRole(['educator', 'admin']));

/**
 * @route POST /api/case-workflow/initialize
 * @desc Initialize case creation workflow
 * @access Private (Educator, Admin)
 */
router.post('/initialize', async (req, res) => {
  try {
    const { discipline } = req.body;
    
    if (!discipline) {
      return res.status(400).json({
        success: false,
        message: 'Discipline is required'
      });
    }

    const workflowData = await caseCreationWorkflowService.initializeWorkflow(req.user, discipline);
    
    res.status(201).json({
      success: true,
      message: 'Workflow initialized successfully',
      data: workflowData
    });
  } catch (error) {
    console.error('Initialize workflow error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initialize workflow'
    });
  }
});

/**
 * @route GET /api/case-workflow/drafts
 * @desc Get user's case drafts
 * @access Private (Educator, Admin)
 */
router.get('/drafts', async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      status: req.query.status || 'all',
      discipline: req.query.discipline || 'all'
    };

    const draftsData = await caseCreationWorkflowService.getUserDrafts(req.user, options);
    
    res.json({
      success: true,
      data: draftsData
    });
  } catch (error) {
    console.error('Get user drafts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve drafts'
    });
  }
});

/**
 * @route GET /api/case-workflow/drafts/:draftId
 * @desc Get draft by ID
 * @access Private (Educator, Admin)
 */
router.get('/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const draftData = await caseCreationWorkflowService.getDraft(draftId, req.user);
    
    res.json({
      success: true,
      data: draftData
    });
  } catch (error) {
    console.error('Get draft error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Draft not found'
    });
  }
});

/**
 * @swagger
 * /api/case-workflow/drafts/{draftId}/steps/{stepId}:
 *   put:
 *     summary: Update workflow step
 *     description: Update content and metadata for a specific workflow step
 *     tags: [Case Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the draft
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the workflow step
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowStep'
 *     responses:
 *       200:
 *         description: Step updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StepValidationResult'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Draft or step not found
 *       500:
 *         description: Server error
 */
router.put('/drafts/:draftId/steps/:stepId', async (req, res) => {
  try {
    const { draftId, stepId } = req.params;
    const stepData = req.body;
    
    const result = await caseCreationWorkflowService.updateWorkflowStep(draftId, stepId, stepData, req.user);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
        warnings: result.warnings
      });
    }
    
    res.json({
      success: true,
      message: 'Workflow step updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update workflow step error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update workflow step'
    });
  }
});

/**
 * @route POST /api/case-workflow/drafts/:draftId/save
 * @desc Save draft
 * @access Private (Educator, Admin)
 */
router.post('/drafts/:draftId/save', async (req, res) => {
  try {
    const { draftId } = req.params;
    const caseData = req.body;
    
    const result = await caseCreationWorkflowService.saveDraft(draftId, caseData, req.user);
    
    res.json({
      success: true,
      message: 'Draft saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save draft'
    });
  }
});

/**
 * @route POST /api/case-workflow/drafts/:draftId/submit
 * @desc Submit case for review
 * @access Private (Educator, Admin)
 */
router.post('/drafts/:draftId/submit', async (req, res) => {
  try {
    const { draftId } = req.params;
    
    const result = await caseCreationWorkflowService.submitCaseForReview(draftId, req.user);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      data: {
        caseId: result.caseId,
        draftId: result.draftId
      }
    });
  } catch (error) {
    console.error('Submit case for review error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit case for review'
    });
  }
});

/**
 * @route POST /api/case-workflow/drafts/:draftId/collaborators
 * @desc Add collaborator to draft
 * @access Private (Educator, Admin)
 */
router.post('/drafts/:draftId/collaborators', async (req, res) => {
  try {
    const { draftId } = req.params;
    const collaboratorData = req.body;
    
    const result = await caseCreationWorkflowService.addCollaborator(draftId, collaboratorData, req.user);
    
    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: result
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add collaborator'
    });
  }
});

/**
 * @route DELETE /api/case-workflow/drafts/:draftId
 * @desc Delete draft
 * @access Private (Educator, Admin)
 */
router.delete('/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    
    await caseCreationWorkflowService.deleteDraft(draftId, req.user);
    
    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete draft'
    });
  }
});

/**
 * @route GET /api/case-workflow/terminology
 * @desc Get medical terminology suggestions
 * @access Private (Educator, Admin)
 */
router.get('/terminology', async (req, res) => {
  try {
    const { query = '', category = 'all' } = req.query;
    
    const suggestions = caseCreationWorkflowService.getTerminologySuggestions(query, category);
    
    res.json({
      success: true,
      data: {
        query,
        category,
        suggestions
      }
    });
  } catch (error) {
    console.error('Get terminology suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get terminology suggestions'
    });
  }
});

/**
 * @route GET /api/case-workflow/steps/:discipline
 * @desc Get workflow steps for discipline
 * @access Private (Educator, Admin)
 */
router.get('/steps/:discipline', async (req, res) => {
  try {
    const { discipline } = req.params;

    const steps = caseCreationWorkflowService.getWorkflowSteps(discipline);

    res.json({
      success: true,
      data: {
        discipline,
        steps
      }
    });
  } catch (error) {
    console.error('Get workflow steps error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get workflow steps'
    });
  }
});

/**
 * @route POST /api/case-workflow/cases/:caseId/duplicate
 * @desc Duplicate an existing case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/duplicate', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, description, includeMultimedia, createAsTemplate } = req.body;

    const options = {
      title,
      description,
      includeMultimedia: includeMultimedia || false,
      createAsTemplate: createAsTemplate || false
    };

    const duplicatedCase = await caseCreationWorkflowService.duplicateCase(caseId, req.user, options);

    res.status(201).json({
      success: true,
      message: 'Case duplicated successfully',
      data: duplicatedCase
    });
  } catch (error) {
    console.error('Duplicate case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to duplicate case'
    });
  }
});

/**
 * @route POST /api/case-workflow/cases/:caseId/create-template
 * @desc Create a template from an existing case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/create-template', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { name, description, tags, categories, isPublic } = req.body;

    const templateData = {
      name,
      description,
      tags: tags || [],
      categories: categories || [],
      isPublic: isPublic || false
    };

    const template = await caseCreationWorkflowService.createTemplateFromCase(caseId, templateData, req.user);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create template'
    });
  }
});

/**
 * @route GET /api/case-workflow/templates
 * @desc Get available case templates
 * @access Private (Educator, Admin)
 */
router.get('/templates', async (req, res) => {
  try {
    const { discipline, specialty, difficulty, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (discipline) filters.discipline = discipline;
    if (specialty) filters.specialty = specialty;
    if (difficulty) filters.difficulty = difficulty;

    // For now, get cases marked as templates
    const templates = await Case.find({
      isTemplate: true,
      ...filters
    })
    .populate('createdBy', 'username profile.firstName profile.lastName')
    .populate('categories')
    .sort({ usageCount: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

    const total = await Case.countDocuments({
      isTemplate: true,
      ...filters
    });

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve templates'
    });
  }
});

/**
 * @swagger
 * /api/case-workflow/templates/{templateId}/use:
 *   post:
 *     summary: Use case template
 *     description: Create a new case from a template
 *     tags: [Case Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of template to use
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title for new case
 *               description:
 *                 type: string
 *                 description: Description for new case
 *     responses:
 *       201:
 *         description: Case created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Case'
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.post('/templates/:templateId/use', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { title, description } = req.body;

    const template = await Case.findById(templateId);
    if (!template || !template.isTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Create new case from template
    const caseData = {
      version: 1,
      description: description || template.description,
      system_instruction: template.system_instruction,
      case_metadata: {
        ...template.case_metadata.toObject(),
        case_id: await caseCreationWorkflowService.generateCaseId(template.case_metadata.specialty || 'general'),
        title: title || `${template.case_metadata.title} (from template)`
      },
      patient_persona: template.patient_persona,
      initial_prompt: template.initial_prompt,
      clinical_dossier: template.clinical_dossier,
      simulation_triggers: template.simulation_triggers,
      evaluation_criteria: template.evaluation_criteria,
      multimediaContent: template.multimediaContent || [],
      categories: template.categories || [],
      tags: template.tags || [],
      templateSource: templateId,
      status: 'draft',
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    const newCase = new Case(caseData);
    await newCase.save();

    // Increment template usage count
    await Case.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Case created from template successfully',
      data: newCase
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create case from template'
    });
  }
});

export default router;