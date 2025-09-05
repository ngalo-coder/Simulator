import mongoose from 'mongoose';

const LearningGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['clinical_skills', 'knowledge', 'communication', 'procedural', 'professional'],
    required: true
  },
  specialty: {
    type: String,
    trim: true
  },
  targetScore: {
    type: Number,
    min: 0,
    max: 100
  },
  currentScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'archived'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // SMART criteria
  specific: {
    type: String,
    trim: true
  },
  measurable: {
    type: String,
    trim: true
  },
  achievable: {
    type: String,
    trim: true
  },
  relevant: {
    type: String,
    trim: true
  },
  timeBound: {
    type: String,
    trim: true
  },
  // Action plan
  actionSteps: [{
    step: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    dueDate: {
      type: Date
    },
    resources: [{
      type: String,
      trim: true
    }]
  }],
  // Tracking
  completedAt: {
    type: Date
  },
  lastReviewed: {
    type: Date,
    default: Date.now
  },
  reviewFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    default: 'weekly'
  }
}, {
  timestamps: true
});

// Index for efficient queries
LearningGoalSchema.index({ userId: 1, status: 1 });
LearningGoalSchema.index({ userId: 1, category: 1 });
LearningGoalSchema.index({ userId: 1, deadline: 1 });
LearningGoalSchema.index({ userId: 1, priority: 1 });

// Method to update progress based on action steps
LearningGoalSchema.methods.updateProgress = function() {
  const totalSteps = this.actionSteps.length;
  if (totalSteps === 0) {
    this.progress = 0;
    return;
  }

  const completedSteps = this.actionSteps.filter(step => step.completed).length;
  this.progress = Math.round((completedSteps / totalSteps) * 100);
  
  // Update status based on progress
  if (this.progress === 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.progress > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'not_started';
  }
};

// Method to add an action step
LearningGoalSchema.methods.addActionStep = function(step, dueDate = null, resources = []) {
  this.actionSteps.push({
    step,
    dueDate,
    resources,
    completed: false
  });
  this.updateProgress();
};

// Method to mark action step as completed
LearningGoalSchema.methods.completeActionStep = function(stepIndex) {
  if (this.actionSteps[stepIndex]) {
    this.actionSteps[stepIndex].completed = true;
    this.updateProgress();
  }
};

// Static method to get goals by status and user
LearningGoalSchema.statics.getGoalsByUser = function(userId, status = null) {
  const query = { userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ priority: -1, deadline: 1 });
};

// Pre-save hook to update lastReviewed if progress changes
LearningGoalSchema.pre('save', function(next) {
  if (this.isModified('progress')) {
    this.lastReviewed = new Date();
  }
  next();
});

export default mongoose.model('LearningGoal', LearningGoalSchema);