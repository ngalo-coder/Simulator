// ai-patient-sim-core-services/simulation-service/src/models/Simulation.js
const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['student', 'resident', 'intern', 'fellow', 'attending'],
    required: true
  },
  programArea: {
    type: String,
    enum: ['internal_medicine', 'pediatrics', 'family_medicine', 'emergency_medicine', 'psychiatry', 'surgery', 'obstetrics_gynecology', 'cardiology_fellowship'],
    required: true
  },
  caseId: {
    type: String,
    required: true
  },
  caseName: {
    type: String,
    required: true
  },
  patientPersona: {
    patient: {
      age: String,
      name: String,
      gender: String,
      presentation: String
    },
    guardian: {
      relationship: String,
      name: String,
      concerns: [String],
      culturalBackground: String,
      anxietyLevel: String
    },
    demographics: {
      ethnicity: String,
      primaryLanguage: String,
      insurance: String
    },
    medicalHistory: [String],
    currentCondition: String,
    vitalSigns: mongoose.Schema.Types.Mixed,
    personality: mongoose.Schema.Types.Mixed
  },
  conversationHistory: [{
    sender: {
      type: String,
      enum: ['student', 'patient', 'guardian', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    clinicalInfo: mongoose.Schema.Types.Mixed,
    messageType: {
      type: String,
      enum: ['chat', 'action', 'assessment', 'system_feedback'],
      default: 'chat'
    }
  }],
  clinicalActions: [{
    action: {
      type: String,
      enum: ['history_taking', 'physical_exam', 'order_labs', 'order_imaging', 'diagnosis', 'treatment_plan'],
      required: true
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    result: mongoose.Schema.Types.Mixed
  }],
  learningProgress: {
    objectivesCompleted: [String],
    clinicalSkillsAssessed: [{
      skill: String,
      competencyLevel: {
        type: String,
        enum: ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert']
      },
      assessmentDate: Date
    }],
    diagnosticAccuracy: Number,
    communicationScore: Number,
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  sessionMetrics: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    totalDuration: Number, // in minutes
    messageCount: {
      type: Number,
      default: 0
    },
    clinicalActionsCount: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  },
  difficulty: {
    type: String,
    enum: ['student', 'resident', 'fellow'],
    required: true
  },
  feedbackProvided: {
    type: Boolean,
    default: false
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
simulationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
simulationSchema.index({ userId: 1, status: 1 });
simulationSchema.index({ programArea: 1, difficulty: 1 });
simulationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Simulation', simulationSchema);