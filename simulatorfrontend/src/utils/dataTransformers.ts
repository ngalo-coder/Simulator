/**
 * Data transformation utilities to convert between frontend and backend data formats
 */

// Transform backend case data to frontend PatientCase format
export function transformCaseFromBackend(backendCase: any): any {
  return {
    id: backendCase._id || backendCase.id,
    version: backendCase.version || 1,
    description: backendCase.description || '',
    system_instruction: backendCase.system_instruction || '',
    case_metadata: {
      case_id: backendCase.case_metadata?.case_id || backendCase.id || '',
      title: backendCase.case_metadata?.title || '',
      specialty: backendCase.case_metadata?.specialty || '',
      program_area: backendCase.case_metadata?.program_area || 'Basic Program',
      module: backendCase.case_metadata?.module,
      difficulty: backendCase.case_metadata?.difficulty || 'Intermediate',
      tags: backendCase.case_metadata?.tags || [],
      location: backendCase.case_metadata?.location || ''
    },
    patient_persona: {
      name: backendCase.patient_persona?.name || 'Virtual Patient',
      age: backendCase.patient_persona?.age || 0,
      gender: backendCase.patient_persona?.gender || '',
      occupation: backendCase.patient_persona?.occupation,
      chief_complaint: backendCase.patient_persona?.chief_complaint || '',
      emotional_tone: backendCase.patient_persona?.emotional_tone || 'Neutral',
      background_story: backendCase.patient_persona?.background_story,
      speaks_for: backendCase.patient_persona?.speaks_for,
      patient_is_present: backendCase.patient_persona?.patient_is_present,
      patient_age_for_communication: backendCase.patient_persona?.patient_age_for_communication,
      is_pediatric: backendCase.patient_persona?.is_pediatric,
      guardian: backendCase.patient_persona?.guardian
    },
    initial_prompt: backendCase.initial_prompt || '',
    clinical_dossier: {
      comment: backendCase.clinical_dossier?.comment,
      hidden_diagnosis: backendCase.clinical_dossier?.hidden_diagnosis || '',
      history_of_presenting_illness: backendCase.clinical_dossier?.history_of_presenting_illness,
      review_of_systems: backendCase.clinical_dossier?.review_of_systems,
      past_medical_history: backendCase.clinical_dossier?.past_medical_history || [],
      medications: backendCase.clinical_dossier?.medications || [],
      allergies: backendCase.clinical_dossier?.allergies || [],
      surgical_history: backendCase.clinical_dossier?.surgical_history || [],
      family_history: backendCase.clinical_dossier?.family_history || [],
      social_history: backendCase.clinical_dossier?.social_history
    },
    simulation_triggers: {
      end_session: backendCase.simulation_triggers?.end_session || { condition_keyword: 'end', patient_response: 'Thank you for your help.' },
      invalid_input: backendCase.simulation_triggers?.invalid_input || { condition_keyword: 'invalid', patient_response: 'I don\'t understand.' }
    },
    evaluation_criteria: backendCase.evaluation_criteria || {},
    nursing_diagnoses: backendCase.nursing_diagnoses || [],
    nursing_interventions: backendCase.nursing_interventions || [],
    nursing_outcomes: backendCase.nursing_outcomes || [],
    multimediaContent: backendCase.multimediaContent || [],
    categories: backendCase.categories || [],
    tags: backendCase.tags || [],
    status: backendCase.status || 'draft',
    createdBy: backendCase.createdBy || '',
    lastModifiedBy: backendCase.lastModifiedBy,
    createdAt: new Date(backendCase.createdAt || Date.now()),
    updatedAt: new Date(backendCase.updatedAt || Date.now())
  };
}

// Transform backend user data to frontend User format
export function transformUserFromBackend(backendUser: any): any {
  return {
    id: backendUser._id || backendUser.id,
    username: backendUser.username || '',
    email: backendUser.email || '',
    role: backendUser.primaryRole === 'admin' ? 'admin' : 'user'
  };
}

// Transform backend session data to frontend SimulationSession format
export function transformSessionFromBackend(backendSession: any): any {
  return {
    sessionId: backendSession._id || backendSession.sessionId,
    caseId: backendSession.case_ref || backendSession.caseId,
    messages: (backendSession.history || []).map((msg: any) => ({
      role: msg.role === 'Clinician' ? 'user' : 'assistant',
      content: msg.content || '',
      timestamp: new Date(msg.timestamp || Date.now()),
      speaks_for: msg.speaks_for
    })),
    isActive: !backendSession.sessionEnded
  };
}

