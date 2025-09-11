import express from 'express';
import userRegistrationService from '../services/UserRegistrationService.js';
import { 
  requireOwnData, 
  populateUser, 
  anyAuthenticated,
  adminOnly 
} from '../middleware/rbacMiddleware.js';
import { UserRole, HealthcareDiscipline } from '../models/UserModel.js';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import { getPrivacySettings, updatePrivacySettings, exportUserData, requestAccountDeletion } from '../controllers/privacyController.js';

const router = express.Router();

/**
 * User Registration Routes
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with basic registration information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - discipline
 *               - firstName
 *               - lastName
 *               - institution
 *             properties:
 *               username:
 *                 type: string
 *                 example: 'johndoe'
 *                 description: Must contain only letters and numbers (no special characters)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john.doe@example.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'password123'
 *                 description: Must be at least 6 characters long
 *               discipline:
 *                 type: string
 *                 enum: [medicine, nursing, radiology, pharmacy, laboratory]
 *                 example: 'medicine'
 *               firstName:
 *                 type: string
 *                 example: 'John'
 *               lastName:
 *                 type: string
 *                 example: 'Doe'
 *               institution:
 *                 type: string
 *                 example: 'Medical University'
 *               primaryRole:
 *                 type: string
 *                 enum: [student, educator, admin]
 *                 example: 'student'
 *                 default: 'student'
 *               specialization:
 *                 type: string
 *                 example: 'Cardiology'
 *               yearOfStudy:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 3
 *               licenseNumber:
 *                 type: string
 *                 example: 'MD123456'
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: 'User registered successfully'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                 profileComplete:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
  try {
    // Transform frontend data structure to match backend expectations
    let registrationData = { ...req.body };
    
    // If profile data is nested, flatten it to root level
    if (req.body.profile) {
      const { profile, ...otherData } = req.body;
      registrationData = {
        ...otherData,
        ...profile
      };
    }
    
    console.log('Registration data received:', JSON.stringify(req.body, null, 2));
    console.log('Transformed registration data:', JSON.stringify(registrationData, null, 2));
    
    const result = await userRegistrationService.registerUser(registrationData);
    
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
 * @swagger
 * /api/users/{userId}/complete-profile:
 *   post:
 *     summary: Complete user profile after registration
 *     description: Finalize user profile with additional information after initial registration
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: 'John'
 *               lastName:
 *                 type: string
 *                 example: 'Doe'
 *               institution:
 *                 type: string
 *                 example: 'Medical University'
 *               specialization:
 *                 type: string
 *                 example: 'Cardiology'
 *               yearOfStudy:
 *                 type: number
 *                 example: 3
 *               licenseNumber:
 *                 type: string
 *                 example: 'MD123456'
 *               competencyLevel:
 *                 type: string
 *                 enum: [novice, advanced_beginner, competent, proficient, expert]
 *                 example: 'competent'
 *               learningStyle:
 *                 type: string
 *                 enum: [visual, auditory, kinesthetic, reading]
 *                 example: 'visual'
 *               difficultyPreference:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, adaptive]
 *                 example: 'intermediate'
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   push:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Profile completed successfully
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
 *                   example: 'Profile completed successfully'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/{userId}/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve complete user profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 profileComplete:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/{userId}/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: 'John'
 *               lastName:
 *                 type: string
 *                 example: 'Doe'
 *               institution:
 *                 type: string
 *                 example: 'Medical University'
 *               specialization:
 *                 type: string
 *                 example: 'Cardiology'
 *               yearOfStudy:
 *                 type: number
 *                 example: 3
 *               licenseNumber:
 *                 type: string
 *                 example: 'MD123456'
 *               competencyLevel:
 *                 type: string
 *                 enum: [novice, advanced_beginner, competent, proficient, expert]
 *                 example: 'competent'
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: 'Profile updated successfully'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/{userId}/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user learning preferences and notification settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningStyle:
 *                 type: string
 *                 enum: [visual, auditory, kinesthetic, reading]
 *                 example: 'visual'
 *               difficultyPreference:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, adaptive]
 *                 example: 'intermediate'
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   push:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                   example: 'Preferences updated successfully'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/{userId}/password:
 *   put:
 *     summary: Change user password
 *     description: Update user's password with current password verification
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: 'current123'
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: 'newPassword456'
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: 'Password changed successfully'
 *       400:
 *         description: Invalid input or current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/disciplines:
 *   get:
 *     summary: Get available healthcare disciplines
 *     description: Retrieve list of all available healthcare disciplines with descriptions
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of healthcare disciplines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 disciplines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: 'medicine'
 *                       label:
 *                         type: string
 *                         example: 'Medicine'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/roles:
 *   get:
 *     summary: Get available user roles
 *     description: Retrieve list of all available user roles with descriptions
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of user roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: 'student'
 *                       label:
 *                         type: string
 *                         example: 'Student'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/registration-config:
 *   get:
 *     summary: Get registration form configuration
 *     description: Retrieve complete configuration for user registration form including disciplines, roles, competency levels, learning styles, and difficulty preferences
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Registration configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 config:
 *                   type: object
 *                   properties:
 *                     disciplines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'medicine'
 *                           label:
 *                             type: string
 *                             example: 'Medicine'
 *                           description:
 *                             type: string
 *                             example: 'Medical practice, diagnosis, and treatment'
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'student'
 *                           label:
 *                             type: string
 *                             example: 'Student'
 *                           description:
 *                             type: string
 *                             example: 'Learning healthcare skills and knowledge'
 *                     competencyLevels:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'novice'
 *                           label:
 *                             type: string
 *                             example: 'Novice'
 *                           description:
 *                             type: string
 *                             example: 'Beginning level with limited experience'
 *                     learningStyles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'visual'
 *                           label:
 *                             type: string
 *                             example: 'Visual'
 *                           description:
 *                             type: string
 *                             example: 'Learn best through images and diagrams'
 *                     difficultyPreferences:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'beginner'
 *                           label:
 *                             type: string
 *                             example: 'Beginner'
 *                           description:
 *                             type: string
 *                             example: 'Start with basic concepts'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/admin/stats:
 *   get:
 *     summary: Get registration statistics (Admin only)
 *     description: Retrieve registration statistics including user counts by role and discipline (Admin access required)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registration statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       example: 150
 *                     usersByRole:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                         example: 100
 *                     usersByDiscipline:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                         example: 50
 *                     registrationsThisMonth:
 *                       type: number
 *                       example: 25
 *                     profileCompletionRate:
 *                       type: number
 *                       format: float
 *                       example: 85.5
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/users/{userId}/profile-wizard:
 *   get:
 *     summary: Get profile completion steps
 *     description: Retrieve profile wizard steps with completion status for guided profile setup
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Profile wizard steps retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 'basic-info'
 *                       title:
 *                         type: string
 *                         example: 'Basic Information'
 *                       description:
 *                         type: string
 *                         example: 'Complete your basic profile information'
 *                       completed:
 *                         type: boolean
 *                         example: true
 *                       fields:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ['firstName', 'lastName', 'institution']
 *                 overallProgress:
 *                   type: number
 *                   format: float
 *                   example: 75.0
 *                 profileComplete:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * Privacy Settings Routes - Bridge to privacy functionality
 */

