// ai-patient-sim-core-services/user-service/src/routes/transitions.js
// Role transition and graduation management
const express = require('express');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const RoleTransition = require('../models/RoleTransition');
const { auth: authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Get user's transition history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const transitions = await RoleTransition.find({ userId })
      .populate('approval.approvedBy', 'profile.firstName profile.lastName email')
      .populate('supportPlan.mentorAssigned', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transitions
    });
  } catch (error) {
    console.error('Error fetching transition history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transition history'
    });
  }
});

// Request role transition
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { targetRole, reason } = req.body;

    // Get current user profile
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Check if there's already a pending transition
    const existingTransition = await RoleTransition.findOne({
      userId,
      'approval.status': 'pending'
    });

    if (existingTransition) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending transition request'
      });
    }

    // Define requirements for the target role
    const roleRequirements = {
      medical_student_year2: {
        simulationsRequired: 15,
        averageScoreRequired: 70,
        competenciesRequired: ['basic_communication', 'patient_safety'],
        certificationsRequired: ['basic_life_support_theory']
      },
      medical_student_year3: {
        simulationsRequired: 25,
        averageScoreRequired: 75,
        competenciesRequired: ['clinical_reasoning_basic', 'infection_control'],
        certificationsRequired: ['patient_safety_basics']
      },
      clinical_clerk_year4: {
        simulationsRequired: 35,
        averageScoreRequired: 78,
        competenciesRequired: ['clinical_skills_basic', 'emergency_recognition'],
        certificationsRequired: ['BLS_certification']
      }
      // Add more as needed
    };

    const requirements = roleRequirements[targetRole] || {
      simulationsRequired: 0,
      averageScoreRequired: 0,
      competenciesRequired: [],
      certificationsRequired: []
    };

    // Create transition request
    const transition = new RoleTransition({
      userId,
      transitionDetails: {
        fromRole: userProfile.enhancedRole.roleType,
        toRole: targetRole,
        transitionType: 'manual',
        reason
      },
      requirements: {
        ...requirements,
        simulationsCompleted: userProfile.progressionData.simulationStats.totalCompleted,
        currentAverageScore: userProfile.progressionData.simulationStats.averageScore,
        competenciesAchieved: Object.entries(userProfile.progressionData.competencyLevels)
          .filter(([key, value]) => value !== 'novice' && value !== 'basic')
          .map(([key]) => key),
        certificationsEarned: userProfile.professionalInfo.certifications.map(cert => cert.name)
      },
      metadata: {
        initiatedBy: userId,
        systemGenerated: false
      }
    });

    // Check if eligible for automatic approval
    if (transition.isEligibleForAutoApproval()) {
      transition.approval.status = 'approved';
      transition.approval.approvalDate = new Date();
      transition.timeline.effectiveDate = new Date();
      
      // Update user profile immediately
      await updateUserRole(userId, targetRole);
    }

    await transition.save();

    res.json({
      success: true,
      message: transition.approval.status === 'approved' 
        ? 'Transition approved automatically' 
        : 'Transition request submitted for review',
      transition: {
        id: transition._id,
        status: transition.approval.status,
        completionPercentage: transition.getCompletionPercentage()
      }
    });
  } catch (error) {
    console.error('Error requesting transition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request transition'
    });
  }
});

// Get pending transitions (for instructors/admins)
router.get('/pending', authMiddleware, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const transitions = await RoleTransition.find({
      'approval.status': 'pending'
    })
    .populate('userId', 'profile.firstName profile.lastName email')
    .populate('metadata.initiatedBy', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      transitions: transitions.map(t => ({
        id: t._id,
        user: t.userId,
        fromRole: t.transitionDetails.fromRole,
        toRole: t.transitionDetails.toRole,
        reason: t.transitionDetails.reason,
        completionPercentage: t.getCompletionPercentage(),
        requestedDate: t.timeline.requestedDate,
        requirements: t.requirements
      }))
    });
  } catch (error) {
    console.error('Error fetching pending transitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending transitions'
    });
  }
});

