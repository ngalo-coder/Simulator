import express from 'express';
import caseCreationWorkflowService from '../services/CaseCreationWorkflowService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rbacMiddleware from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply RBAC middleware to ensure only educators and admins can access
router.use(rbacMiddleware(['educator', 'admin']));

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
 * @route PUT /api/case-workflow/drafts/:draftId/steps/:stepId
 * @desc Update workflow step
 * @access Private (Educator, Admin)
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

export default router;