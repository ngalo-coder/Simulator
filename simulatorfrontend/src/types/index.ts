export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface PatientCase {
  id: string;
  title: string;
  description: string;
  category: string;
  program_area: string;
  specialized_area: string;
  patient_age: number;
  patient_gender: string;
  chief_complaint: string;
  presenting_symptoms: string[];
  tags: string[];
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
