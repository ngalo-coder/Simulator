import express from 'express';
import userRegistrationService from '../services/UserRegistrationService.js';
import { 
  requireOwnData, 
  populateUser, 
  anyAuthenticated,
  adminOnly 
} from '../middleware/rbacMiddleware.js';
import { UserRole, HealthcareDiscipline } from '../models/UserModel.js';

const router = express.Router();

/**
 * User Registration Routes
 */

/**
 * Register a new user
 * POST /api/users/register
 */
router.post('/register', async (req, res) => {
  try {
    const result = await userRegistrationService.registerUser(req.body);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error types
    if (error.message.includes('already exists') || 
        error.message.includes('required') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

/**
 * Complete user profile after registration
 * POST /api/users/:userId/complete-profile
 */
router.post('/:userId/complete-profile',
  populateUser(),
  requireOwnData('userId'),
  async (req, res) => {
    try {
      const result = await userRegistrationService.completeProfile(req.params.userId, req.body);
      
      res.json(result);
    } catch (error) {
      console.error('Profile completion error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Profile completion failed. Please try again.'
      });
    }
  }
);

/**
 * Get user profile
 * GET /api/users/:userId/profile
 */
router.get('/:userId/profile',
  populateUser(),
  requireOwnData('userId'),
  async (req, res) => {
    try {
      const result = await userRegistrationService.getProfile(req.params.userId);
      
      res.json(result);
    } catch (error) {
      console.error('Get profile error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile. Please try again.'
      });
    }
  }
);

/**
 * Update user profile
 * PUT /api/users/:userId/profile
 */
router.put('/:userId/profile',
  populateUser(),
  requireOwnData('userId'),
  async (req, res) => {
    try {
      const result = await userRegistrationService.updateProfile(req.params.userId, req.body);
      
      res.json(result);
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Profile update failed. Please try again.'
      });
    }
  }
);

/**
 * Update user preferences
 * PUT /api/users/:userId/preferences
 */
router.put('/:userId/preferences',
  populateUser(),
  requireOwnData('userId'),
  async (req, res) => {
    try {
      const result = await userRegistrationService.updatePreferences(req.params.userId, req.body);
      
      res.json(result);
    } catch (error) {
      console.error('Preferences update error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Preferences update failed. Please try again.'
      });
    }
  }
);

/**
 * Change user password
 * PUT /api/users/:userId/password
 */
router.put('/:userId/password',
  populateUser(),
  requireOwnData('userId'),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const result = await userRegistrationService.changePassword(
        req.params.userId, 
        currentPassword, 
        newPassword
      );
      
      res.json(result);
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      if (error.message.includes('Password must be')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Password change failed. Please try again.'
      });
    }
  }
);

/**
 * Utility Routes
 */

/**
 * Get available healthcare disciplines
 * GET /api/users/disciplines
 */
router.get('/disciplines', (req, res) => {
  const disciplines = Object.values(HealthcareDiscipline).map(discipline => ({
    value: discipline,
    label: discipline.charAt(0).toUpperCase() + discipline.slice(1)
  }));

  res.json({
    success: true,
    disciplines
  });
});

/**
 * Get available user roles
 * GET /api/users/roles
 */
router.get('/roles', (req, res) => {
  const roles = Object.values(UserRole).map(role => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1)
  }));

  res.json({
    success: true,
    roles
  });
});

/**
 * Get registration form configuration
 * GET /api/users/registration-config
 */