/**
 * @swagger
 * /api/users/privacy-settings:
 *   get:
 *     summary: Get user privacy settings
 *     description: Retrieves the privacy settings for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     showInLeaderboard:
 *                       type: boolean
 *                     showRealName:
 *                       type: boolean
 *                     shareProgressWithEducators:
 *                       type: boolean
 *                     allowAnonymousAnalytics:
 *                       type: boolean
 *                     dataRetentionPeriod:
 *                       type: string
 *                       enum: [forever, 1year, 2years, 5years]
 *                     profileVisibility:
 *                       type: string
 *                       enum: [public, educators, private]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/privacy-settings', protect, getPrivacySettings);

/**
 * @swagger
 * /api/users/privacy-settings:
 *   put:
 *     summary: Update user privacy settings
 *     description: Updates the privacy settings for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showInLeaderboard:
 *                 type: boolean
 *               showRealName:
 *                 type: boolean
 *               shareProgressWithEducators:
 *                 type: boolean
 *               allowAnonymousAnalytics:
 *                 type: boolean
 *               dataRetentionPeriod:
 *                 type: string
 *                 enum: [forever, 1year, 2years, 5years]
 *               profileVisibility:
 *                 type: string
 *                 enum: [public, educators, private]
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         description: Invalid privacy settings provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/privacy-settings', protect, updatePrivacySettings);

/**
 * @swagger
 * /api/users/export-data:
 *   post:
 *     summary: Export user data
 *     description: Exports all personal data for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exportType:
 *                 type: string
 *                 default: 'all'
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: 'json'
 *     responses:
 *       200:
 *         description: Data export generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/export-data', protect, exportUserData);

/**
 * @swagger
 * /api/users/request-account-deletion:
 *   post:
 *     summary: Request account deletion
 *     description: Initiates the account deletion process for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deletion request processed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/request-account-deletion', protect, requestAccountDeletion);

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