import express from 'express';
import educatorDashboardService from '../services/EducatorDashboardService.js';
import caseManagementService from '../services/CaseManagementService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rbacMiddleware from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply RBAC middleware to ensure only educators and admins can access
router.use(rbacMiddleware(['educator', 'admin']));

/**
 * @route GET /api/educator/dashboard
 * @desc Get educator dashboard overview
 * @access Private (Educator, Admin)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await educatorDashboardService.getDashboardOverview(req.user);
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get educator dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load dashboard'
    });
  }
});

/**
 * @route GET /api/educator/students
 * @desc Get assigned students with filtering and pagination
 * @access Private (Educator, Admin)
 */
router.get('/students', async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || 'profile.lastName',
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      discipline: req.query.discipline || '',
      status: req.query.status || 'all'
    };

    const studentsData = await educatorDashboardService.getAssignedStudents(req.user, options);
    
    res.json({
      success: true,
      data: studentsData
    });
  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load students'
    });
  }
});

/**
 * @route GET /api/educator/students/:studentId/progress
 * @desc Get detailed progress for a specific student
 * @access Private (Educator, Admin)
 */
router.get('/students/:studentId/progress', async (req, res) => {
  try {
    const { studentId } = req.params;
    const progress = await educatorDashboardService.getStudentProgress(studentId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load student progress'
    });
  }
});

/**
 * @route GET /api/educator/cases
 * @desc Get educator's cases with management interface data
 * @access Private (Educator, Admin)
 */
router.get('/cases', async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc',
      status: req.query.status || 'all',
      discipline: req.query.discipline || ''
    };

    const casesData = await educatorDashboardService.getCaseManagementData(req.user, options);
    
    res.json({
      success: true,
      data: casesData
    });
  } catch (error) {
    console.error('Get educator cases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load cases'
    });
  }
});

/**
 * @route POST /api/educator/cases
 * @desc Create a new case
 * @access Private (Educator, Admin)
 */
router.post('/cases', async (req, res) => {
  try {
    const caseData = req.body;
    const newCase = await caseManagementService.createCase(caseData, req.user);
    
    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: newCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create case'
    });
  }
});

/**
 * @route PUT /api/educator/cases/:caseId
 * @desc Update an existing case
 * @access Private (Educator, Admin)
 */
router.put('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const updateData = req.body;
    
    const updatedCase = await caseManagementService.updateCase(caseId, updateData, req.user);
    
    res.json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update case'
    });
  }
});

/**
 * @route DELETE /api/educator/cases/:caseId
 * @desc Delete (archive) a case
 * @access Private (Educator, Admin)
 */
router.delete('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    await caseManagementService.deleteCase(caseId, req.user);
    
    res.json({
      success: true,
      message: 'Case archived successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to archive case'
    });
  }
});

/**
 * @route POST /api/educator/cases/:caseId/submit-review
 * @desc Submit case for review
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/submit-review', async (req, res) => {
  try {
    const { caseId } = req.params;
    const updatedCase = await caseManagementService.submitForReview(caseId, req.user);
    
    res.json({
      success: true,
      message: 'Case submitted for review successfully',
      data: updatedCase
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
 * @route POST /api/educator/cases/:caseId/review
 * @desc Review and approve/reject a case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/review', async (req, res) => {
  try {
    const { caseId } = req.params;
    const reviewData = req.body;
    
    const updatedCase = await caseManagementService.reviewCase(caseId, reviewData, req.user);
    
    res.json({
      success: true,
      message: `Case ${reviewData.action}ed successfully`,
      data: updatedCase
    });
  } catch (error) {
    console.error('Review case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to review case'
    });
  }
});

/**
 * @route POST /api/educator/cases/:caseId/publish
 * @desc Publish an approved case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/publish', async (req, res) => {
  try {
    const { caseId } = req.params;
    const publishedCase = await caseManagementService.publishCase(caseId, req.user);
    
    res.json({
      success: true,
      message: 'Case published successfully',
      data: publishedCase
    });
  } catch (error) {
    console.error('Publish case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to publish case'
    });
  }
});

/**
 * @route GET /api/educator/cases/:caseId/analytics
 * @desc Get detailed analytics for a specific case
 * @access Private (Educator, Admin)
 */
router.get('/cases/:caseId/analytics', async (req, res) => {
  try {
    const { caseId } = req.params;
    const analytics = await educatorDashboardService.getCaseAnalytics(caseId, req.user);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get case analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load case analytics'
    });
  }
});

/**
 * @route POST /api/educator/cases/:caseId/collaborators
 * @desc Add collaborator to a case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/collaborators', async (req, res) => {
  try {
    const { caseId } = req.params;
    const collaboratorData = req.body;
    
    const updatedCase = await caseManagementService.addCollaborator(caseId, collaboratorData, req.user);
    
    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: updatedCase
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
 * @route DELETE /api/educator/cases/:caseId/collaborators/:collaboratorId
 * @desc Remove collaborator from a case
 * @access Private (Educator, Admin)
 */
router.delete('/cases/:caseId/collaborators/:collaboratorId', async (req, res) => {
  try {
    const { caseId, collaboratorId } = req.params;
    
    const updatedCase = await caseManagementService.removeCollaborator(caseId, collaboratorId, req.user);
    
    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove collaborator'
    });
  }
});

/**
 * @route GET /api/educator/analytics
 * @desc Get comprehensive analytics for educator
 * @access Private (Educator, Admin)
 */
router.get('/analytics', async (req, res) => {
  try {
    const [
      performanceMetrics,
      caseStatistics,
      studentStatistics
    ] = await Promise.all([
      educatorDashboardService.getPerformanceMetrics(req.user),
      educatorDashboardService.getCaseStatistics(req.user),
      educatorDashboardService.getStudentStatistics(req.user)
    ]);
    
    res.json({
      success: true,
      data: {
        performanceMetrics,
        caseStatistics,
        studentStatistics
      }
    });
  } catch (error) {
    console.error('Get educator analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load analytics'
    });
  }
});

/**
 * @route POST /api/educator/classes
 * @desc Create a new class/group
 * @access Private (Educator, Admin)
 */
router.post('/classes', async (req, res) => {
  try {
    const classData = req.body;
    const newClass = await educatorDashboardService.createClass(classData, req.user);
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create class'
    });
  }
});

/**
 * @route GET /api/educator/classes
 * @desc Get educator's classes
 * @access Private (Educator, Admin)
 */
router.get('/classes', async (req, res) => {
  try {
    const classes = await educatorDashboardService.getEducatorClasses(req.user);
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get educator classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load classes'
    });
  }
});

/**
 * @route GET /api/educator/statistics
 * @desc Get case statistics for educator
 * @access Private (Educator, Admin)
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await caseManagementService.getCaseStatistics(req.user);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get case statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load statistics'
    });
  }
});

export default router;