// Approve/reject transition (for instructors/admins)
router.put('/:transitionId/review', authMiddleware, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const { transitionId } = req.params;
    const { action, conditions, notes } = req.body; // action: 'approve', 'reject', 'conditional'
    const reviewerId = req.user._id || req.user.id;

    const transition = await RoleTransition.findById(transitionId);
    if (!transition) {
      return res.status(404).json({
        success: false,
        error: 'Transition not found'
      });
    }

    transition.approval.status = action;
    transition.approval.approvedBy = reviewerId;
    transition.approval.approvalDate = new Date();
    transition.approval.reviewNotes = notes;

    if (action === 'conditional') {
      transition.approval.conditions = conditions || [];
    } else if (action === 'reject') {
      transition.approval.rejectionReason = notes;
    } else if (action === 'approved') {
      transition.timeline.effectiveDate = new Date();
      // Update user role
      await updateUserRole(transition.userId, transition.transitionDetails.toRole);
    }

    await transition.save();

    res.json({
      success: true,
      message: `Transition ${action} successfully`,
      transition: {
        id: transition._id,
        status: transition.approval.status
      }
    });
  } catch (error) {
    console.error('Error reviewing transition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review transition'
    });
  }
});

// Check automatic progression eligibility
router.post('/check-auto-progression', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Define automatic progression rules
    const autoProgressionRules = {
      medical_student_year1: {
        nextRole: 'medical_student_year2',
        requirements: {
          simulationsRequired: 15,
          averageScoreRequired: 70,
          timeInRole: 365 // days
        }
      },
      medical_student_year2: {
        nextRole: 'medical_student_year3',
        requirements: {
          simulationsRequired: 25,
          averageScoreRequired: 75,
          timeInRole: 365
        }
      }
      // Add more rules
    };

    const currentRole = userProfile.enhancedRole.roleType;
    const rule = autoProgressionRules[currentRole];

    if (!rule) {
      return res.json({
        success: true,
        eligible: false,
        message: 'No automatic progression available for current role'
      });
    }

    const stats = userProfile.progressionData.simulationStats;
    const eligible = (
      stats.totalCompleted >= rule.requirements.simulationsRequired &&
      stats.averageScore >= rule.requirements.averageScoreRequired
    );

    if (eligible) {
      // Create automatic transition
      const transition = new RoleTransition({
        userId,
        transitionDetails: {
          fromRole: currentRole,
          toRole: rule.nextRole,
          transitionType: 'automatic',
          reason: 'Automatic progression based on performance'
        },
        requirements: {
          simulationsRequired: rule.requirements.simulationsRequired,
          simulationsCompleted: stats.totalCompleted,
          averageScoreRequired: rule.requirements.averageScoreRequired,
          currentAverageScore: stats.averageScore
        },
        approval: {
          status: 'approved',
          approvalDate: new Date()
        },
        timeline: {
          effectiveDate: new Date()
        },
        metadata: {
          initiatedBy: userId,
          systemGenerated: true
        }
      });

      await transition.save();
      await updateUserRole(userId, rule.nextRole);

      return res.json({
        success: true,
        eligible: true,
        message: 'Automatic progression completed',
        newRole: rule.nextRole
      });
    }

    res.json({
      success: true,
      eligible: false,
      requirements: rule.requirements,
      currentProgress: {
        simulationsCompleted: stats.totalCompleted,
        averageScore: stats.averageScore
      }
    });
  } catch (error) {
    console.error('Error checking auto progression:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check auto progression'
    });
  }
});

// Helper function to update user role
async function updateUserRole(userId, newRole) {
  try {
    // Update UserProfile
    const userProfile = await UserProfile.findOne({ userId });
    if (userProfile) {
      // Add to transition history
      userProfile.transitionHistory.push({
        fromRole: userProfile.enhancedRole.roleType,
        toRole: newRole,
        transitionDate: new Date(),
        transitionType: 'automatic'
      });

      // Update current role
      userProfile.enhancedRole.roleType = newRole;
      
      // Update level based on role
      const roleLevels = {
        medical_student_year1: 1,
        medical_student_year2: 2,
        medical_student_year3: 3,
        clinical_clerk_year4: 4,
        clinical_clerk_year5: 5,
        clinical_clerk_year6: 6,
        intern: 7,
        registrar: 8,
        fellow: 9
      };
      
      userProfile.enhancedRole.level = roleLevels[newRole] || userProfile.enhancedRole.level;
      
      await userProfile.save();
    }

    // Update basic User model for backward compatibility
    const user = await User.findById(userId);
    if (user && newRole.includes('year')) {
      const yearMatch = newRole.match(/year(\d+)/);
      if (yearMatch) {
        user.profile.yearOfStudy = parseInt(yearMatch[1]);
        await user.save();
      }
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

module.exports = router;