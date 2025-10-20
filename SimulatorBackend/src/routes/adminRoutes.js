import express from 'express';
import User from '../models/UserModel.js';
import Case from '../models/CaseModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import ClinicianProgress from '../models/ClinicianProgressModel.js';
import caseTemplateService from '../services/CaseTemplateService.js';
import caseManagementService from '../services/CaseManagementService.js';
import { protect, isAdmin } from '../middleware/jwtAuthMiddleware.js';
import AnalyticsService from '../services/AnalyticsService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Note: Contribution-related endpoints have been moved to adminContributionRoutes.js

// Get system statistics
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    // Get total counts
    const [
      totalUsers,
      totalCases,
      totalCompletedSessions,
      totalActiveSessions
    ] = await Promise.all([
      User.countDocuments(),
      Case.countDocuments(),
      PerformanceMetrics.countDocuments({ status: 'completed' }),
      ClinicianProgress.countDocuments({ status: 'active' })
    ]);

    // Get recent activity
    const recentActivity = await ClinicianProgress.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('userId', 'username')
      .populate('lastCompletedBeginnerCase', 'case_metadata.title')
      .populate('lastCompletedIntermediateCase', 'case_metadata.title')
      .populate('lastCompletedAdvancedCase', 'case_metadata.title')
      .lean();

    // Get performance metrics
    const performanceStats = await PerformanceMetrics.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          totalTime: { $avg: '$completionTime' },
          completionRate: {
            $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Format the response
    const stats = {
      totalUsers,
      totalCases,
      totalCompletedSessions,
      totalActiveSessions,
      recentActivity: recentActivity.map(activity => ({
        id: activity._id,
        username: activity.userId?.username || 'Unknown User',
        caseTitle: activity.lastCompletedBeginnerCase?.case_metadata?.title ||
                  activity.lastCompletedIntermediateCase?.case_metadata?.title ||
                  activity.lastCompletedAdvancedCase?.case_metadata?.title ||
                  'Unknown Case',
        status: activity.status,
        lastUpdated: activity.updatedAt
      })),
      performance: {
        averageScore: performanceStats[0]?.avgScore?.toFixed(2) || 0,
        averageCompletionTime: (performanceStats[0]?.totalTime / 60000)?.toFixed(2) || 0, // Convert to minutes
        completionRate: (performanceStats[0]?.completionRate * 100)?.toFixed(2) || 0
      }
    };

    res.json(stats);
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Build query filters
    const query = {};
    if (req.query.role) query.primaryRole = req.query.role;
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.discipline) query.discipline = req.query.discipline;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';

    // Get users with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean();

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        total: totalUsers,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all cases for admin
router.get('/cases', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const cases = await Case.find()
      .sort({ 'case_metadata.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCases = await Case.countDocuments();

    res.json({
      cases,
      totalPages: Math.ceil(totalCases / limit),
      currentPage: page,
      totalCases,
    });
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

// Get user statistics
router.get('/users/statistics', protect, isAdmin, async (req, res) => {
  try {
    // Get user counts by different criteria
    const [
      total,
      active,
      inactive,
      students,
      educators,
      admins,
      verified,
      unverified
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ primaryRole: 'student' }),
      User.countDocuments({ primaryRole: 'educator' }),
      User.countDocuments({ primaryRole: 'admin' }),
      User.countDocuments({ emailVerified: true }),
      User.countDocuments({ emailVerified: false })
    ]);

    const statistics = {
      total,
      active,
      inactive,
      students,
      educators,
      admins,
      verified,
      unverified
    };

    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
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

// ==================== SPECIALTY VISIBILITY MANAGEMENT ====================

// Import Specialty model
import Specialty from '../models/SpecialtyModel.js';

// Get specialty visibility settings
router.get('/specialties/visibility', protect, isAdmin, async (req, res) => {
  try {
    const specialties = await Specialty.find({}).select('name isVisible programArea lastModified modifiedBy');
    const visibilitySettings = {
      specialties: specialties.map(specialty => ({
        specialtyId: specialty.name.toLowerCase().replace(/\s+/g, '_'),
        isVisible: specialty.isVisible,
        programArea: specialty.programArea,
        lastModified: specialty.lastModified,
        modifiedBy: specialty.modifiedBy
      }))
    };

    res.json({
      success: true,
      data: visibilitySettings
    });
  } catch (error) {
    console.error('Error fetching specialty visibility settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch specialty visibility settings'
    });
  }
});

// Development-only public visibility endpoint (for debugging local dev)
// Public visibility endpoint - returns minimal, non-sensitive visibility settings to clients.
// This endpoint is read-only and intentionally bypasses admin checks because visibility is
// not sensitive data but rather global display configuration. Admin updates will invalidate
// the in-memory cache so clients receive fresh data.
let _specialtyVisibilityCache = null;
let _specialtyVisibilityCacheTs = 0;
const VIS_CACHE_TTL = 30 * 1000; // 30 seconds

router.get('/specialties/visibility-public', async (req, res) => {
  try {
    const now = Date.now();
    if (_specialtyVisibilityCache && now - _specialtyVisibilityCacheTs < VIS_CACHE_TTL) {
      return res.json({ success: true, data: _specialtyVisibilityCache });
    }

    const specialties = await Specialty.find({}).select('name isVisible programArea lastModified modifiedBy');
    const visibilitySettings = {
      specialties: specialties.map(specialty => ({
        specialtyId: specialty.name.toLowerCase().replace(/\s+/g, '_'),
        isVisible: specialty.isVisible,
        programArea: specialty.programArea,
        lastModified: specialty.lastModified,
        modifiedBy: specialty.modifiedBy
      }))
    };

    _specialtyVisibilityCache = visibilitySettings;
    _specialtyVisibilityCacheTs = now;

    res.json({ success: true, data: visibilitySettings });
  } catch (error) {
    console.error('Error fetching public specialty visibility:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch specialty visibility' });
  }
});

// Public program areas counts endpoint (no authentication required)
router.get('/programs/program-areas/counts-public', async (req, res) => {
  try {
    // Import Case model
    const Case = (await import('../models/CaseModel.js')).default;

    // Aggregate cases by program area
    const programAreaCounts = await Case.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$case_metadata.program_area',
          casesCount: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const programAreas = programAreaCounts.map(item => ({
      name: item._id || 'Basic Program',
      casesCount: item.casesCount
    }));

    // Ensure both program areas are included even if they have no cases
    const programAreaMap = {
      'Basic Program': 0,
      'Specialty Program': 0
    };

    // Update counts from database
    programAreas.forEach(pa => {
      if (pa.name in programAreaMap) {
        programAreaMap[pa.name] = pa.casesCount;
      }
    });

    // Convert back to array format
    const result = Object.keys(programAreaMap).map(name => ({
      name,
      casesCount: programAreaMap[name]
    }));

    res.json({
      success: true,
      data: {
        programAreas: result
      }
    });
  } catch (error) {
    console.error('Error fetching public program area counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch program area counts'
    });
  }
});

