// ai-patient-sim-core-services/user-service/src/routes/profile.js
// Extended profile management routes - EXTENDS existing functionality
const express = require('express');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { auth: authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get extended user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get basic user info (existing)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get extended profile (new)
    let userProfile = await UserProfile.findOne({ userId });
    
    // If no extended profile exists, create a basic one
    if (!userProfile) {
      const currentYear = user.profile?.yearOfStudy || 1;
      const roleType = currentYear <= 3 ? `medical_student_year${currentYear}` : 
                      currentYear <= 6 ? `clinical_clerk_year${currentYear}` : 'intern';
      
      userProfile = new UserProfile({
        userId,
        academicProfile: {
          program: 'medicine', // default
          currentYear: currentYear,
          institution: user.institution || 'other',
          studentId: user.email.split('@')[0], // temporary
          expectedGraduation: new Date(Date.now() + ((7 - currentYear) * 365 * 24 * 60 * 60 * 1000))
        },
        enhancedRole: {
          level: currentYear,
          roleType: roleType,
          specialty: user.profile?.specialization
        },
        contactInfo: {
          phoneNumber: '',
          alternateEmail: ''
        },
        progressionData: {
          competencyLevels: {
            clinical_skills: 'novice',
            communication: 'basic',
            clinical_reasoning: 'recognition',
            professionalism: 'novice',
            leadership: 'novice'
          },
          simulationStats: {
            totalCompleted: 0,
            averageScore: 0,
            lastSimulationDate: null,
            streakDays: 0
          },
          nextRequirements: []
        }
      });
      
      try {
        await userProfile.save();
      } catch (saveError) {
        console.error('Error creating user profile:', saveError);
        // Continue with empty profile rather than failing
        userProfile = null;
      }
    }

    res.json({
      success: true,
      user: {
        // Basic info (existing structure maintained)
        id: user._id,
        email: user.email,
        role: user.role,
        institution: user.institution,
        profile: user.profile,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        
        // Extended info (new) - only include if profile exists
        extendedProfile: userProfile || null
      }
    });
  } catch (error) {
    console.error('Error fetching extended profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update extended profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const updates = req.body;

    // Update basic user info if provided (maintains existing functionality)
    if (updates.basicProfile) {
      await User.findByIdAndUpdate(userId, {
        'profile.firstName': updates.basicProfile.firstName,
        'profile.lastName': updates.basicProfile.lastName,
        'profile.specialization': updates.basicProfile.specialization,
        'profile.yearOfStudy': updates.basicProfile.yearOfStudy,
        institution: updates.basicProfile.institution
      });
    }

    // Update extended profile
    if (updates.extendedProfile) {
      let userProfile = await UserProfile.findOne({ userId });
      
      if (!userProfile) {
        userProfile = new UserProfile({ userId, ...updates.extendedProfile });
      } else {
        Object.assign(userProfile, updates.extendedProfile);
      }
      
      await userProfile.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get user's role permissions and access levels
router.get('/permissions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'Extended profile not found'
      });
    }

    // Define role-based permissions
    const rolePermissions = {
      medical_student_year1: {
        simulationAccess: ['basic_anatomy', 'physiology_sims', 'communication_basics'],
        maxComplexity: 'basic',
        certificationAccess: ['basic_life_support_theory']
      },
      medical_student_year2: {
        simulationAccess: ['pathophysiology_cases', 'basic_clinical_reasoning', 'patient_safety'],
        maxComplexity: 'intermediate',
        certificationAccess: ['infection_control', 'patient_safety_basics']
      },
      medical_student_year3: {
        simulationAccess: ['clinical_skills', 'basic_procedures', 'acls_preparation'],
        maxComplexity: 'intermediate_plus',
        certificationAccess: ['BLS_certification', 'clinical_skills_basic']
      },
      clinical_clerk_year4: {
        simulationAccess: ['ward_simulations', 'emergency_protocols', 'specialty_basics'],
        maxComplexity: 'advanced',
        certificationAccess: ['ACLS', 'clinical_skills_intermediate']
      },
      clinical_clerk_year5: {
        simulationAccess: ['specialty_rotations', 'complex_cases', 'interprofessional_sims'],
        maxComplexity: 'advanced_plus',
        certificationAccess: ['ATLS_preparation', 'specialty_specific']
      },
      clinical_clerk_year6: {
        simulationAccess: ['senior_clerkship', 'leadership_sims', 'research_cases'],
        maxComplexity: 'expert',
        certificationAccess: ['ATLS', 'leadership_basics']
      },
      intern: {
        simulationAccess: ['critical_care', 'emergency_management', 'procedural_sims'],
        maxComplexity: 'expert',
        certificationAccess: ['ATLS', 'critical_care_basics']
      },
      registrar: {
        simulationAccess: ['specialty_advanced', 'rare_cases', 'teaching_sims'],
        maxComplexity: 'expert_plus',
        certificationAccess: ['specialty_specific', 'teaching_basics']
      },
      fellow: {
        simulationAccess: ['research_cases', 'rare_diseases', 'innovation_sims'],
        maxComplexity: 'master',
        certificationAccess: ['subspecialty_expert', 'research_methods']
      },
      instructor: {
        simulationAccess: ['all_content', 'analytics_dashboard', 'content_creation'],
        maxComplexity: 'unlimited',
        permissions: ['view_all_users', 'assign_cases', 'grade_override']
      }
    };

    const permissions = rolePermissions[userProfile.enhancedRole.roleType] || rolePermissions.medical_student_year1;

    res.json({
      success: true,
      permissions: {
        roleType: userProfile.enhancedRole.roleType,
        level: userProfile.enhancedRole.level,
        ...permissions,
        competencyLevels: userProfile.progressionData.competencyLevels,
        simulationStats: userProfile.progressionData.simulationStats
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
});

// Get progression requirements for next level
router.get('/progression-requirements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Define progression requirements based on current role
    const progressionRequirements = {
      medical_student_year1: {
        nextRole: 'medical_student_year2',
        requirements: {
          simulationsRequired: 15,
          averageScoreRequired: 70,
          competenciesRequired: ['basic_communication', 'patient_safety'],
          certificationsRequired: ['basic_life_support_theory']
        }
      },
      medical_student_year2: {
        nextRole: 'medical_student_year3',
        requirements: {
          simulationsRequired: 25,
          averageScoreRequired: 75,
          competenciesRequired: ['clinical_reasoning_basic', 'infection_control'],
          certificationsRequired: ['patient_safety_basics']
        }
      },
      medical_student_year3: {
        nextRole: 'clinical_clerk_year4',
        requirements: {
          simulationsRequired: 35,
          averageScoreRequired: 78,
          competenciesRequired: ['clinical_skills_basic', 'emergency_recognition'],
          certificationsRequired: ['BLS_certification']
        }
      }
      // Add more as needed
    };

    const currentRequirements = progressionRequirements[userProfile.enhancedRole.roleType];
    
    if (!currentRequirements) {
      return res.json({
        success: true,
        message: 'No further progression available',
        currentRole: userProfile.enhancedRole.roleType
      });
    }

    res.json({
      success: true,
      currentRole: userProfile.enhancedRole.roleType,
      nextRole: currentRequirements.nextRole,
      requirements: currentRequirements.requirements,
      currentProgress: {
        simulationsCompleted: userProfile.progressionData.simulationStats.totalCompleted,
        currentAverageScore: userProfile.progressionData.simulationStats.averageScore,
        competenciesAchieved: Object.entries(userProfile.progressionData.competencyLevels)
          .filter(([key, value]) => value !== 'novice' && value !== 'basic')
          .map(([key]) => key)
      }
    });
  } catch (error) {
    console.error('Error fetching progression requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progression requirements'
    });
  }
});

module.exports = router;