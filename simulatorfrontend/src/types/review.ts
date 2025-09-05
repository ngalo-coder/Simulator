export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReviewDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
  PENDING = 'pending'
}

export enum AnnotationType {
  COMMENT = 'comment',
  SUGGESTION = 'suggestion',
  CORRECTION = 'correction',
  QUESTION = 'question',
  HIGHLIGHT = 'highlight'
}

export interface Annotation {
  type: AnnotationType;
  fieldPath: string;
  content: string;
  suggestedValue?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface CaseReview {
  _id: string;
  caseId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerDiscipline: string;
  reviewerSpecialty: string;
  status: ReviewStatus;
  decision: ReviewDecision;
  overallFeedback?: string;
  ratings?: {
    clinicalAccuracy?: number;
    educationalValue?: number;
    completeness?: number;
    clarity?: number;
    culturalAppropriateness?: number;
  };
  annotations: Annotation[];
  timeSpent: number;
  startedAt?: Date;
  completedAt?: Date;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  revisionRound: number;
  previousReviewId?: string;
  metadata: {
    caseProgramArea?: string;
    caseSpecialty?: string;
    caseDifficulty?: string;
    contributorExperience?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}