// Update specialty visibility settings
router.put('/specialties/visibility', protect, isAdmin, async (req, res) => {
  try {
    const { specialties } = req.body;

    if (!Array.isArray(specialties)) {
      return res.status(400).json({
        success: false,
        error: 'Specialties array is required'
      });
    }

    // Update each specialty in the database
    const updatePromises = specialties.map(async (specialty) => {
      const specialtyName = specialty.specialtyId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      return Specialty.updateOne(
        { name: specialtyName },
        {
          $set: {
            isVisible: specialty.isVisible,
            programArea: specialty.programArea || 'basic',
            lastModified: new Date(),
            modifiedBy: req.user?.username || 'admin'
          }
        }
      );
    });

    await Promise.all(updatePromises);

    // Get updated settings
    const updatedSpecialties = await Specialty.find({}).select('name isVisible programArea lastModified modifiedBy');
    const visibilitySettings = {
      specialties: updatedSpecialties.map(specialty => ({
        specialtyId: specialty.name.toLowerCase().replace(/\s+/g, '_'),
        isVisible: specialty.isVisible,
        programArea: specialty.programArea,
        lastModified: specialty.lastModified,
        modifiedBy: specialty.modifiedBy
      }))
    };

    res.json({
      success: true,
      data: visibilitySettings,
      message: 'Specialty visibility settings updated successfully'
    });
    // Invalidate public visibility cache so clients get fresh data
    try {
      _specialtyVisibilityCache = null;
      _specialtyVisibilityCacheTs = 0;
    } catch (e) {
      // ignore
    }
  } catch (error) {
    console.error('Error updating specialty visibility settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update specialty visibility settings'
    });
  }
});

