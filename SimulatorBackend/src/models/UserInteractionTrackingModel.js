import mongoose from 'mongoose';

// Interaction types
const InteractionType = {
  CASE_VIEW: 'case_view',
  CASE_START: 'case_start',
  CASE_COMPLETE: 'case_complete',
  CASE_ABANDON: 'case_abandon',
  RESOURCE_ACCESS: 'resource_access',
  HELP_REQUEST: 'help_request',
  FEEDBACK_SUBMIT: 'feedback_submit',
  NAVIGATION: 'navigation',
  SEARCH: 'search',
  TIME_SPENT: 'time_spent',
  COMPETENCY_UPDATE: 'competency_update',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock'
};

// Resource types
const ResourceType = {
  CASE: 'case',
  LEARNING_MODULE: 'learning_module',
  VIDEO: 'video',
  ARTICLE: 'article',
  QUIZ: 'quiz',
  SIMULATION: 'simulation',
  REFERENCE: 'reference',
  HELP_GUIDE: 'help_guide'
};

// Help request types
const HelpRequestType = {
  DIAGNOSTIC_HELP: 'diagnostic_help',
  TREATMENT_GUIDANCE: 'treatment_guidance',
  NAVIGATION_HELP: 'navigation_help',
  TECHNICAL_SUPPORT: 'technical_support',
  CONTENT_CLARIFICATION: 'content_clarification'
};

// Engagement level classification
const EngagementLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
};

const UserInteractionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Session context
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: false,
    index: true
  },

  // Case context (if applicable)
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: false,
    index: true
  },

  // Interaction details
  interactionType: {
    type: String,
    enum: Object.values(InteractionType),
    required: true,
    index: true
  },

  // Resource details (for resource access)
  resourceType: {
    type: String,
    enum: Object.values(ResourceType),
    required: function() {
      return this.interactionType === InteractionType.RESOURCE_ACCESS;
    }
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.interactionType === InteractionType.RESOURCE_ACCESS;
    }
  },

  resourceName: {
    type: String,
    trim: true
  },

  // Help request details
  helpRequestType: {
    type: String,
    enum: Object.values(HelpRequestType),
    required: function() {
      return this.interactionType === InteractionType.HELP_REQUEST;
    }
  },

  helpRequestContent: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Time tracking
  timeSpentSeconds: {
    type: Number,
    min: 0,
    default: 0
  },

  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },

  endTime: {
    type: Date,
    required: function() {
      return this.interactionType === InteractionType.TIME_SPENT;
    }
  },

  // Navigation details
  fromPage: {
    type: String,
    trim: true
  },

  toPage: {
    type: String,
    trim: true
  },

  // Search details
  searchQuery: {
    type: String,
    trim: true
  },

  searchResultsCount: {
    type: Number,
    min: 0
  },

  // Performance metrics
  score: {
    type: Number,
    min: 0,
    max: 100
  },

  competencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competency'
  },

  competencyName: {
    type: String,
    trim: true
  },

  competencyScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // Achievement details
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  },

  achievementName: {
    type: String,
    trim: true
  },

  // Engagement metrics
  engagementScore: {
    type: Number,
    min: 0,
    max: 100
  },

  engagementLevel: {
    type: String,
    enum: Object.values(EngagementLevel)
  },

  // Device and browser context
  userAgent: {
    type: String,
    trim: true
  },

  deviceType: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'unknown'],
    default: 'unknown'
  },

  browser: {
    type: String,
    trim: true
  },

  // Location context (if available)
  ipAddress: {
    type: String,
    trim: true
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for efficient querying
UserInteractionSchema.index({ userId: 1, createdAt: -1 });
UserInteractionSchema.index({ interactionType: 1, createdAt: -1 });
UserInteractionSchema.index({ caseId: 1, interactionType: 1 });
UserInteractionSchema.index({ resourceType: 1, createdAt: -1 });
UserInteractionSchema.index({ engagementLevel: 1, createdAt: -1 });
UserInteractionSchema.index({ createdAt: 1 });

// Pre-save hook to calculate engagement level
UserInteractionSchema.pre('save', function(next) {
  if (this.interactionType === InteractionType.TIME_SPENT && this.endTime && this.startTime) {
    this.timeSpentSeconds = Math.floor((this.endTime - this.startTime) / 1000);
  }

  // Calculate engagement level based on interaction type and time spent
  if (this.engagementScore === undefined) {
    this.engagementScore = this._calculateEngagementScore();
    this.engagementLevel = this._determineEngagementLevel(this.engagementScore);
  }

  next();
});

// Method to calculate engagement score
UserInteractionSchema.methods._calculateEngagementScore = function() {
  let baseScore = 0;
  
  switch (this.interactionType) {
    case InteractionType.CASE_START:
      baseScore = 20;
      break;
    case InteractionType.CASE_COMPLETE:
      baseScore = 50;
      break;
    case InteractionType.CASE_ABANDON:
      baseScore = 5;
      break;
    case InteractionType.RESOURCE_ACCESS:
      baseScore = 15;
      break;
    case InteractionType.HELP_REQUEST:
      baseScore = 25;
      break;
    case InteractionType.FEEDBACK_SUBMIT:
      baseScore = 30;
      break;
    case InteractionType.TIME_SPENT:
      // Score based on time spent (1 point per minute, capped at 30)
      baseScore = Math.min(30, Math.floor(this.timeSpentSeconds / 60));
      break;
    default:
      baseScore = 10;
  }

  // Additional points for high-value interactions
  if (this.score && this.score >= 80) {
    baseScore += 20;
  } else if (this.score && this.score >= 60) {
    baseScore += 10;
  }

  return Math.min(100, baseScore);
};

// Method to determine engagement level
UserInteractionSchema.methods._determineEngagementLevel = function(score) {
  if (score >= 80) return EngagementLevel.VERY_HIGH;
  if (score >= 60) return EngagementLevel.HIGH;
  if (score >= 40) return EngagementLevel.MEDIUM;
  return EngagementLevel.LOW;
};

// Static method to get user interaction history
UserInteractionSchema.statics.getUserInteractions = function(userId, limit = 100, page = 1) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('caseId', 'case_metadata.title case_metadata.specialty')
    .populate('resourceId', 'title name')
    .lean();
};

