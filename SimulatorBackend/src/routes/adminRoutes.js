import express from 'express';
import User from '../models/UserModel.js';
import Case from '../models/CaseModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import ClinicianProgress from '../models/ClinicianProgressModel.js';
import caseTemplateService from '../services/CaseTemplateService.js';
import caseManagementService from '../services/CaseManagementService.js';
import { protect, isAdmin } from '../middleware/jwtAuthMiddleware.js';
import AnalyticsService from '../services/AnalyticsService.js';

const router = express.Router();

// Note: Contribution-related endpoints have been moved to adminContributionRoutes.js

// Get system statistics
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    // ... existing stats code ...
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Get real-time statistics (lightweight)
router.get('/stats/realtime', protect, isAdmin, async (req, res) => {
  try {
    // ... existing realtime stats code ...
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    res.status(500).json({ error: 'Failed to fetch real-time statistics' });
  }
});

// Get all users
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    // ... existing users code ...
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all cases for admin
router.get('/cases', protect, isAdmin, async (req, res) => {
  try {
    // ... existing cases code ...
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Delete user
router.delete('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    // ... existing delete user code ...
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Delete case
router.delete('/cases/:caseId', protect, isAdmin, async (req, res) => {
  try {
    // ... existing delete case code ...
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Create admin user
router.post('/users/admin', protect, isAdmin, async (req, res) => {
  try {
    // ... existing create admin user code ...
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update user role
router.put('/users/:userId/role', protect, isAdmin, async (req, res) => {
  try {
    // ... existing update user role code ...
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Update case metadata
router.put('/cases/:caseId', protect, isAdmin, async (req, res) => {
  try {
    // ... existing update case code ...
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// Get users with performance scores
router.get('/users/scores', protect, isAdmin, async (req, res) => {
  try {
    // ... existing users scores code ...
  } catch (error) {
    console.error('Error fetching users with scores:', error);
    res.status(500).json({ error: 'Failed to fetch users with scores' });
  }
});

// Get aggregated analytics for the admin dashboard
router.get('/analytics', protect, isAdmin, async (req, res) => {
  try {
    const [
      caseUsage,
      performanceTrends,
      effectivenessMetrics
    ] = await Promise.all([
      AnalyticsService.getCaseUsageAnalytics(),
      AnalyticsService.getPerformanceTrends(),
      AnalyticsService.getCaseEffectivenessMetrics()
    ]);

    const userEngagement = performanceTrends.map(trend => ({
      name: trend._id.date,
      value: trend.sessionCount,
    }));

    const casePopularity = caseUsage.usage.map(specialty => ({
        name: specialty._id.specialty,
        value: specialty.count
    }));

    const performanceMetrics = {
        avgScore: effectivenessMetrics[0]?.averageScore || 0,
        avgTime: `${(effectivenessMetrics[0]?.avgCompletionTime / 60000).toFixed(2) || 0}min`,
        completionRate: `${((effectivenessMetrics[0]?.totalSessions / caseUsage.usage.reduce((acc, curr) => acc + curr.count, 0)) * 100).toFixed(2) || 0}%`,
    }

    res.json({
        userEngagement,
        casePopularity,
        performanceMetrics
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

// ==================== ADMIN CASE CREATION ENDPOINTS ====================

// Get available case templates
router.get('/cases/templates', protect, isAdmin, async (req, res) => {
  try {
    const templates = caseTemplateService.getAllTemplates();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching case templates:', error);
    res.status(500).json({ error: 'Failed to fetch case templates' });
  }
});

// Create a new case
router.post('/cases/create', protect, isAdmin, async (req, res) => {
  try {
    // ... case creation code ...
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create case'
    });
  }
});

// Edit an existing case
router.put('/cases/:caseId/edit', protect, isAdmin, async (req, res) => {
  try {
    // ... case edit code ...
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update case'
    });
  }
});

// Publish a case
router.post('/cases/:caseId/publish', protect, isAdmin, async (req, res) => {
  try {
    // ... case publish code ...
  } catch (error) {
    console.error('Error publishing case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish case'
    });
  }
});

export default router;