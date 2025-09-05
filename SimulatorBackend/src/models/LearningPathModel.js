import mongoose from 'mongoose';

const LearningPathSchema = new mongoose.Schema({
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
  specialty: {
    type: String,
    trim: true,
    required: true
  },
  programArea: {
    type: String,
    trim: true
  },
  // Learning objectives and alignment
  learningObjectives: [{
    objective: {
      type: String,
      required: true,
      trim: true
    },
    competencyArea: {
      type: String,
      enum: ['clinical_skills', 'knowledge', 'communication', 'procedural', 'professional'],
      required: true
    },
    targetLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    alignedStandards: [{
      type: String,
      trim: true
    }]
  }],
  // Path modules and structure
  modules: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case', // References to cases or learning content
      required: true
    },
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['case', 'assessment', 'theory', 'practice'],
      default: 'case'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 30
    },
    prerequisites: [{
      moduleId: mongoose.Schema.Types.ObjectId,
      requiredScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70
      }
    }],
    dependencies: [{
      moduleId: mongoose.Schema.Types.ObjectId,
      relationship: {
        type: String,
        enum: ['required', 'recommended', 'alternative'],
        default: 'required'
      }
    }],
    learningObjectives: [{
      type: String,
      trim: true
    }]
  }],
  // Progress tracking
  currentModuleIndex: {
    type: Number,
    default: 0
  },
  completedModules: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    timeSpent: Number // in minutes
  }],
  overallProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Adaptive learning settings
  adaptiveSettings: {
    difficultyAdjustment: {
      type: Boolean,
      default: true
    },
    pacing: {
      type: String,
      enum: ['self-paced', 'moderate', 'accelerated'],
      default: 'self-paced'
    },
    feedbackFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  // Status and metadata
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetCompletionDate: Date,
  actualCompletionDate: Date,
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  // Performance metrics
  performanceMetrics: {
    averageScore: {
      type: Number,
      min: 0,
      max: 100
    },
    timeToCompletion: Number, // in days
    competencyGrowth: {
      type: Map,
      of: Number // competency area -> growth percentage
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
LearningPathSchema.index({ userId: 1, status: 1 });
LearningPathSchema.index({ userId: 1, specialty: 1 });
LearningPathSchema.index({ userId: 1, programArea: 1 });

// Method to update overall progress
LearningPathSchema.methods.updateProgress = function() {
  if (this.modules.length === 0) {
    this.overallProgress = 0;
    return;
  }

  const completedCount = this.completedModules.length;
  this.overallProgress = Math.round((completedCount / this.modules.length) * 100);
  
  // Update status based on progress
  if (this.overallProgress === 100) {
    this.status = 'completed';
    this.actualCompletionDate = new Date();
  }
};

// Method to add a completed module
LearningPathSchema.methods.addCompletedModule = function(moduleId, score, timeSpent) {
  this.completedModules.push({
    moduleId,
    score,
    timeSpent,
    completedAt: new Date()
  });
  
  this.updateProgress();
  this.lastAccessed = new Date();
};

// Method to get next recommended module based on performance
LearningPathSchema.methods.getNextModule = function() {
  if (this.currentModuleIndex >= this.modules.length) {
    return null; // All modules completed
  }
  
  // Simple linear progression for now
  // Could be enhanced with adaptive logic based on performance
  return this.modules[this.currentModuleIndex];
};

// Method to check if prerequisites are met for a module
LearningPathSchema.methods.checkPrerequisites = function(moduleIndex) {
  const module = this.modules[moduleIndex];
  if (!module || !module.prerequisites || module.prerequisites.length === 0) {
    return true;
  }
  
  for (const prereq of module.prerequisites) {
    const completedModule = this.completedModules.find(c => c.moduleId.equals(prereq.moduleId));
    if (!completedModule || completedModule.score < prereq.requiredScore) {
      return false;
    }
  }
  
  return true;
};

// Static method to find active paths for user
LearningPathSchema.statics.findActivePaths = function(userId) {
  return this.find({ userId, status: 'active' }).sort({ createdAt: -1 });
};

// Pre-save hook to update lastAccessed
LearningPathSchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  next();
});

export default mongoose.model('LearningPath', LearningPathSchema);