// Static method to get engagement metrics for a user
UserInteractionSchema.statics.getUserEngagementMetrics = function(userId, timeRange = '30d') {
  const dateFilter = this._getDateFilter(timeRange);
  
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: dateFilter } },
    {
      $group: {
        _id: '$userId',
        totalInteractions: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpentSeconds' },
        averageEngagementScore: { $avg: '$engagementScore' },
        caseStarts: { $sum: { $cond: [{ $eq: ['$interactionType', InteractionType.CASE_START] }, 1, 0] } },
        caseCompletions: { $sum: { $cond: [{ $eq: ['$interactionType', InteractionType.CASE_COMPLETE] }, 1, 0] } },
        helpRequests: { $sum: { $cond: [{ $eq: ['$interactionType', InteractionType.HELP_REQUEST] }, 1, 0] } },
        resourceAccesses: { $sum: { $cond: [{ $eq: ['$interactionType', InteractionType.RESOURCE_ACCESS] }, 1, 0] } },
        lastActivity: { $max: '$createdAt' }
      }
    }
  ]);
};

// Helper method for date filtering
UserInteractionSchema.statics._getDateFilter = function(timeRange) {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '365d':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { $gte: startDate };
};

// Method to get interaction summary by type
UserInteractionSchema.statics.getInteractionSummary = function(userId, startDate, endDate) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 },
        totalTime: { $sum: '$timeSpentSeconds' },
        avgEngagement: { $avg: '$engagementScore' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const UserInteractionTracking = mongoose.model('UserInteractionTracking', UserInteractionSchema);

export default UserInteractionTracking;
export { InteractionType, ResourceType, HelpRequestType, EngagementLevel };