// ai-patient-sim-core-services/simulation-service/src/models/PatientCase.js
const mongoose = require('mongoose');

const patientCaseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  programArea: {
    type: String,
    enum: ['internal_medicine', 'pediatrics', 'family_medicine', 'emergency_medicine', 'psychiatry', 'surgery', 'obstetrics_gynecology', 'cardiology_fellowship'],
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['student', 'resident', 'fellow'],
    required: true
  },
  patientType: {
    type: String,
    enum: ['adult', 'pediatric_with_guardian', 'adolescent_with_guardian', 'pediatric_trauma_with_guardian', 'adolescent_confidential'],
    required: true
  },
  learningObjectives: [String],
  chiefComplaint: {
    type: String,
    required: true
  },
  patientPersona: {
    patient: mongoose.Schema.Types.Mixed,
    guardian: mongoose.Schema.Types.Mixed,
    demographics: mongoose.Schema.Types.Mixed,
    medicalHistory: [String],
    socialHistory: mongoose.Schema.Types.Mixed,
    currentCondition: String,
    personality: mongoose.Schema.Types.Mixed,
    vitalSigns: mongoose.Schema.Types.Mixed,
    physicalExam: mongoose.Schema.Types.Mixed,
    culturalFactors: String
  },
  clinicalLogic: {
    expectedFindings: mongoose.Schema.Types.Mixed,
    diagnosticCriteria: [String],
    treatmentPlan: [String],
    clinicalPearls: [String],
    commonMistakes: [String]
  },
  guardianDynamics: {
    communicationStyle: String,
    consentRequirements: String,
    culturalConsiderations: [String],
    anxietyTriggers: [String],
    supportNeeds: [String]
  },
  systemPrompts: {
    patientPrompt: String,
    guardianPrompt: String,
    instructorNotes: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageStats: {
    timesUsed: {
      type: Number,
      default: 0
    },
    averageCompletionTime: Number,
    averageRating: Number,
    lastUsed: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
patientCaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
patientCaseSchema.index({ programArea: 1, difficulty: 1 });
patientCaseSchema.index({ patientType: 1 });
patientCaseSchema.index({ isActive: 1 });

module.exports = mongoose.model('PatientCase', patientCaseSchema);