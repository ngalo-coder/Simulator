import mongoose from 'mongoose';

const CompetencyAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Professional standards and certifications
  professionalStandards: [{
    standardId: {
      type: String,
      required: true,
      trim: true
    },
    standardName: {
      type: String,
      required: true,
      trim: true
    },
    version: {
      type: String,
      default: '1.0'
    },
    issuingBody: {
      type: String,
      trim: true
    },
    applicableSpecialties: [String],
    requirements: [{
      requirementId: String,
      description: String,
      competencyArea: String,
      requiredLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      evidenceTypes: [String] // e.g., 'case_completion', 'assessment', 'portfolio'
    }]
  }],
  // Competency areas and levels
  competencies: [{
    competencyId: {
      type: String,
      required: true,
      trim: true
    },
    competencyName: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      enum: ['clinical_skills', 'knowledge', 'communication', 'procedural', 'professional'],
      required: true
    },
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    targetLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    lastAssessed: Date,
    assessmentMethod: String, // e.g., 'simulation', 'written_test', 'practical'
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  // Assessment results and evidence
  assessments: [{
    assessmentId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['internal', 'external', 'self_assessment', 'peer_review'],
      default: 'internal'
    },
    competencyArea: String,
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'in_progress', 'not_taken'],
      default: 'not_taken'
    },
    completedAt: Date,
    validityPeriod: Number, // in months
    evidence: [{
      type: {
        type: String,
        enum: ['case_completion', 'assessment_score', 'portfolio_item', 'external_cert'],
        required: true
      },
      referenceId: mongoose.Schema.Types.ObjectId, // e.g., case ID, assessment ID
      description: String,
      score: Number,
      date: {
        type: Date,
        default: Date.now
      },
      verified: {
        type: Boolean,
        default: false
      }
    }],
    externalProvider: {
      name: String,
      providerId: String,
      certificationId: String
    }
  }],
  // Certification tracking
  certifications: [{
    certificationId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    issuingBody: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['eligible', 'applied', 'in_progress', 'certified', 'expired', 'revoked'],
      default: 'eligible'
    },
    requirements: [{
      requirementId: String,
      description: String,
      status: {
        type: String,
        enum: ['met', 'not_met', 'in_progress'],
        default: 'not_met'
      },
      metAt: Date,
      evidence: [{
        type: String,
        referenceId: mongoose.Schema.Types.ObjectId
      }]
    }],
    applicationDate: Date,
    certificationDate: Date,
    expirationDate: Date,
    renewalRequirements: [String],
    externalReference: String // ID from external system
  }],
  // Competency portfolio
  portfolio: [{
    itemId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['case_study', 'assessment', 'reflection', 'project', 'publication'],
      required: true
    },
    description: String,
    competencyAreas: [String],
    date: {
      type: Date,
      default: Date.now
    },
    evidence: {
      fileUrl: String,
      externalLink: String,
      textContent: String
    },
    verification: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date,
      comments: String
    },
    tags: [String],
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private'
    }
  }],
  // External assessment integration
  externalAssessments: [{
    externalSystem: {
      type: String,
      required: true,
      trim: true
    },
    assessmentId: {
      type: String,
      required: true
    },
    title: String,
    competencyArea: String,
    score: Number,
    maxScore: Number,
    completedAt: Date,
    rawData: mongoose.Schema.Types.Mixed, // Store original response
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error'],
      default: 'pending'
    },
    lastSynced: Date
  }],
  // Settings and metadata
  settings: {
    autoSyncExternal: {
      type: Boolean,
      default: false
    },
    portfolioVisibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private'
    },
    assessmentReminders: {
      type: Boolean,
      default: true
    },
    certificationAlerts: {
      type: Boolean,
      default: true
    }
  },
  // Overall progress and stats
  overallCompetencyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastAssessmentDate: Date,
  nextRecommendedAssessment: Date,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
CompetencyAssessmentSchema.index({ userId: 1 });
CompetencyAssessmentSchema.index({ userId: 1, 'certifications.status': 1 });
CompetencyAssessmentSchema.index({ userId: 1, 'competencies.area': 1 });
CompetencyAssessmentSchema.index({ 'externalAssessments.syncStatus': 1 });

// Method to update overall competency score
CompetencyAssessmentSchema.methods.updateOverallScore = function() {
  if (this.competencies.length === 0) {
    this.overallCompetencyScore = 0;
    return;
  }

  // Simple average of confidence scores for now
  const total = this.competencies.reduce((sum, comp) => sum + comp.confidenceScore, 0);
  this.overallCompetencyScore = Math.round(total / this.competencies.length);
};

// Method to add assessment evidence
CompetencyAssessmentSchema.methods.addEvidence = function(assessmentId, evidenceData) {
  const assessment = this.assessments.id(assessmentId);
  if (assessment) {
    assessment.evidence.push(evidenceData);
    this.updatedAt = new Date();
  }
};

// Method to check certification eligibility
CompetencyAssessmentSchema.methods.checkEligibility = function(certificationId) {
  const certification = this.certifications.id(certificationId);
  if (!certification) return false;

  return certification.requirements.every(req => req.status === 'met');
};

// Method to sync external assessment
CompetencyAssessmentSchema.methods.syncExternalAssessment = function(assessmentData) {
  this.externalAssessments.push({
    ...assessmentData,
    syncStatus: 'synced',
    lastSynced: new Date()
  });
  this.updatedAt = new Date();
};

// Static method to find by user and competency area
CompetencyAssessmentSchema.statics.findByUserAndArea = function(userId, area) {
  return this.findOne({
    userId,
    'competencies.area': area
  });
};

// Pre-save hook to update timestamps and overall score
CompetencyAssessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.updateOverallScore();
  next();
});

export default mongoose.model('CompetencyAssessment', CompetencyAssessmentSchema);