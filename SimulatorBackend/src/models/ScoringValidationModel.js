import mongoose from 'mongoose';

const ReliabilityScoreSchema = new mongoose.Schema({
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  },
  criteria: [{
    criterionId: String,
    score: Number,
    deviation: Number
  }]
});

const AuditTrailSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['score_created', 'score_updated', 'score_deleted', 'validation_performed', 'reliability_calculated']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed
  },
  newState: {
    type: mongoose.Schema.Types.Mixed
  }
});

const ScoringValidationSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  rubricId: {
    type: String,
    required: true,
    index: true
  },
  primaryScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  primaryEvaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  secondaryScores: [{
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    evaluatedAt: {
      type: Date,
      default: Date.now
    },
    criteriaScores: [{
      criterionId: String,
      score: Number,
      comments: String
    }]
  }],
  interRaterReliability: {
    type: Number,
    min: 0,
    max: 1
  },
  reliabilityScores: [ReliabilityScoreSchema],
  validationStatus: {
    type: String,
    enum: ['pending', 'validated', 'needs_review', 'disputed', 'invalid'],
    default: 'pending'
  },
  validationNotes: [{
    validatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  auditTrail: [AuditTrailSchema],
  statisticalMeasures: {
    meanScore: Number,
    medianScore: Number,
    standardDeviation: Number,
    confidenceInterval: {
      lower: Number,
      upper: Number
    }
  },
  flags: [{
    type: String,
    enum: ['high_variance', 'outlier', 'inconsistent', 'suspicious_pattern']
  }],
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
ScoringValidationSchema.index({ sessionId: 1, rubricId: 1 });
ScoringValidationSchema.index({ primaryEvaluatorId: 1 });
ScoringValidationSchema.index({ validationStatus: 1 });
ScoringValidationSchema.index({ interRaterReliability: 1 });

// Method to add a secondary evaluation
ScoringValidationSchema.methods.addSecondaryEvaluation = function(evaluatorId, score, criteriaScores = []) {
  this.secondaryScores.push({
    evaluatorId,
    score,
    criteriaScores,
    evaluatedAt: new Date()
  });
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'score_created',
    performedBy: evaluatorId,
    details: {
      type: 'secondary',
      score,
      criteriaCount: criteriaScores.length
    }
  });
};

// Method to calculate inter-rater reliability
ScoringValidationSchema.methods.calculateReliability = function() {
  if (this.secondaryScores.length === 0) {
    this.interRaterReliability = null;
    return null;
  }

  const allScores = [this.primaryScore, ...this.secondaryScores.map(s => s.score)];
  
  // Calculate Intraclass Correlation Coefficient (ICC) for reliability
  const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  const variance = allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length;
  const maxVariance = Math.pow(100, 2) / 12; // Maximum possible variance for 0-100 scale
  
  // ICC calculation (simplified)
  this.interRaterReliability = 1 - (variance / maxVariance);
  
  // Calculate statistical measures
  this.statisticalMeasures = {
    meanScore: mean,
    medianScore: this._calculateMedian(allScores),
    standardDeviation: Math.sqrt(variance),
    confidenceInterval: this._calculateConfidenceInterval(allScores, mean, Math.sqrt(variance))
  };
  
  // Check for flags
  this._checkForFlags();
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'reliability_calculated',
    performedBy: null, // System-generated
    details: {
      reliability: this.interRaterReliability,
      scoreCount: allScores.length
    }
  });
  
  return this.interRaterReliability;
};

// Method to validate the scoring
ScoringValidationSchema.methods.validateScoring = function(validatorId, notes = '', status = 'validated') {
  this.validationStatus = status;
  this.validationNotes.push({
    validatorId,
    note: notes,
    createdAt: new Date()
  });
  
  if (status === 'validated' || status === 'resolved') {
    this.resolved = true;
    this.resolvedBy = validatorId;
    this.resolvedAt = new Date();
  }
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'validation_performed',
    performedBy: validatorId,
    details: {
      status,
      notes: notes.substring(0, 100) // Truncate for audit
    }
  });
};

// Private helper methods
ScoringValidationSchema.methods._calculateMedian = function(scores) {
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

ScoringValidationSchema.methods._calculateConfidenceInterval = function(scores, mean, stdDev) {
  const n = scores.length;
  if (n < 2) return { lower: mean, upper: mean };
  
  // 95% confidence interval
  const tValue = 2.776; // Approximate for n=5 (conservative)
  const marginOfError = tValue * (stdDev / Math.sqrt(n));
  
  return {
    lower: Math.max(0, mean - marginOfError),
    upper: Math.min(100, mean + marginOfError)
  };
};

ScoringValidationSchema.methods._checkForFlags = function() {
  this.flags = [];
  
  const { standardDeviation, meanScore } = this.statisticalMeasures;
  
  // High variance flag
  if (standardDeviation > 15) {
    this.flags.push('high_variance');
  }
  
  // Outlier flag (scores outside 2 standard deviations)
  const allScores = [this.primaryScore, ...this.secondaryScores.map(s => s.score)];
  const outliers = allScores.filter(score => 
    Math.abs(score - meanScore) > 2 * standardDeviation
  );
  
  if (outliers.length > 0) {
    this.flags.push('outlier');
  }
  
  // Inconsistent flag if reliability is low
  if (this.interRaterReliability < 0.7) {
    this.flags.push('inconsistent');
  }
  
  // Update validation status based on flags
  if (this.flags.length > 0 && this.validationStatus === 'pending') {
    this.validationStatus = 'needs_review';
  }
};

// Static method to find validations needing review
ScoringValidationSchema.statics.findNeedingReview = function(limit = 10) {
  return this.find({
    validationStatus: 'needs_review',
    resolved: false
  })
  .populate('primaryEvaluatorId', 'name role')
  .populate('secondaryScores.evaluatorId', 'name role')
  .sort({ interRaterReliability: 1 }) // Lowest reliability first
  .limit(limit);
};

// Static method to get reliability statistics for an evaluator
ScoringValidationSchema.statics.getEvaluatorReliability = function(evaluatorId, timeframe = '30d') {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeframe));
  
  return this.aggregate([
    {
      $match: {
        $or: [
          { primaryEvaluatorId: evaluatorId },
          { 'secondaryScores.evaluatorId': evaluatorId }
        ],
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        reliability: '$interRaterReliability',
        isPrimary: { $eq: ['$primaryEvaluatorId', evaluatorId] },
        score: {
          $cond: {
            if: { $eq: ['$primaryEvaluatorId', evaluatorId] },
            then: '$primaryScore',
            else: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$secondaryScores',
                    as: 'score',
                    cond: { $eq: ['$$score.evaluatorId', evaluatorId] }
                  }
                },
                0
              ]
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        avgReliability: { $avg: '$reliability' },
        scoreCount: { $sum: 1 },
        avgScore: { $avg: '$score' },
        primaryCount: {
          $sum: { $cond: ['$isPrimary', 1, 0] }
        }
      }
    }
  ]);
};

// Pre-save hook to update timestamps and calculate reliability if needed
ScoringValidationSchema.pre('save', function(next) {
  if (this.isModified('secondaryScores') && this.secondaryScores.length > 0) {
    this.calculateReliability();
  }
  next();
});

export default mongoose.model('ScoringValidation', ScoringValidationSchema);