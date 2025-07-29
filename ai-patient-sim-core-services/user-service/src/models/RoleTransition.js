// ai-patient-sim-core-services/user-service/src/models/RoleTransition.js
// Manages user role transitions and graduations
const mongoose = require('mongoose');

const roleTransitionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  transitionDetails: {
    fromRole: {
      type: String,
      required: true
    },
    toRole: {
      type: String,
      required: true
    },
    transitionType: {
      type: String,
      enum: ['automatic', 'manual', 'graduation', 'transfer', 'emergency'],
      required: true
    },
    reason: String
  },

  requirements: {
    simulationsRequired: { type: Number, default: 0 },
    simulationsCompleted: { type: Number, default: 0 },
    averageScoreRequired: { type: Number, default: 0 },
    currentAverageScore: { type: Number, default: 0 },
    competenciesRequired: [String],
    competenciesAchieved: [String],
    certificationsRequired: [String],
    certificationsEarned: [String],
    additionalRequirements: [{
      requirement: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'waived'],
        default: 'pending'
      },
      completedDate: Date,
      notes: String
    }]
  },

  approval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'conditional'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: Date,
    conditions: [String],
    rejectionReason: String,
    reviewNotes: String
  },

  timeline: {
    requestedDate: { type: Date, default: Date.now },
    reviewStartDate: Date,
    approvalDate: Date,
    effectiveDate: Date,
    completedDate: Date
  },

  supportPlan: {
    mentorAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    additionalTraining: [String],
    monitoringPeriod: Number, // days
    checkInSchedule: [Date],
    resources: [String]
  },

  metadata: {
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    systemGenerated: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    notifications: [{
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: String,
      sentDate: Date,
      acknowledged: { type: Boolean, default: false }
    }]
  }
}, {
  timestamps: true
});

// Indexes
roleTransitionSchema.index({ userId: 1 });
roleTransitionSchema.index({ 'approval.status': 1 });
roleTransitionSchema.index({ 'transitionDetails.transitionType': 1 });
roleTransitionSchema.index({ 'timeline.effectiveDate': 1 });

// Check if transition is eligible for automatic approval
roleTransitionSchema.methods.isEligibleForAutoApproval = function() {
  const req = this.requirements;
  
  return (
    req.simulationsCompleted >= req.simulationsRequired &&
    req.currentAverageScore >= req.averageScoreRequired &&
    req.competenciesAchieved.length >= req.competenciesRequired.length &&
    req.certificationsEarned.length >= req.certificationsRequired.length &&
    req.additionalRequirements.every(r => r.status === 'completed' || r.status === 'waived')
  );
};

// Calculate completion percentage
roleTransitionSchema.methods.getCompletionPercentage = function() {
  const req = this.requirements;
  let totalWeight = 0;
  let completedWeight = 0;

  // Simulations (30% weight)
  totalWeight += 30;
  if (req.simulationsRequired > 0) {
    completedWeight += Math.min(30, (req.simulationsCompleted / req.simulationsRequired) * 30);
  }

  // Average score (25% weight)
  totalWeight += 25;
  if (req.averageScoreRequired > 0) {
    completedWeight += Math.min(25, (req.currentAverageScore / req.averageScoreRequired) * 25);
  }

  // Competencies (25% weight)
  totalWeight += 25;
  if (req.competenciesRequired.length > 0) {
    completedWeight += (req.competenciesAchieved.length / req.competenciesRequired.length) * 25;
  }

  // Additional requirements (20% weight)
  totalWeight += 20;
  if (req.additionalRequirements.length > 0) {
    const completedAdditional = req.additionalRequirements.filter(r => 
      r.status === 'completed' || r.status === 'waived'
    ).length;
    completedWeight += (completedAdditional / req.additionalRequirements.length) * 20;
  }

  return Math.round((completedWeight / totalWeight) * 100);
};

module.exports = mongoose.model('RoleTransition', roleTransitionSchema);