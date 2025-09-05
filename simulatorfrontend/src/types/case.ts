export interface ContributedCase {
  _id: string;
  title: string;
  contributorId: string;
  contributorName: string;
  contributorEmail: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'needs_revision';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  revisionRequests: Array<{
    field: string;
    comment: string;
    requestedAt: Date;
  }>;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reviewDeadline?: Date;
  reviewPriority?: 'low' | 'medium' | 'high' | 'urgent';
  reviewScore?: number;
  qualityRating?: number;
  educationalValueRating?: number;
  clinicalAccuracyRating?: number;
  communicationRating?: number;
  culturalAppropriatenessRating?: number;
  caseData: {
    version: string;
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
      is_pediatric?: boolean;
      pediatric_threshold?: number;
      guardian?: {
        name?: string;
        relationship?: string;
        age?: number;
        occupation?: string;
        emotional_state?: string;
        background_info?: string;
        communication_style?: string;
      };
    };
    initial_prompt: string;
    clinical_dossier: {
      comment: string;
      hidden_diagnosis: string;
      history_of_presenting_illness: {
        onset?: string;
        location?: string;
        radiation?: string;
        character?: string;
        severity?: number;
        timing_and_duration?: string;
        exacerbating_factors?: string;
        relieving_factors?: string;
        associated_symptoms?: string[];
      };
      review_of_systems: {
        positive?: string[];
        negative?: string[];
      };
      past_medical_history?: string[];
      medications?: string[];
      allergies?: string[];
      surgical_history?: string[];
      family_history?: string[];
      social_history: {
        smoking_status?: string;
        alcohol_use?: string;
        substance_use?: string;
        diet_and_exercise?: string;
        living_situation?: string;
      };
    };
    simulation_triggers: {
      end_session?: {
        condition_keyword?: string;
        patient_response?: string;
      };
      invalid_input?: {
        response?: string;
      };
    };
    evaluation_criteria: Record<string, string>;
  };
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  reviewRound?: number;
  totalReviewTime?: number;
  lastReviewStartedAt?: Date;
  lastReviewCompletedAt?: Date;
}