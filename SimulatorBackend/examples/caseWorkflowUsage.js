/**
 * Case Creation Workflow Usage Examples
 * 
 * This file demonstrates how to use the Case Creation Workflow API endpoints
 * for guided case creation with template selection, validation, draft saving,
 * and collaborative editing.
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:3000/api';
const educatorToken = 'your-educator-jwt-token-here';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${educatorToken}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example 1: Initialize Case Creation Workflow
 * Start a new case creation workflow for a specific discipline
 */
async function initializeCaseWorkflow(discipline = 'medicine') {
  try {
    console.log(`🚀 Initializing case creation workflow for ${discipline}...`);
    
    const response = await apiClient.post('/case-workflow/initialize', {
      discipline: discipline
    });
    
    const workflowData = response.data.data;
    console.log('✅ Workflow initialized successfully:');
    console.log(`   Draft ID: ${workflowData.draftId}`);
    console.log(`   Discipline: ${workflowData.discipline}`);
    console.log(`   Current Step: ${workflowData.currentStep}`);
    console.log(`   Status: ${workflowData.status}`);
    
    console.log('\n📋 Workflow Steps:');
    workflowData.workflowSteps.forEach((step, index) => {
      const required = step.required ? '(Required)' : '(Optional)';
      console.log(`   ${index + 1}. ${step.name} ${required}`);
      console.log(`      ${step.description}`);
      console.log(`      Estimated time: ${step.estimatedTime} minutes`);
      console.log('');
    });
    
    return workflowData;
  } catch (error) {
    console.error('❌ Error initializing workflow:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Complete Basic Information Step
 * Fill in case metadata and basic information
 */
async function completeBasicInfoStep(draftId) {
  try {
    console.log('📝 Completing basic information step...');
    
    const stepData = {
      case_metadata: {
        title: 'Acute Myocardial Infarction - Emergency Department Case',
        subspecialty: 'emergency_medicine',
        difficulty: 'intermediate',
        estimated_duration: 45,
        learning_objectives: [
          'Recognize signs and symptoms of acute MI',
          'Order appropriate diagnostic tests (ECG, cardiac enzymes)',
          'Initiate evidence-based treatment protocols',
          'Manage potential complications',
          'Communicate effectively with patient and family'
        ],
        keywords: ['chest pain', 'STEMI', 'cardiac emergency', 'thrombolysis'],
        case_type: 'clinical_case',
        location: 'emergency_department'
      },
      description: 'A comprehensive case study focusing on the rapid assessment and management of a patient presenting with acute ST-elevation myocardial infarction in the emergency department setting.',
      system_instruction: 'You are an emergency medicine physician evaluating a patient with acute chest pain. Focus on rapid assessment, appropriate diagnostic workup, and timely intervention.'
    };
    
    const response = await apiClient.put(`/case-workflow/drafts/${draftId}/steps/basic_info`, stepData);
    
    if (response.data.success) {
      console.log('✅ Basic information step completed successfully');
      console.log(`   Current Step: ${response.data.data.currentStep}`);
      console.log(`   Status: ${response.data.data.status}`);
      
      if (response.data.data.validation.warnings.length > 0) {
        console.log('\n⚠️ Validation Warnings:');
        response.data.data.validation.warnings.forEach(warning => {
          console.log(`   • ${warning}`);
        });
      }
    } else {
      console.log('❌ Validation failed:');
      response.data.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error completing basic info step:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Complete Patient Persona Step
 * Define patient demographics and presentation
 */
async function completePatientPersonaStep(draftId) {
  try {
    console.log('👤 Completing patient persona step...');
    
    const stepData = {
      patient_persona: {
        name: 'Robert Johnson',
        age: 58,
        gender: 'male',
        occupation: 'Construction foreman',
        chief_complaint: 'Severe chest pain radiating to left arm and jaw',
        emotional_tone: 'anxious and concerned',
        medical_history: [
          'Hypertension (diagnosed 5 years ago)',
          'Hyperlipidemia (on statin therapy)',
          'Type 2 Diabetes Mellitus (well-controlled)',
          'Former smoker (quit 2 years ago)'
        ],
        medications: [
          'Lisinopril 10mg daily',
          'Atorvastatin 40mg daily',
          'Metformin 1000mg twice daily',
          'Aspirin 81mg daily'
        ],
        allergies: ['NKDA (No Known Drug Allergies)'],
        social_history: {
          smoking: 'Former smoker - 1 pack per day for 30 years, quit 2 years ago',
          alcohol: 'Occasional beer on weekends (2-3 drinks per week)',
          drugs: 'Denies illicit drug use',
          occupation_details: 'Heavy physical labor, high-stress supervisory role'
        },
        family_history: [
          'Father died of myocardial infarction at age 62',
          'Mother has diabetes and hypertension',
          'Brother has coronary artery disease'
        ]
      }
    };
    
    const response = await apiClient.put(`/case-workflow/drafts/${draftId}/steps/patient_persona`, stepData);
    
    if (response.data.success) {
      console.log('✅ Patient persona step completed successfully');
      console.log(`   Patient: ${stepData.patient_persona.name}, ${stepData.patient_persona.age}yo ${stepData.patient_persona.gender}`);
      console.log(`   Chief Complaint: ${stepData.patient_persona.chief_complaint}`);
      console.log(`   Medical History: ${stepData.patient_persona.medical_history.length} conditions`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error completing patient persona step:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 4: Complete Clinical Dossier Step
 * Add detailed clinical information
 */
async function completeClinicalDossierStep(draftId) {
  try {
    console.log('🏥 Completing clinical dossier step...');
    
    const stepData = {
      clinical_dossier: {
        history_of_presenting_illness: {
          onset: 'Sudden onset 2 hours ago while at work',
          duration: '2 hours, constant and worsening',
          character: 'Crushing, pressure-like sensation',
          location: 'Substernal chest pain',
          radiation: 'Radiating to left arm, jaw, and back',
          associated_symptoms: [
            'Diaphoresis (profuse sweating)',
            'Nausea and vomiting',
            'Shortness of breath',
            'Lightheadedness'
          ],
          aggravating_factors: ['Physical exertion', 'Deep inspiration'],
          relieving_factors: ['No relief with rest or position changes'],
          severity: 9,
          timing: 'Constant since onset, gradually worsening'
        },
        review_of_systems: {
          constitutional: ['Diaphoresis', 'Fatigue'],
          cardiovascular: ['Chest pain', 'Palpitations'],
          respiratory: ['Shortness of breath'],
          gastrointestinal: ['Nausea', 'Vomiting'],
          neurological: ['Lightheadedness'],
          psychiatric: ['Anxiety'],
          endocrine: [],
          hematologic: [],
          dermatologic: []
        },
        physical_examination: {
          vital_signs: {
            blood_pressure: '160/95 mmHg',
            heart_rate: '110 bpm (regular)',
            respiratory_rate: '22 breaths/min',
            temperature: '98.6°F (37°C)',
            oxygen_saturation: '94% on room air',
            pain_score: '9/10'
          },
          general_appearance: 'Anxious, diaphoretic male in moderate to severe distress',
          head_neck: 'Normocephalic, atraumatic, no JVD',
          cardiovascular: 'Tachycardic, regular rhythm, no murmurs, rubs, or gallops heard',
          respiratory: 'Tachypneic, bilateral fine crackles at lung bases',
          abdominal: 'Soft, non-tender, no organomegaly or masses',
          extremities: 'No peripheral edema, pulses intact',
          neurological: 'Alert and oriented x3, no focal deficits',
          skin: 'Diaphoretic, cool and clammy'
        },
        diagnostic_tests: {
          laboratory: [
            'Troponin I: Elevated (pending specific value)',
            'CK-MB: Elevated',
            'Complete Blood Count: Within normal limits',
            'Basic Metabolic Panel: Glucose 180 mg/dL',
            'Lipid Panel: Total cholesterol 240 mg/dL'
          ],
          imaging: [
            'Chest X-ray: Mild pulmonary edema',
            'Echocardiogram: Regional wall motion abnormalities'
          ],
          procedures: ['12-lead ECG: ST-elevation in leads II, III, aVF'],
          ecg: 'ST-elevation in inferior leads (II, III, aVF) with reciprocal changes in lateral leads',
          other: ['Arterial blood gas if indicated']
        },
        hidden_diagnosis: 'ST-elevation myocardial infarction (STEMI) - Inferior wall',
        differential_diagnosis: [
          'ST-elevation myocardial infarction (STEMI)',
          'Non-ST elevation myocardial infarction (NSTEMI)',
          'Unstable angina',
          'Aortic dissection',
          'Pulmonary embolism',
          'Pericarditis'
        ],
        treatment_plan: {
          immediate: [
            'Oxygen therapy (maintain SpO2 >90%)',
            'IV access (2 large bore IVs)',
            'Continuous cardiac monitoring',
            'Pain management with morphine',
            'Nitroglycerin (if BP stable)'
          ],
          medications: [
            'Aspirin 325mg chewed immediately',
            'Clopidogrel 600mg loading dose',
            'Atorvastatin 80mg daily',
            'Metoprolol 25mg BID (if hemodynamically stable)',
            'Lisinopril 5mg daily (hold if hypotensive)'
          ],
          procedures: [
            'Emergency cardiac catheterization',
            'Primary percutaneous coronary intervention (PCI)',
            'Consider thrombolytic therapy if PCI not available within 90 minutes'
          ],
          monitoring: [
            'Continuous cardiac monitoring',
            'Serial 12-lead ECGs',
            'Serial cardiac enzymes (troponin, CK-MB)',
            'Vital signs every 15 minutes initially',
            'Urine output monitoring'
          ],
          discharge_planning: [
            'Cardiac rehabilitation referral',
            'Lifestyle modification counseling',
            'Medication compliance education',
            'Follow-up with cardiology in 1-2 weeks'
          ]
        },
        prognosis: 'Good with prompt intervention; depends on extent of myocardial damage and response to treatment',
        complications: [
          'Cardiogenic shock',
          'Mechanical complications (papillary muscle rupture, ventricular septal defect)',
          'Arrhythmias (ventricular tachycardia, ventricular fibrillation)',
          'Pericarditis',
          'Reinfarction'
        ]
      }
    };
    
    const response = await apiClient.put(`/case-workflow/drafts/${draftId}/steps/clinical_dossier`, stepData);
    
    if (response.data.success) {
      console.log('✅ Clinical dossier step completed successfully');
      console.log(`   Hidden Diagnosis: ${stepData.clinical_dossier.hidden_diagnosis}`);
      console.log(`   Differential Diagnoses: ${stepData.clinical_dossier.differential_diagnosis.length} options`);
      console.log(`   Treatment Plan: ${stepData.clinical_dossier.treatment_plan.immediate.length} immediate interventions`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error completing clinical dossier step:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 5: Save Draft
 * Save current progress as draft
 */
async function saveDraft(draftId, caseData) {
  try {
    console.log('💾 Saving draft...');
    
    const response = await apiClient.post(`/case-workflow/drafts/${draftId}/save`, caseData);
    
    console.log('✅ Draft saved successfully');
    console.log(`   Draft ID: ${response.data.data.draftId}`);
    console.log(`   Saved At: ${new Date(response.data.data.savedAt).toLocaleString()}`);
    
    if (response.data.data.validation) {
      console.log(`   Validation Status: ${response.data.data.validation.isValid ? 'Valid' : 'Has Issues'}`);
      
      if (response.data.data.validation.errors.length > 0) {
        console.log('\n❌ Validation Errors:');
        response.data.data.validation.errors.forEach(error => {
          console.log(`   • ${error}`);
        });
      }
      
      if (response.data.data.validation.warnings.length > 0) {
        console.log('\n⚠️ Validation Warnings:');
        response.data.data.validation.warnings.forEach(warning => {
          console.log(`   • ${warning}`);
        });
      }
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error saving draft:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Add Collaborator
 * Add a collaborator to work on the case together
 */
async function addCollaborator(draftId, collaboratorUserId) {
  try {
    console.log('👥 Adding collaborator to draft...');
    
    const collaboratorData = {
      userId: collaboratorUserId,
      role: 'editor',
      permissions: ['read', 'write', 'share']
    };
    
    const response = await apiClient.post(`/case-workflow/drafts/${draftId}/collaborators`, collaboratorData);
    
    console.log('✅ Collaborator added successfully');
    console.log(`   Total Collaborators: ${response.data.data.collaborators.length}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error adding collaborator:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 7: Get User's Drafts
 * Retrieve all drafts for the current user
 */
async function getUserDrafts(options = {}) {
  try {
    console.log('📋 Getting user drafts...');
    
    const params = {
      page: options.page || 1,
      limit: options.limit || 20,
      status: options.status || 'all',
      discipline: options.discipline || 'all'
    };
    
    const response = await apiClient.get('/case-workflow/drafts', { params });
    
    console.log(`✅ Found ${response.data.data.drafts.length} drafts:`);
    response.data.data.drafts.forEach((draft, index) => {
      console.log(`   ${index + 1}. ${draft.title}`);
      console.log(`      Discipline: ${draft.discipline}`);
      console.log(`      Status: ${draft.status}`);
      console.log(`      Current Step: ${draft.currentStep}`);
      console.log(`      Completion: ${draft.completionPercentage}%`);
      console.log(`      Last Activity: ${new Date(draft.lastActivity).toLocaleDateString()}`);
      console.log(`      Collaborators: ${draft.collaborators}`);
      console.log('');
    });
    
    console.log(`📄 Pagination: Page ${response.data.data.pagination.page} of ${response.data.data.pagination.totalPages}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting user drafts:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 8: Get Draft Details
 * Retrieve detailed information about a specific draft
 */
async function getDraftDetails(draftId) {
  try {
    console.log(`📄 Getting draft details for ${draftId}...`);
    
    const response = await apiClient.get(`/case-workflow/drafts/${draftId}`);
    
    const draft = response.data.data;
    console.log('✅ Draft Details:');
    console.log(`   Title: ${draft.caseData.case_metadata?.title || 'Untitled'}`);
    console.log(`   Discipline: ${draft.discipline}`);
    console.log(`   Status: ${draft.status}`);
    console.log(`   Current Step: ${draft.currentStep}`);
    console.log(`   Completion: ${draft.completionPercentage}%`);
    console.log(`   Created: ${new Date(draft.createdAt).toLocaleDateString()}`);
    console.log(`   Last Updated: ${new Date(draft.updatedAt).toLocaleDateString()}`);
    console.log(`   Collaborators: ${draft.collaborators.length}`);
    
    console.log('\n📋 Workflow Progress:');
    draft.workflowSteps.forEach((step, index) => {
      const isCurrentStep = step.id === draft.currentStep;
      const status = isCurrentStep ? '👉 CURRENT' : '✅ COMPLETED';
      console.log(`   ${index + 1}. ${step.name} ${isCurrentStep ? status : ''}`);
    });
    
    return draft;
  } catch (error) {
    console.error('❌ Error getting draft details:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 9: Get Medical Terminology Suggestions
 * Get suggestions for medical terminology while writing
 */
async function getTerminologySuggestions(query, category = 'all') {
  try {
    console.log(`🔍 Getting terminology suggestions for "${query}"...`);
    
    const response = await apiClient.get('/case-workflow/terminology', {
      params: { query, category }
    });
    
    console.log(`✅ Found ${response.data.data.suggestions.length} suggestions:`);
    response.data.data.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.term} (${suggestion.category})`);
      console.log(`      Definition: ${suggestion.definition}`);
    });
    
    return response.data.data.suggestions;
  } catch (error) {
    console.error('❌ Error getting terminology suggestions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 10: Submit Case for Review
 * Submit completed case for review and approval
 */
async function submitCaseForReview(draftId) {
  try {
    console.log('📤 Submitting case for review...');
    
    const response = await apiClient.post(`/case-workflow/drafts/${draftId}/submit`);
    
    if (response.data.success) {
      console.log('✅ Case submitted for review successfully');
      console.log(`   Case ID: ${response.data.data.caseId}`);
      console.log(`   Draft ID: ${response.data.data.draftId}`);
      console.log(`   Message: ${response.data.message}`);
    } else {
      console.log('❌ Submission failed - validation errors:');
      response.data.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error submitting case for review:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Complete Case Creation Workflow Example
 * Demonstrates the full workflow from initialization to submission
 */
async function completeWorkflowExample() {
  console.log('🎓 Complete Case Creation Workflow Example\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Initialize workflow
    const workflowData = await initializeCaseWorkflow('medicine');
    const draftId = workflowData.draftId;
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Step 2: Complete basic information
    await completeBasicInfoStep(draftId);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Step 3: Complete patient persona
    await completePatientPersonaStep(draftId);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Step 4: Complete clinical dossier
    await completeClinicalDossierStep(draftId);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Step 5: Save draft
    const draftDetails = await getDraftDetails(draftId);
    await saveDraft(draftId, draftDetails.caseData);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Step 6: Get terminology suggestions
    await getTerminologySuggestions('cardiac', 'specialties');
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Step 7: Submit for review (if validation passes)
    await submitCaseForReview(draftId);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    console.log('✅ Complete workflow example finished successfully!');
    
  } catch (error) {
    console.error('❌ Workflow example failed:', error.message);
  }
}

// Export functions for use in other modules
export {
  initializeCaseWorkflow,
  completeBasicInfoStep,
  completePatientPersonaStep,
  completeClinicalDossierStep,
  saveDraft,
  addCollaborator,
  getUserDrafts,
  getDraftDetails,
  getTerminologySuggestions,
  submitCaseForReview,
  completeWorkflowExample
};

// Run complete example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeWorkflowExample();
}