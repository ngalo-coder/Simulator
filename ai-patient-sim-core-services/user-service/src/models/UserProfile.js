// ai-patient-sim-core-services/user-service/src/models/UserProfile.js
// Extended user profile model - EXTENDS existing User model without breaking it
const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Kenya-specific academic information
  academicProfile: {
    institution: {
      type: String,
      enum: [
        'university_of_nairobi',
        'moi_university', 
        'kenyatta_university',
        'maseno_university',
        'egerton_university',
        'other'
      ]
    },
    program: {
      type: String,
      enum: ['medicine', 'nursing', 'clinical_medicine', 'pharmacy', 'dentistry'],
      required: true
    },
    currentYear: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    studentId: {
      type: String,
      required: true
    },
    expectedGraduation: {
      type: Date,
      required: true
    },
    academicStatus: {
      type: String,
      enum: ['active', 'on_leave', 'suspended', 'graduated', 'transferred'],
      default: 'active'
    }
  },

  // Enhanced role system (extends basic role)
  enhancedRole: {
    level: {
      type: Number,
      min: 1,
      max: 11,
      required: true
    },
    roleType: {
      type: String,
      enum: [
        'medical_student_year1', 'medical_student_year2', 'medical_student_year3',
        'clinical_clerk_year4', 'clinical_clerk_year5', 'clinical_clerk_year6',
        'intern', 'registrar', 'fellow', 'instructor', 'administrator'
      ],
      required: true
    },
    specialty: {
      type: String,
      enum: [
        'internal_medicine', 'pediatrics', 'surgery', 'obstetrics_gynecology',
        'psychiatry', 'family_medicine', 'emergency_medicine', 'radiology',
        'pathology', 'anesthesiology', 'orthopedics', 'ophthalmology',
        'ent', 'dermatology', 'urology', 'neurology', 'cardiology'
      ]
    },
    subspecialty: String,
    currentRotation: String
  },

  // Professional information
  professionalInfo: {
    licenseNumber: String,
    kmb_registration: String, // Kenya Medical Board
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
      credentialId: String
    }],
    currentPosition: String,
    currentEmployer: String
  },

  // Contact information
  contactInfo: {
    phoneNumber: {
      type: String,
      match: /^(\+254|0)[17]\d{8}$/ // Kenya phone format
    },
    alternateEmail: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    address: {
      county: String,
      town: String,
      postalCode: String
    }
  },

  // Learning preferences
  learningPreferences: {
    simulationType: {
      type: String,
      enum: ['template_driven', 'persona_driven', 'auto_assign'],
      default: 'auto_assign'
    },
    language: {
      type: String,
      enum: ['english', 'swahili'],
      default: 'english'
    },
    difficultyPreference: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'adaptive'],
      default: 'adaptive'
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    }
  },

  // Progression tracking
  progressionData: {
    competencyLevels: {
      clinical_skills: {
        type: String,
        enum: ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert'],
        default: 'novice'
      },
      communication: {
        type: String,
        enum: ['basic', 'developing', 'proficient', 'advanced', 'expert'],
        default: 'basic'
      },
      clinical_reasoning: {
        type: String,
        enum: ['recognition', 'interpretation', 'analysis', 'synthesis', 'evaluation'],
        default: 'recognition'
      },
      professionalism: {
        type: String,
        enum: ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert'],
        default: 'novice'
      },
      leadership: {
        type: String,
        enum: ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert'],
        default: 'novice'
      }
    },
    simulationStats: {
      totalCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastSimulationDate: Date,
      streakDays: { type: Number, default: 0 }
    },
    nextRequirements: [{
      type: String,
      description: String,
      dueDate: Date,
      completed: { type: Boolean, default: false }
    }]
  },

  // Transition history
  transitionHistory: [{
    fromRole: String,
    toRole: String,
    transitionDate: { type: Date, default: Date.now },
    transitionType: {
      type: String,
      enum: ['automatic', 'manual', 'graduation', 'transfer']
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Alumni information (if graduated)
  alumniInfo: {
    isAlumni: { type: Boolean, default: false },
    graduationDate: Date,
    degreeAwarded: String,
    currentPosition: String,
    currentEmployer: String,
    mentorshipAvailable: { type: Boolean, default: false },
    networkingConsent: { type: Boolean, default: false }
  },

  // System metadata
  metadata: {
    lastProfileUpdate: { type: Date, default: Date.now },
    profileCompleteness: { type: Number, default: 0 }, // Percentage
    dataConsent: { type: Boolean, default: false },
    privacySettings: {
      shareWithPeers: { type: Boolean, default: true },
      shareWithInstructors: { type: Boolean, default: true },
      shareForResearch: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
userProfileSchema.index({ 'enhancedRole.roleType': 1 });
userProfileSchema.index({ 'academicProfile.institution': 1 });
userProfileSchema.index({ 'academicProfile.currentYear': 1 });
userProfileSchema.index({ 'enhancedRole.specialty': 1 });

// Calculate profile completeness
userProfileSchema.methods.calculateCompleteness = function() {
  const requiredFields = [
    'academicProfile.program',
    'academicProfile.currentYear', 
    'academicProfile.studentId',
    'contactInfo.phoneNumber',
    'enhancedRole.roleType'
  ];
  
  let completed = 0;
  requiredFields.forEach(field => {
    if (this.get(field)) completed++;
  });
  
  this.metadata.profileCompleteness = Math.round((completed / requiredFields.length) * 100);
  return this.metadata.profileCompleteness;
};

// Update last profile update timestamp
userProfileSchema.pre('save', function(next) {
  this.metadata.lastProfileUpdate = new Date();
  this.calculateCompleteness();
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);