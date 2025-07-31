// ai-patient-sim-core-services/simulation-service/src/routes/templateCaseManagement.js
const express = require('express');
const TemplateCaseService = require('../services/templateCaseService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const templateCaseService = new TemplateCaseService();

/**
 * Get case statistics (admin only)
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (you can modify this based on your auth system)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await templateCaseService.getCaseStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('❌ Error getting case statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get case statistics'
    });
  }
});

/**
 * Create a new template case (admin only)
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const caseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const newCase = await templateCaseService.createCase(caseData);
    
    res.status(201).json({
      success: true,
      message: 'Template case created successfully',
      case: newCase
    });
  } catch (error) {
    console.error('❌ Error creating template case:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create template case'
    });
  }
});

/**
 * Update an existing template case (admin only)
 */
router.put('/:caseId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { caseId } = req.params;
    const updateData = req.body;

    const updatedCase = await templateCaseService.updateCase(caseId, updateData);
    
    res.json({
      success: true,
      message: 'Template case updated successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('❌ Error updating template case:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update template case'
    });
  }
});

/**
 * Delete a template case (admin only)
 */
router.delete('/:caseId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { caseId } = req.params;
    const result = await templateCaseService.deleteCase(caseId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Error deleting template case:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete template case'
    });
  }
});

/**
 * Get detailed case information (admin only)
 */
router.get('/:caseId/details', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { caseId } = req.params;
    const caseData = await templateCaseService.getCaseById(caseId);
    
    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    console.error('❌ Error getting case details:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Case not found'
    });
  }
});

/**
 * Bulk import cases from JSON (admin only)
 */
router.post('/bulk-import', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { cases } = req.body;
    
    if (!Array.isArray(cases)) {
      return res.status(400).json({
        success: false,
        error: 'Cases must be an array'
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const caseData of cases) {
      try {
        await templateCaseService.createCase({
          ...caseData,
          createdBy: req.user.id
        });
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          caseId: caseData.caseId,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Bulk import completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('❌ Error in bulk import:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk import'
    });
  }
});

module.exports = router;