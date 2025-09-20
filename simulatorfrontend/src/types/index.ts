export interface User {
  id: string;
  username: string;
  email: string;
  primaryRole: 'student' | 'educator' | 'admin';
  discipline: 'medicine' | 'nursing' | 'laboratory' | 'radiology' | 'pharmacy';
  profile: {
    firstName: string;
    lastName: string;
    institution: string;
    specialization?: string;
    yearOfStudy?: number;
    competencyLevel?: 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
  };
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientCase {
  id: string;
  version: number;
  description: string;
  system_instruction: string;
  case_metadata: {
    case_id: string;
    title: string;
    specialty: string;
    program_area: 'Basic Program' | 'Specialty Program';
    module?: string;
    difficulty: 'Easy' | 'Intermediate' | 'Hard';
    tags: string[];
    location: string;
  };
  patient_persona: {
    name: string;
    age: number;
    gender: string;
    occupation?: string;
    chief_complaint: string;
    emotional_tone: string;
    background_story?: string;
    speaks_for?: string;
    patient_is_present?: boolean;
    patient_age_for_communication?: number;
    is_pediatric?: boolean;
    guardian?: {
      name: string;
      relationship: string;
      age: number;
      occupation?: string;
      emotional_state: string;
      background_info?: string;
      communication_style: string;
    };
  };
  initial_prompt: string;
  clinical_dossier: {
    comment?: string;
    hidden_diagnosis: string;
    history_of_presenting_illness?: {
      onset: string;
      location: string;
      radiation: string;
      character: string;
      severity: number;
      timing_and_duration: string;
      exacerbating_factors: string;
      relieving_factors: string;
      associated_symptoms: string[];
    };
    review_of_systems?: {
      comment: string;
      positive: string[];
      negative: string[];
    };
    past_medical_history: string[];
    medications: string[];
    allergies: string[];
    surgical_history: string[];
    family_history: string[];
    social_history: {
      smoking_status: string;
      alcohol_use: string;
      substance_use: string;
      diet_and_exercise: string;
      living_situation: string;
    };
  };
  simulation_triggers: {
    end_session: {
      condition_keyword: string;
      patient_response: string;
    };
    invalid_input: {
      condition_keyword: string;
      patient_response: string;
    };
  };
  evaluation_criteria: Record<string, any>;
  nursing_diagnoses?: Array<{
    diagnosis: string;
    related_factors: string[];
    defining_characteristics: string[];
    priority: 'High' | 'Medium' | 'Low';
    nanda_code?: string;
  }>;
  nursing_interventions?: Array<{
    intervention: string;
    category: string;
    description?: string;
    nic_code?: string;
    parameters: string[];
    expected_outcomes: string[];
  }>;
  nursing_outcomes?: Array<{
    outcome: string;
    indicators: string[];
    measurement_scale?: string;
    noc_code?: string;
  }>;
  multimediaContent?: Array<{
    fileId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    type: 'image' | 'video' | 'audio' | 'document';
    category: string;
    description?: string;
    tags: string[];
    uploadedBy: string;
    uploadedAt: Date;
    isActive: boolean;
    metadata?: Record<string, any>;
  }>;
  categories: string[];
  tags: string[];
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived' | 'rejected';
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimulationSession {
  sessionId: string;
  caseId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    speaks_for?: string;
  }>;
  isActive: boolean;
}

export interface PerformanceData {
  overallStats: {
    totalEvaluations: number;
    excellentCount: number;
    goodCount: number;
    needsImprovementCount: number;
    excellentRate: string;
  };
  specialtyStats: Record<string, {
    totalCases: number;
    excellentCount: number;
    averageScore: number;
  }>;
  contributorStatus: {
    isEligible: boolean;
    eligibleSpecialties: string[];
    qualificationDate?: Date;
  };
  contributionStats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
  };
  recentEvaluations: Array<{
    caseTitle: string;
    specialty: string;
    rating: string;
    score: number;
    completedAt: Date;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface CaseCategories {
  program_areas: string[];
  specialties: string[];
  specialized_areas: string[];
}

export interface SessionEndResponse {
  sessionEnded: boolean;
  evaluation: string;
  history: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
}

export interface PerformanceMetrics {
  session_ref: string;
  case_ref: string;
  metrics: {
    overall_score: number;
    performance_label: string;
    clinical_reasoning: number;
    communication: number;
    efficiency: number;
    evaluation_summary: string;
  };
  raw_evaluation_text: string;
  evaluated_at: Date;
}

export interface ClinicianProgressResponse {
  userId: string;
  totalCasesCompleted: number;
  totalCasesAttempted: number;
  overallAverageScore: number;
  specialtyProgress: Array<{
    specialty: string;
    casesCompleted: number;
    averageScore: number;
    lastCompletedAt: Date;
  }>;
  recentPerformance: Array<{
    caseId: string;
    caseTitle: string;
    score: number;
    completedAt: Date;
  }>;
}

export interface ProgressRecommendation {
  recommendedCases: Array<{
    caseId: string;
    title: string;
    specialty: string;
    reason: string;
  }>;
  improvementAreas: string[];
  nextMilestones: string[];
}
