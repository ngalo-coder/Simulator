export interface User {
  _id: string;
  username: string;
  email: string;
  primaryRole: 'student' | 'educator' | 'admin';
  discipline: 'medicine' | 'nursing' | 'laboratory' | 'radiology' | 'pharmacy';
  profile: {
    firstName: string;
    lastName: string;
    specialization?: string;
    yearOfStudy?: number;
    institution: string;
  };
}

export interface Case {
  _id: string;
  case_metadata: {
    case_id: string;
    title: string;
    specialty: string;
    program_area: string;
    difficulty: 'Easy' | 'Intermediate' | 'Hard';
    tags: string[];
    location: string;
  };
  patient_persona: {
    name: string;
    age: number;
    gender: string;
    chief_complaint: string;
  };
  description: string;
}

export interface StudentProgress {
  _id: string;
  userId: string;
  overallProgress: {
    totalCasesAttempted: number;
    totalCasesCompleted: number;
    totalLearningHours: number;
    overallScore: number;
    currentLevel: 'Novice' | 'Beginner' | 'Competent' | 'Proficient' | 'Expert';
  };
  competencies: Array<{
    competencyId: string;
    competencyName: string;
    proficiencyLevel: 'Novice' | 'Beginner' | 'Competent' | 'Proficient' | 'Expert';
  }>;
}

export interface Session {
  _id: string;
  case_ref: string;
  user: string;
  history: Array<{
    role: 'Clinician' | 'Patient' | 'System' | 'AI Evaluator';
    content: string;
    timestamp: Date;
  }>;
  sessionEnded: boolean;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
}

export interface RegistrationData {
  username: string;
  email: string;
  password?: string;
  primaryRole: 'student' | 'educator' | 'admin';
  discipline: 'medicine' | 'nursing' | 'laboratory' | 'radiology' | 'pharmacy';
  profile: {
    firstName: string;
    lastName: string;
    institution: string;
  };
}

export interface CaseSearchParams {
  q?: string;
  specialty?: string;
  difficulty?: 'Easy' | 'Intermediate' | 'Hard';
  page?: number;
  limit?: number;
}

export interface SimulationStartResponse {
  sessionId: string;
  initialPrompt: string;
  patientName: string;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
