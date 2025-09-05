import express from 'express';
import FeedbackService from '../services/FeedbackService.js';
import { protect as requireAuth } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication to all feedback routes
router.use(requireAuth);

/**
 * @route POST /api/feedback/submit
 * @desc Submit student feedback
 * @access Private (Student, Admin, Educator)
 */
router.post('/submit', requireAnyRole(['student', 'admin', 'educator']), async (req, res) => {
  try {
    const {
      caseId,
      feedbackType,
      rating,
      comments,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!feedbackType || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Feedback type and rating are required'
      });
    }

    const feedbackData = {
      userId: req.user.id,
      caseId: caseId || null,
      feedbackType,
      rating: parseInt(rating),
      comments: comments || '',
      metadata: {
        ...metadata,
        userAgent: req.headers['user-agent'],
        pageUrl: metadata.pageUrl || req.headers.referer
      }
    };

    const feedback = await FeedbackService.submitFeedback(feedbackData);
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback'
    });
  }
});

/**
 * @route GET /api/feedback/analytics
 * @desc Get feedback analytics
 * @access Private (Admin, Educator)
 */
router.get('/analytics', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const {
      timeRange = '30d',
      feedbackType,
      caseId,
      specialty,
      sentiment
    } = req.query;

    const filters = {
      timeRange,
      feedbackType: feedbackType || undefined,
      caseId: caseId || undefined,
      specialty: specialty || undefined,
      sentiment: sentiment || undefined
    };

    const analytics = await FeedbackService.getFeedbackAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get feedback analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback analytics'
    });
  }
});

/**
 * @route GET /api/feedback/case/:caseId
 * @desc Get feedback for a specific case
 * @access Private (Admin, Educator)
 */
router.get('/case/:caseId', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const feedback = await FeedbackService.getCaseFeedback(caseId);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Get case feedback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch case feedback'
    });
  }
});

/**
 * @route GET /api/feedback/user/history
 * @desc Get user's feedback history
 * @access Private (Student, Admin, Educator)
 */
router.get('/user/history', requireAnyRole(['student', 'admin', 'educator']), async (req, res) => {
  try {
    const history = await FeedbackService.getUserFeedbackHistory(req.user.id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get user feedback history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback history'
    });
  }
});

/**
 * @route GET /api/feedback/trends
 * @desc Analyze feedback trends over time
 * @access Private (Admin, Educator)
 */
router.get('/trends', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const { timeRange = '90d' } = req.query;
    
    const trends = await FeedbackService.analyzeFeedbackTrends(timeRange);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Analyze feedback trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze feedback trends'
    });
  }
});

/**
 * @route GET /api/feedback/export
 * @desc Export feedback data for reporting
 * @access Private (Admin)
 */
router.get('/export', requireAnyRole(['admin']), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      feedbackType
    } = req.query;

    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      feedbackType: feedbackType || undefined
    };

    const exportData = await FeedbackService.exportFeedbackData(filters);
    
    res.json({
      success: true,
      data: exportData,
      total: exportData.length
    });
  } catch (error) {
    console.error('Export feedback data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export feedback data'
    });
  }
});

/**
 * @route GET /api/feedback/types
 * @desc Get available feedback types
 * @access Private (Student, Admin, Educator)
 */
router.get('/types', requireAnyRole(['student', 'admin', 'educator']), async (req, res) => {
  try {
    const feedbackTypes = {
      CASE_QUALITY: {
        value: 'case_quality',
        label: 'Case Quality',
        description: 'Feedback about the quality and content of a specific case'
      },
      SYSTEM_USABILITY: {
        value: 'system_usability',
        label: 'System Usability',
        description: 'Feedback about the usability and interface of the system'
      },
      EDUCATIONAL_VALUE: {
        value: 'educational_value',
        label: 'Educational Value',
        description: 'Feedback about the educational value and learning experience'
      },
      TECHNICAL_ISSUES: {
        value: 'technical_issues',
        label: 'Technical Issues',
        description: 'Report technical problems or bugs encountered'
      },
      GENERAL_FEEDBACK: {
        value: 'general_feedback',
        label: 'General Feedback',
        description: 'General comments or suggestions about the platform'
      }
    };

    res.json({
      success: true,
      data: feedbackTypes
    });
  } catch (error) {
    console.error('Get feedback types error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback types'
    });
  }
});

export default router;