router.get('/registration-config', (req, res) => {
  const config = {
    disciplines: Object.values(HealthcareDiscipline).map(discipline => ({
      value: discipline,
      label: discipline.charAt(0).toUpperCase() + discipline.slice(1),
      description: getDiscipineDescription(discipline)
    })),
    roles: Object.values(UserRole).map(role => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
      description: getRoleDescription(role)
    })),
    competencyLevels: [
      { value: 'novice', label: 'Novice', description: 'Beginning level with limited experience' },
      { value: 'advanced_beginner', label: 'Advanced Beginner', description: 'Some experience with guidance needed' },
      { value: 'competent', label: 'Competent', description: 'Adequate performance with planning' },
      { value: 'proficient', label: 'Proficient', description: 'Efficient performance with experience' },
      { value: 'expert', label: 'Expert', description: 'Intuitive performance with deep understanding' }
    ],
    learningStyles: [
      { value: 'visual', label: 'Visual', description: 'Learn best through images and diagrams' },
      { value: 'auditory', label: 'Auditory', description: 'Learn best through listening and discussion' },
      { value: 'kinesthetic', label: 'Kinesthetic', description: 'Learn best through hands-on activities' },
      { value: 'reading', label: 'Reading/Writing', description: 'Learn best through text and written materials' }
    ],
    difficultyPreferences: [
      { value: 'beginner', label: 'Beginner', description: 'Start with basic concepts' },
      { value: 'intermediate', label: 'Intermediate', description: 'Moderate challenge level' },
      { value: 'advanced', label: 'Advanced', description: 'Complex scenarios and challenges' },
      { value: 'adaptive', label: 'Adaptive', description: 'Automatically adjust based on performance' }
    ]
  };

  res.json({
    success: true,
    config
  });
});

/**
 * Admin Routes
 */

/**
 * Get registration statistics (Admin only)
 * GET /api/users/admin/stats
 */
router.get('/admin/stats',
  populateUser(),
  adminOnly,
  async (req, res) => {
    try {
      const stats = await userRegistrationService.getRegistrationStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Stats retrieval error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics'
      });
    }
  }
);

/**
 * Profile Wizard Routes
 */

/**
 * Get profile completion steps
 * GET /api/users/:userId/profile-wizard
 */
router.get('/:userId/profile-wizard',
  populateUser(),
  requireOwnData('userId'),
  async (req, res) => {
    try {
      const profile = await userRegistrationService.getProfile(req.params.userId);
      const user = profile.user;
      
      const steps = [
        {
          id: 'basic-info',
          title: 'Basic Information',
          description: 'Complete your basic profile information',
          completed: !!(user.profile.firstName && user.profile.lastName && user.profile.institution),
          fields: ['firstName', 'lastName', 'institution']
        },
        {
          id: 'academic-info',
          title: 'Academic Information',
          description: 'Add your academic and professional details',
          completed: !!(user.profile.specialization || user.profile.yearOfStudy || user.profile.licenseNumber),
          fields: ['specialization', 'yearOfStudy', 'licenseNumber', 'competencyLevel']
        },
        {
          id: 'preferences',
          title: 'Learning Preferences',
          description: 'Set your learning preferences and notification settings',
          completed: !!(user.profile.preferences.learningStyle && user.profile.preferences.difficultyPreference),
          fields: ['learningStyle', 'difficultyPreference', 'notifications']
        },
        {
          id: 'competencies',
          title: 'Competency Assessment',
          description: 'Review and adjust your competency targets',
          completed: user.competencies && user.competencies.length > 0,
          fields: ['competencies']
        }
      ];

      const overallProgress = steps.filter(step => step.completed).length / steps.length * 100;

      res.json({
        success: true,
        steps,
        overallProgress,
        profileComplete: profile.profileComplete
      });
    } catch (error) {
      console.error('Profile wizard error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile wizard information'
      });
    }
  }
);

/**
 * Helper functions
 */
function getDiscipineDescription(discipline) {
  const descriptions = {
    [HealthcareDiscipline.MEDICINE]: 'Medical practice, diagnosis, and treatment',
    [HealthcareDiscipline.NURSING]: 'Patient care, health promotion, and disease prevention',
    [HealthcareDiscipline.LABORATORY]: 'Diagnostic testing and laboratory analysis',
    [HealthcareDiscipline.RADIOLOGY]: 'Medical imaging and diagnostic radiology',
    [HealthcareDiscipline.PHARMACY]: 'Medication management and pharmaceutical care'
  };
  return descriptions[discipline] || '';
}

function getRoleDescription(role) {
  const descriptions = {
    [UserRole.STUDENT]: 'Learning healthcare skills and knowledge',
    [UserRole.EDUCATOR]: 'Teaching and mentoring healthcare students',
    [UserRole.ADMIN]: 'System administration and management'
  };
  return descriptions[role] || '';
}

export default router;