// ai-patient-sim-core-services/simulation-service/src/models/TemplateCase.js
const mongoose = require('mongoose');

const templateCaseSchema = new mongoose.Schema({
  // Case metadata
  caseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  version: {
    type: String,
    default: '3.1-program-aware'
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: 'Virtual patient simulation case'
  },
  
  // Case classification
  programArea: {
    type: String,
    required: true,
    enum: ['Basic Program', 'Specialty Program', 'internal_medicine', 'pediatrics', 'psychiatry', 'emergency_medicine', 'family_medicine', 'surgery', 'obstetrics_gynecology', 'cardiology_fellowship'],
    index: true
  },
  specialty: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Intermediate', 'Hard', 'student', 'resident', 'fellow'],
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  location: {
    type: String,
    index: true
  },

  // Patient persona
  patientPersona: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: mongoose.Schema.Types.Mixed, // Can be number or string
      required: true
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other']
    },
    occupation: String,
    chiefComplaint: {
      type: String,
      required: true
    },
    emotionalTone: {
      type: String,
      required: true
    },
    backgroundStory: String,
    speaksFor: {
      type: String,
      default: 'Self'
    },
    patientIsPresent: {
      type: Boolean,
      default: true
    },
    patientAgeForCommunication: mongoose.Schema.Types.Mixed
  },

  // Clinical information (hidden from frontend)
  clinicalDossier: {
    hiddenDiagnosis: {
      type: String,
      required: true
    },
    historyOfPresentingIllness: {
      onset: String,
      location: String,
      radiation: String,
      character: String,
      severity: mongoose.Schema.Types.Mixed,
      timingAndDuration: String,
      exacerbatingFactors: String,
      relievingFactors: String,
      associatedSymptoms: [String]
    },
    reviewOfSystems: {
      positive: [String],
      negative: [String]
    },
    pastMedicalHistory: [String],
    medications: [String],
    allergies: [String],
    surgicalHistory: [String],
    familyHistory: [String],
    socialHistory: {
      smokingStatus: String,
      alcoholUse: String,
      substanceUse: String,
      dietAndExercise: String,
      livingSituation: String
    }
  },

  // System instructions and prompts
  systemInstruction: {
    type: String,
    required: true
  },
  initialPrompt: {
    type: String,
    default: 'You are now interacting with a virtual patient. Begin by asking your clinical questions.'
  },

  // Simulation configuration
  simulationTriggers: {
    endSession: {
      conditionKeyword: String,
      patientResponse: String
    },
    invalidInput: {
      response: String
    }
  },

  // Evaluation criteria
  evaluationCriteria: {
    type: Map,
    of: String
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
templateCaseSchema.index({ programArea: 1, specialty: 1 });
templateCaseSchema.index({ difficulty: 1, tags: 1 });
templateCaseSchema.index({ location: 1, isActive: 1 });
templateCaseSchema.index({ 'patientPersona.age': 1 });

// Virtual for determining if case is pediatric
templateCaseSchema.virtual('isPediatric').get(function() {
  const age = this.patientPersona.age;
  if (typeof age === 'number') {
    return age < 18;
  }
  if (typeof age === 'string') {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum < 18;
  }
  return false;
});

// Virtual for frontend-friendly format (sanitized to avoid diagnostic hints)
templateCaseSchema.virtual('frontendFormat').get(function() {
  // Filter out diagnostic tags that could give away the diagnosis
  const diagnosticKeywords = [
    // Cancers and tumors
    'cancer', 'tumor', 'malignancy', 'carcinoma', 'lymphoma', 'leukemia', 'melanoma',
    // Cardiovascular
    'diabetes', 'hypertension', 'heart failure', 'myocardial', 'stroke', 'syncope',
    // Infectious diseases
    'pneumonia', 'tuberculosis', 'malaria', 'hiv', 'aids', 'cholera', 'typhoid', 'measles',
    // Surgical conditions
    'appendicitis', 'gallstones', 'hernia', 'fracture', 'arthritis',
    // Mental health
    'depression', 'anxiety', 'psychosis', 'schizophrenia', 'bipolar',
    // Respiratory
    'asthma', 'copd', 'bronchitis',
    // Eye conditions
    'glaucoma', 'cataracts', 'conjunctivitis',
    // Skin conditions
    'psoriasis', 'acne', 'tinea', 'urticaria',
    // Endocrine
    'hypothyroidism', 'hyperthyroidism', 'pcos',
    // Neurological
    'seizures', 'parkinsonism', 'neuropathy',
    // Kidney
    'pyelonephritis', 'nephrolithiasis', 'glomerulonephritis',
    // Rheumatological
    'gout', 'lupus', 'spondylitis',
    // Gastrointestinal
    'gastroenteritis', 'reflux', 'diarrhea',
    // Reproductive
    'pregnancy', 'menstruation', 'contraception',
    // Nutritional
    'malnutrition', 'anemia'
  ];
  
  const safeTags = (this.tags || []).filter(tag => {
    const tagLower = tag.toLowerCase();
    return !diagnosticKeywords.some(keyword => tagLower.includes(keyword));
  });

  // Create a generic title that doesn't reveal diagnosis
  const ageGroup = this.isPediatric ? 'Child' : 'Adult';
  const genericTitle = `${ageGroup} Patient - ${this.specialty} Case`;

  return {
    id: this.caseId,
    title: genericTitle, // Use generic title instead of diagnostic title
    originalTitle: this.title, // Keep original for admin/debugging
    specialty: this.specialty,
    difficulty: this.difficulty,
    programArea: this.programArea,
    tags: safeTags, // Only non-diagnostic tags
    location: this.location,
    patientInfo: {
      name: this.patientPersona.name,
      age: this.patientPersona.age,
      gender: this.patientPersona.gender,
      occupation: this.patientPersona.occupation,
      chiefComplaint: this.patientPersona.chiefComplaint,
      emotionalTone: this.patientPersona.emotionalTone,
      backgroundStory: this.patientPersona.backgroundStory
    },
    description: this.description,
    version: this.version,
    hasGuardian: this.isPediatric,
    guardianInfo: this.isPediatric ? {
      relationship: this.patientPersona.speaksFor || 'Parent/Guardian',
      patientAge: this.patientPersona.age
    } : null
  };
});

// Static method to get filter options
templateCaseSchema.statics.getFilterOptions = async function() {
  const pipeline = [
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        programAreas: { $addToSet: '$programArea' },
        specialties: { $addToSet: '$specialty' },
        difficulties: { $addToSet: '$difficulty' },
        locations: { $addToSet: '$location' },
        allTags: { $push: '$tags' }
      }
    },
    {
      $project: {
        _id: 0,
        programAreas: 1,
        specialties: 1,
        difficulties: 1,
        locations: 1,
        tags: {
          $reduce: {
            input: '$allTags',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    programAreas: [],
    specialties: [],
    difficulties: [],
    locations: [],
    tags: []
  };
};

// Static method to search cases
templateCaseSchema.statics.searchCases = function(filters = {}) {
  const query = { isActive: true };

  if (filters.programArea) {
    query.programArea = filters.programArea;
  }

  if (filters.specialty) {
    query.specialty = filters.specialty;
  }

  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }

  if (filters.location) {
    query.location = filters.location;
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { 'patientPersona.name': searchRegex },
      { 'patientPersona.chiefComplaint': searchRegex },
      { specialty: searchRegex },
      { 'patientPersona.occupation': searchRegex },
      { 'patientPersona.emotionalTone': searchRegex },
      { location: searchRegex }
      // Removed title and tags from search to avoid diagnostic hints
    ];
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Pre-save middleware to update timestamps
templateCaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TemplateCase = mongoose.model('TemplateCase', templateCaseSchema);

module.exports = TemplateCase;