// Get admin specialties with visibility info
router.get('/programs/specialties', protect, isAdmin, async (req, res) => {
  try {
    // Import Case model for case counting
    const Case = (await import('../models/CaseModel.js')).default;

    // Get all specialties from database
    const specialties = await Specialty.find({}).sort({ name: 1 });

    // Get case counts for each specialty
    const caseCounts = await Case.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$case_metadata.specialty', count: { $sum: 1 } } }
    ]);

    // Create a map of specialty names to case counts
    const caseCountMap = {};
    caseCounts.forEach(item => {
      caseCountMap[item._id] = item.count;
    });

    // Define specialty metadata (colors, icons, etc.)
    const specialtyMetadata = {
      'Internal Medicine': {
        description: 'Complex medical cases focusing on diagnosis and management of internal conditions',
        difficulty: 'intermediate',
        phase: 'current',
        color: '#2E7D9A',
        icon: '🏥'
      },
      'Surgery': {
        description: 'Surgical procedures and perioperative care',
        difficulty: 'advanced',
        phase: 'current',
        color: '#BE123C',
        icon: '🔪'
      },
      'Pediatrics': {
        description: 'Child and adolescent medicine',
        difficulty: 'intermediate',
        phase: 'current',
        color: '#059669',
        icon: '👶'
      },
      'Ophthalmology': {
        description: 'Eye conditions and visual system disorders',
        difficulty: 'intermediate',
        phase: 'current',
        color: '#7C3AED',
        icon: '👁️'
      },
      'ENT': {
        description: 'Ear, nose, and throat conditions',
        difficulty: 'intermediate',
        phase: 'current',
        color: '#EA580C',
        icon: '👂'
      },
      'Cardiology': {
        description: 'Heart and cardiovascular system cases',
        difficulty: 'advanced',
        phase: 'phase1',
        color: '#C62D42',
        icon: '❤️'
      },
      'Neurology': {
        description: 'Neurological conditions and brain disorders',
        difficulty: 'advanced',
        phase: 'phase1',
        color: '#7C3AED',
        icon: '🧠'
      },
      'Emergency Medicine': {
        description: 'Acute care and trauma scenarios',
        difficulty: 'advanced',
        phase: 'phase1',
        color: '#DC2626',
        icon: '🚑'
      },
      'Psychiatry': {
        description: 'Mental health and behavioral cases',
        difficulty: 'intermediate',
        phase: 'phase2',
        color: '#7C2D92',
        icon: '🧠'
      },
      'Family Medicine': {
        description: 'Primary care and family practice',
        difficulty: 'beginner',
        phase: 'current',
        color: '#059669',
        icon: '🏠'
      },
      'Obstetrics & Gynecology': {
        description: 'Women\'s health and reproductive medicine',
        difficulty: 'advanced',
        phase: 'phase2',
        color: '#BE123C',
        icon: '🤰'
      },
      'Dermatology': {
        description: 'Skin conditions and dermatological procedures',
        difficulty: 'intermediate',
        phase: 'phase2',
        color: '#EA580C',
        icon: '🧴'
      },
      'Orthopedics': {
        description: 'Musculoskeletal system and orthopedic procedures',
        difficulty: 'advanced',
        phase: 'phase2',
        color: '#1D4ED8',
        icon: '🦴'
      },
      'Radiology': {
        description: 'Medical imaging and radiological interpretation',
        difficulty: 'advanced',
        phase: 'phase2',
        color: '#374151',
        icon: '📊'
      },
      'Pathology': {
        description: 'Laboratory medicine and pathological analysis',
        difficulty: 'advanced',
        phase: 'phase2',
        color: '#92400E',
        icon: '🔬'
      },
      'Anesthesiology': {
        description: 'Anesthesia and perioperative medicine',
        difficulty: 'advanced',
        phase: 'phase2',
        color: '#1F2937',
        icon: '💉'
      },
      'Nursing': {
        description: 'Nursing care and patient management',
        difficulty: 'beginner',
        phase: 'current',
        color: '#3B82F6',
        icon: '👩‍⚕️'
      },
      'Laboratory': {
        description: 'Laboratory medicine and diagnostics',
        difficulty: 'intermediate',
        phase: 'current',
        color: '#10B981',
        icon: '🧪'
      },
      'Gastroenterology': {
        description: 'Digestive system disorders and gastrointestinal procedures',
        difficulty: 'intermediate',
        phase: 'current',
        color: '#C62D42',
        icon: '🫀'
      },
      'Oncology': {
        description: 'Cancer care and oncological treatment',
        difficulty: 'advanced',
        phase: 'phase2',
        color: '#7C2D92',
        icon: '🎗️'
      },
      'Reproductive Health': {
        description: 'Reproductive medicine and family planning',
        difficulty: 'intermediate',
        phase: 'phase2',
        color: '#EC4899',
        icon: '🌸'
      }
    };

    // Format specialties for response
    const formattedSpecialties = specialties.map(specialty => {
      const metadata = specialtyMetadata[specialty.name] || {
        description: `${specialty.name} specialty for medical training`,
        difficulty: 'intermediate',
        phase: 'current',
        color: '#6B7280',
        icon: '📚'
      };

      return {
        id: specialty.name.toLowerCase().replace(/\s+/g, '_'),
        name: specialty.name,
        description: metadata.description,
        caseCount: caseCountMap[specialty.name] || 0,
        difficulty: metadata.difficulty,
        phase: metadata.phase,
        color: metadata.color,
        icon: metadata.icon,
        visibility: {
          isVisible: specialty.isVisible,
          programArea: specialty.programArea,
          lastModified: specialty.lastModified,
          modifiedBy: specialty.modifiedBy
        }
      };
    });

    res.json({
      success: true,
      specialties: formattedSpecialties
    });
  } catch (error) {
    console.error('Error fetching admin specialties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin specialties'
    });
  }
});

