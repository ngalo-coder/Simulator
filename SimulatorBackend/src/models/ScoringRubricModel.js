import mongoose from 'mongoose';

const PerformanceLevelRangeSchema = new mongoose.Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true }
}, { _id: false });

const ScoringCriterionSchema = new mongoose.Schema({
  criterionId: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  evaluationGuidelines: {
    type: String,
    required: true
  },
  evidenceRequirements: [String]
});

const ScoringRubricSchema = new mongoose.Schema({
  rubricId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  discipline: {
    type: String,
    required: true,
    enum: ['medical', 'nursing', 'laboratory', 'radiology', 'pharmacy', 'general'],
    index: true
  },
  specialty: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  description: {
    type: String,
    required: true
  },
  competencyAreas: [{
    area: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    criteria: [ScoringCriterionSchema]
  }],
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 70
  },
  performanceLevels: {
    type: Map,
    of: new mongoose.Schema({
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    }, { _id: false }),
    default: () => new Map([
      ['novice', { min: 0, max: 59 }],
      ['advanced_beginner', { min: 60, max: 74 }],
      ['competent', { min: 75, max: 84 }],
      ['proficient', { min: 85, max: 94 }],
      ['expert', { min: 95, max: 100 }]
    ])
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    caseTypes: [String],
    difficultyLevels: [String],
    applicablePrograms: [String]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ScoringRubricSchema.index({ discipline: 1, specialty: 1 });
ScoringRubricSchema.index({ rubricId: 1 });
ScoringRubricSchema.index({ isActive: 1 });

// Method to calculate total score based on criteria scores
ScoringRubricSchema.methods.calculateScore = function(criteriaScores) {
  let totalScore = 0;
  let totalWeight = 0;

  this.competencyAreas.forEach(area => {
    const areaCriteriaScores = criteriaScores.filter(score => 
      score.area === area.area
    );
    
    let areaScore = 0;
    let areaWeight = 0;
    
    area.criteria.forEach(criterion => {
      const criterionScore = areaCriteriaScores.find(s => s.criterionId === criterion.criterionId);
      if (criterionScore) {
        areaScore += (criterionScore.score / criterion.maxScore) * criterion.weight;
        areaWeight += criterion.weight;
      }
    });
    
    if (areaWeight > 0) {
      totalScore += (areaScore / areaWeight) * area.weight;
      totalWeight += area.weight;
    }
  });

  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
};

// Method to determine performance level based on score
ScoringRubricSchema.methods.determinePerformanceLevel = function(score) {
  for (const [level, range] of this.performanceLevels) {
    if (score >= range.min && score <= range.max) {
      return level;
    }
  }
  return 'novice';
};

// Static method to find active rubrics by discipline
ScoringRubricSchema.statics.findActiveByDiscipline = function(discipline, specialty = null) {
  const query = { discipline, isActive: true };
  if (specialty) {
    query.specialty = specialty;
  }
  return this.find(query).sort({ version: -1 });
};

// Pre-save hook to validate weights sum to 1
ScoringRubricSchema.pre('save', function(next) {
  // Validate competency area weights sum to 1
  const areaWeightSum = this.competencyAreas.reduce((sum, area) => sum + area.weight, 0);
  if (Math.abs(areaWeightSum - 1) > 0.01) {
    return next(new Error('Competency area weights must sum to 1'));
  }

  // Validate criteria weights within each area sum to 1
  for (const area of this.competencyAreas) {
    const criteriaWeightSum = area.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(criteriaWeightSum - 1) > 0.01) {
      return next(new Error(`Criteria weights in area ${area.area} must sum to 1`));
    }
  }

  next();
});

export default mongoose.model('ScoringRubric', ScoringRubricSchema);