// Transform backend performance data to frontend PerformanceData format
export function transformPerformanceFromBackend(backendPerformance: any): any {
  return {
    overallStats: {
      totalEvaluations: backendPerformance.totalEvaluations || 0,
      excellentCount: backendPerformance.excellentCount || 0,
      goodCount: backendPerformance.goodCount || 0,
      needsImprovementCount: backendPerformance.needsImprovementCount || 0,
      excellentRate: backendPerformance.excellentRate || '0%'
    },
    specialtyStats: backendPerformance.specialtyStats || {},
    contributorStatus: {
      isEligible: backendPerformance.isEligible || false,
      eligibleSpecialties: backendPerformance.eligibleSpecialties || [],
      qualificationDate: backendPerformance.qualificationDate ? new Date(backendPerformance.qualificationDate) : undefined
    },
    contributionStats: {
      totalSubmissions: backendPerformance.totalSubmissions || 0,
      approvedSubmissions: backendPerformance.approvedSubmissions || 0,
      rejectedSubmissions: backendPerformance.rejectedSubmissions || 0,
      pendingSubmissions: backendPerformance.pendingSubmissions || 0
    },
    recentEvaluations: (backendPerformance.recentEvaluations || []).map((evaluation: any) => ({
      caseTitle: evaluation.caseTitle || '',
      specialty: evaluation.specialty || '',
      rating: evaluation.rating || '',
      score: evaluation.score || 0,
      completedAt: new Date(evaluation.completedAt || Date.now())
    }))
  };
}

// Transform frontend case data to backend format for API calls
export function transformCaseToBackend(frontendCase: any): any {
  return {
    case_metadata: {
      case_id: frontendCase.id,
      title: frontendCase.title,
      specialty: frontendCase.specialized_area,
      program_area: frontendCase.program_area,
      difficulty: 'Intermediate', // Default value
      tags: frontendCase.tags || []
    },
    patient_persona: {
      name: 'Virtual Patient', // Default value
      age: frontendCase.patient_age,
      gender: frontendCase.patient_gender,
      chief_complaint: frontendCase.chief_complaint,
      associated_symptoms: frontendCase.presenting_symptoms || []
    },
    description: frontendCase.description,
    initial_prompt: `Patient presents with ${frontendCase.chief_complaint}`,
    clinical_dossier: {
      hidden_diagnosis: 'To be determined',
      history_of_presenting_illness: {
        onset: 'Recent',
        character: 'Variable',
        severity: 5,
        timing_and_duration: 'Ongoing'
      }
    },
    simulation_triggers: {
      end_session: {
        condition_keyword: 'end',
        patient_response: 'Thank you for the consultation.'
      }
    },
    evaluation_criteria: {
      clinical_reasoning: 'Good',
      communication: 'Good'
    }
  };
}

// Transform frontend user data to backend format for API calls
export function transformUserToBackend(frontendUser: any): any {
  return {
    username: frontendUser.username,
    email: frontendUser.email,
    password: 'tempPassword123', // This should be handled separately
    primaryRole: frontendUser.role === 'admin' ? 'admin' : 'student',
    discipline: 'medicine', // Default value
    profile: {
      firstName: frontendUser.firstName || 'Unknown',
      lastName: frontendUser.lastName || 'User',
      institution: frontendUser.institution || 'Unknown'
    }
  };
}

// Utility function to safely access nested properties
export function safeAccess(obj: any, path: string, defaultValue: any = null): any {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
}

// Utility function to transform arrays of data
export function transformArrayFromBackend<T>(
  backendArray: any[],
  transformer: (item: any) => T
): T[] {
  if (!Array.isArray(backendArray)) {
    return [];
  }
  return backendArray.map(transformer);
}

// Utility function to handle API response data extraction
export function extractApiData<T>(response: any): T {
  if (response && response.data) {
    return response.data;
  }
  return response as T;
}

// Utility function to handle API error responses
export function extractApiError(response: any): string {
  if (response && response.message) {
    return response.message;
  }
  if (response && response.error) {
    return response.error;
  }
  return 'An unknown error occurred';
}