// Get program areas with case counts
router.get('/programs/program-areas/counts', protect, isAdmin, async (req, res) => {
  try {
    // Import Case model
    const Case = (await import('../models/CaseModel.js')).default;

    // Aggregate cases by program area
    const programAreaCounts = await Case.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$case_metadata.program_area',
          casesCount: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const programAreas = programAreaCounts.map(item => ({
      name: item._id || 'Basic Program', // Default to Basic Program if not set
      casesCount: item.casesCount
    }));

    // Ensure both program areas are included even if they have no cases
    const programAreaMap = {
      'Basic Program': 0,
      'Specialty Program': 0
    };

    // Update counts from database
    programAreas.forEach(pa => {
      if (pa.name in programAreaMap) {
        programAreaMap[pa.name] = pa.casesCount;
      }
    });

    // Convert back to array format
    const result = Object.keys(programAreaMap).map(name => ({
      name,
      casesCount: programAreaMap[name]
    }));

    res.json({
      success: true,
      data: {
        programAreas: result
      }
    });
  } catch (error) {
    console.error('Error fetching program area counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch program area counts'
    });
  }
});

// Get specialties with case counts
router.get('/programs/specialties/counts', protect, isAdmin, async (req, res) => {
  try {
    // Import Case model
    const Case = (await import('../models/CaseModel.js')).default;

    // Get all specialties from database
    const specialties = await Specialty.find({}).sort({ name: 1 });

    // Get case counts for each specialty
    const caseCounts = await Case.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$case_metadata.specialty', count: { $sum: 1 } } }
    ]);

    // Create a map of specialty names to case counts
    const caseCountMap = {};
    caseCounts.forEach(item => {
      caseCountMap[item._id] = item.count;
    });

    // Format specialties for response
    const formattedSpecialties = specialties.map(specialty => ({
      id: specialty.name.toLowerCase().replace(/\s+/g, '_'),
      name: specialty.name,
      caseCount: caseCountMap[specialty.name] || 0,
      isVisible: specialty.isVisible,
      programArea: specialty.programArea
    }));

    res.json({
      success: true,
      data: {
        specialties: formattedSpecialties
      }
    });
  } catch (error) {
    console.error('Error fetching specialty counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch specialty counts'
    });
  }
});

export default router;