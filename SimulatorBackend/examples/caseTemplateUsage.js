/**
 * Case Template Usage Examples
 *
 * This file demonstrates how to use the Case Template API endpoints
 * for creating discipline-specific healthcare education cases.
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:3000/api';
const educatorToken = 'your-educator-jwt-token-here';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${educatorToken}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Example 1: Get All Available Templates
 * Retrieves all discipline-specific case templates
 */
async function getAllTemplates() {
  try {
    console.log('📋 Getting all available case templates...');

    const response = await apiClient.get('/case-templates');

    console.log('✅ Available Templates:');
    response.data.data.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.metadata.name}`);
      console.log(`      Discipline: ${template.discipline}`);
      console.log(`      Description: ${template.metadata.description}`);
      console.log(`      Icon: ${template.metadata.icon}`);
      console.log(`      Color: ${template.metadata.color}`);
      console.log(`      Version: ${template.metadata.version}`);
      console.log('');
    });

    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting templates:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Get Medical Case Template
 * Retrieves the comprehensive medical case template
 */
async function getMedicalTemplate() {
  try {
    console.log('🩺 Getting medical case template...');

    const response = await apiClient.get('/case-templates/medicine');

    const template = response.data.data;
    console.log('✅ Medical Case Template Structure:');
    console.log(`   Discipline: ${template.discipline}`);
    console.log(`   Template Name: ${template.metadata.name}`);

    console.log('\n📋 Template Sections:');
    console.log('   • Case Metadata (title, specialty, difficulty, duration, objectives)');
    console.log('   • Patient Persona (demographics, chief complaint, history)');
    console.log('   • Clinical Dossier (HPI, ROS, physical exam, diagnostics, diagnosis)');
    console.log('   • Evaluation Criteria (history taking, examination, reasoning, treatment)');

    console.log('\n🎯 Evaluation Criteria:');
    Object.entries(template.template.evaluation_criteria).forEach(([criterion, details]) => {
      console.log(
        `   ${criterion}: ${(details.weight * 100).toFixed(0)}% weight, max ${
          details.max_score
        } points`
      );
    });

    return template;
  } catch (error) {
    console.error('❌ Error getting medical template:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Get Nursing Case Template
 * Retrieves the nursing-specific case template
 */
async function getNursingTemplate() {
  try {
    console.log('💙 Getting nursing case template...');

    const response = await apiClient.get('/case-templates/nursing');

    const template = response.data.data;
    console.log('✅ Nursing Case Template Structure:');
    console.log(`   Discipline: ${template.discipline}`);
    console.log(`   Template Name: ${template.metadata.name}`);

    console.log('\n📋 Nursing-Specific Sections:');
    console.log('   • Nursing Assessment (pain, vital signs, systems review)');
    console.log('   • Nursing Diagnoses');
    console.log('   • Care Plan (interventions, safety, monitoring, education)');
    console.log('   • Medication Administration');
    console.log('   • Patient Safety (fall risk, pressure ulcers, infection control)');

    console.log('\n🎯 Evaluation Criteria:');
    Object.entries(template.template.evaluation_criteria).forEach(([criterion, details]) => {
      console.log(`   ${criterion}: ${(details.weight * 100).toFixed(0)}% weight`);
    });

    return template;
  } catch (error) {
    console.error('❌ Error getting nursing template:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 4: Get Laboratory Case Template
 * Retrieves the laboratory-specific case template
 */
async function getLaboratoryTemplate() {
  try {
    console.log('🧪 Getting laboratory case template...');

    const response = await apiClient.get('/case-templates/laboratory');

    const template = response.data.data;
    console.log('✅ Laboratory Case Template Structure:');
    console.log(`   Discipline: ${template.discipline}`);
    console.log(`   Template Name: ${template.metadata.name}`);

    console.log('\n📋 Laboratory-Specific Sections:');
    console.log('   • Specimen Information (type, collection, transport, quality)');
    console.log('   • Test Requests (ordered tests, priorities, instructions)');
    console.log('   • Pre-analytical Phase (processing, quality checks, storage)');
    console.log('   • Analytical Phase (instrumentation, calibration, QC, procedures)');
    console.log('   • Post-analytical Phase (verification, critical values, reporting)');

    return template;
  } catch (error) {
    console.error('❌ Error getting laboratory template:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 5: Get Radiology Case Template
 * Retrieves the radiology-specific case template
 */
async function getRadiologyTemplate() {
  try {
    console.log('📡 Getting radiology case template...');

    const response = await apiClient.get('/case-templates/radiology');

    const template = response.data.data;
    console.log('✅ Radiology Case Template Structure:');
    console.log(`   Discipline: ${template.discipline}`);
    console.log(`   Template Name: ${template.metadata.name}`);

    console.log('\n📋 Radiology-Specific Sections:');
    console.log('   • Imaging Study (modality, technique, quality assessment)');
    console.log('   • Systematic Review (anatomical structures, findings, measurements)');
    console.log('   • Imaging Findings (primary, secondary, incidental)');
    console.log('   • Differential Diagnosis');
    console.log('   • Radiation Safety (dose considerations, justification)');

    return template;
  } catch (error) {
    console.error('❌ Error getting radiology template:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Get Pharmacy Case Template
 * Retrieves the pharmacy-specific case template
 */
async function getPharmacyTemplate() {
  try {
    console.log('💊 Getting pharmacy case template...');

    const response = await apiClient.get('/case-templates/pharmacy');

    const template = response.data.data;
    console.log('✅ Pharmacy Case Template Structure:');
    console.log(`   Discipline: ${template.discipline}`);
    console.log(`   Template Name: ${template.metadata.name}`);

    console.log('\n📋 Pharmacy-Specific Sections:');
    console.log('   • Medication History (current meds, changes, OTC, adherence)');
    console.log('   • Medical Conditions (diagnoses, allergies, ADRs)');
    console.log('   • Prescription Review (new prescriptions, refills, issues)');
    console.log('   • Drug Therapy Problems (indication, effectiveness, safety)');
    console.log('   • Drug Interactions (drug-drug, drug-food, drug-disease)');
    console.log('   • Patient Counseling (education, administration, monitoring)');

    return template;
  } catch (error) {
    console.error('❌ Error getting pharmacy template:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 7: Create Medical Case from Template
 * Demonstrates creating a complete medical case using the template
 */
async function createMedicalCase() {
  try {
    console.log('🩺 Creating medical case from template...');

    const customData = {
      case_metadata: {
        title: 'Acute Myocardial Infarction - Emergency Department',
        subspecialty: 'emergency_medicine',
        difficulty: 'intermediate',
        estimated_duration: 45,
        learning_objectives: [
          'Recognize signs and symptoms of acute MI',
          'Order appropriate diagnostic tests',
          'Initiate evidence-based treatment',
          'Manage complications',
        ],
        keywords: ['chest pain', 'STEMI', 'cardiac', 'emergency'],
      },
      patient_persona: {
        name: 'Robert Johnson',
        age: 58,
        gender: 'male',
        occupation: 'Construction foreman',
        chief_complaint: 'Severe chest pain radiating to left arm',
        emotional_tone: 'anxious',
        medical_history: ['Hypertension', 'Hyperlipidemia', 'Type 2 Diabetes'],
        medications: ['Lisinopril 10mg daily', 'Atorvastatin 40mg daily', 'Metformin 1000mg BID'],
        allergies: ['NKDA'],
        social_history: {
          smoking: '1 pack per day for 30 years',
          alcohol: 'Occasional beer on weekends',
          drugs: 'Denies',
          occupation_details: 'Heavy physical labor, high stress job',
        },
        family_history: ['Father died of MI at age 62', 'Mother has diabetes'],
      },
      clinical_dossier: {
        history_of_presenting_illness: {
          onset: 'Sudden onset 2 hours ago',
          duration: '2 hours, constant',
          character: 'Crushing, pressure-like',
          location: 'Substernal',
          radiation: 'Left arm and jaw',
          associated_symptoms: ['Diaphoresis', 'Nausea', 'Shortness of breath'],
          aggravating_factors: ['Movement', 'Deep breathing'],
          relieving_factors: ['None, no relief with rest'],
          severity: 9,
          timing: 'Constant since onset',
        },
        physical_examination: {
          vital_signs: {
            blood_pressure: '160/95 mmHg',
            heart_rate: '110 bpm',
            respiratory_rate: '22/min',
            temperature: '98.6°F',
            oxygen_saturation: '94% on room air',
            pain_score: '9/10',
          },
          general_appearance: 'Anxious, diaphoretic male in moderate distress',
          cardiovascular: 'Tachycardic, regular rhythm, no murmurs, rubs, or gallops',
          respiratory: 'Tachypneic, bilateral crackles at bases',
          abdominal: 'Soft, non-tender, no organomegaly',
        },
        hidden_diagnosis: 'ST-elevation myocardial infarction (STEMI) - anterior wall',
        differential_diagnosis: [
          'STEMI',
          'NSTEMI',
          'Unstable angina',
          'Aortic dissection',
          'Pulmonary embolism',
        ],
        treatment_plan: {
          immediate: ['Oxygen therapy', 'IV access', 'Cardiac monitoring', 'Pain management'],
          medications: ['Aspirin 325mg', 'Clopidogrel 600mg', 'Atorvastatin 80mg', 'Metoprolol'],
          procedures: ['Emergency cardiac catheterization', 'Primary PCI'],
          monitoring: ['Continuous cardiac monitoring', 'Serial ECGs', 'Troponin levels'],
        },
      },
    };

    const response = await apiClient.post('/case-templates/medicine/create', customData);

    console.log('✅ Medical case created successfully:');
    console.log(`   Case ID: ${response.data.data.case_metadata.case_id}`);
    console.log(`   Title: ${response.data.data.case_metadata.title}`);
    console.log(
      `   Patient: ${response.data.data.patient_persona.name}, ${response.data.data.patient_persona.age}yo ${response.data.data.patient_persona.gender}`
    );
    console.log(`   Chief Complaint: ${response.data.data.patient_persona.chief_complaint}`);
    console.log(`   Difficulty: ${response.data.data.case_metadata.difficulty}`);
    console.log(`   Duration: ${response.data.data.case_metadata.estimated_duration} minutes`);

    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating medical case:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 8: Create Nursing Case from Template
 * Demonstrates creating a nursing case with patient care focus
 */
async function createNursingCase() {
  try {
    console.log('💙 Creating nursing case from template...');

    const customData = {
      case_metadata: {
        title: 'Post-Operative Hip Replacement Care',
        subspecialty: 'orthopedic_nursing',
        difficulty: 'intermediate',
        estimated_duration: 40,
        learning_objectives: [
          'Perform comprehensive post-operative assessment',
          'Implement fall prevention strategies',
          'Manage post-operative pain',
          'Provide patient education for mobility',
        ],
      },
      patient_persona: {
        name: 'Margaret Thompson',
        age: 72,
        gender: 'female',
        admission_reason: 'Post-operative monitoring after total hip replacement',
        emotional_tone: 'concerned',
        medical_history: ['Osteoarthritis', 'Hypertension', 'Osteoporosis'],
        current_medications: ['Amlodipine 5mg daily', 'Calcium carbonate 1200mg daily'],
        support_system: {
          family_present: true,
          primary_caregiver: 'Daughter lives nearby',
          cultural_considerations: 'Prefers female caregivers when possible',
        },
        mobility_status: 'Limited mobility, using walker',
        cognitive_status: 'Alert and oriented x3',
      },
      clinical_dossier: {
        nursing_assessment: {
          primary_concern: 'Post-operative pain and mobility limitations',
          pain_assessment: {
            location: 'Right hip surgical site',
            intensity: 6,
            character: 'Aching, sharp with movement',
            frequency: 'Constant with exacerbations',
            triggers: ['Movement', 'Weight bearing'],
          },
        },
        nursing_diagnoses: [
          'Acute pain related to surgical incision',
          'Impaired physical mobility related to surgical procedure',
          'Risk for falls related to altered mobility and medication effects',
        ],
        care_plan: {
          priority_interventions: [
            'Pain assessment and management',
            'Mobility assistance and physical therapy',
            'Fall prevention measures',
            'Wound care and infection prevention',
          ],
          safety_measures: [
            'Bed in low position with side rails up',
            'Call light within reach',
            'Non-slip socks',
            'Clear pathways',
          ],
          patient_education: [
            'Hip precautions',
            'Safe transfer techniques',
            'Signs of infection to report',
            'Importance of early mobilization',
          ],
        },
      },
    };

    const response = await apiClient.post('/case-templates/nursing/create', customData);

    console.log('✅ Nursing case created successfully:');
    console.log(`   Case ID: ${response.data.data.case_metadata.case_id}`);
    console.log(`   Title: ${response.data.data.case_metadata.title}`);
    console.log(
      `   Patient: ${response.data.data.patient_persona.name}, ${response.data.data.patient_persona.age}yo ${response.data.data.patient_persona.gender}`
    );
    console.log(`   Admission Reason: ${response.data.data.patient_persona.admission_reason}`);

    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating nursing case:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 9: Validate Case Data
 * Demonstrates case data validation against template requirements
 */
async function validateCaseData() {
  try {
    console.log('✅ Validating case data against template...');

    // Example of valid case data
    const validCaseData = {
      case_metadata: {
        title: 'Blood Culture Contamination Investigation',
        specialty: 'laboratory',
        difficulty: 'intermediate',
      },
      patient_persona: {
        name: 'Sample Patient',
        age: 45,
        clinical_information: 'Suspected sepsis',
      },
      clinical_dossier: {
        specimen_information: {
          specimen_type: 'Blood culture',
          collection_method: 'Venipuncture',
          collection_time: '08:30 AM',
        },
        test_requests: {
          ordered_tests: ['Blood culture', 'Gram stain'],
          test_priorities: ['STAT'],
        },
      },
    };

    const response = await apiClient.post('/case-templates/laboratory/validate', validCaseData);

    console.log('✅ Validation Results:');
    console.log(`   Valid: ${response.data.data.isValid}`);
    console.log(`   Errors: ${response.data.data.errors.length}`);
    console.log(`   Warnings: ${response.data.data.warnings.length}`);

    if (response.data.data.errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      response.data.data.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (response.data.data.warnings.length > 0) {
      console.log('\n⚠️ Validation Warnings:');
      response.data.data.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    return response.data.data;
  } catch (error) {
    console.error('❌ Error validating case data:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 10: Get Template Field Structure
 * Demonstrates retrieving the field structure for form building
 */
async function getTemplateFields() {
  try {
    console.log('📋 Getting template field structure...');

    const response = await apiClient.get('/case-templates/pharmacy/fields');

    console.log('✅ Pharmacy Template Fields:');
    console.log(`   Discipline: ${response.data.data.discipline}`);
    console.log(`   Total Fields: ${Object.keys(response.data.data.fields).length}`);

    console.log('\n📝 Sample Fields:');
    const sampleFields = Object.entries(response.data.data.fields).slice(0, 10);
    sampleFields.forEach(([fieldPath, fieldInfo]) => {
      console.log(`   ${fieldPath}: ${fieldInfo.type} (required: ${fieldInfo.required})`);
    });

    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting template fields:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main demonstration function
 * Runs through various case template features
 */
async function demonstrateCaseTemplates() {
  console.log('📋 Case Template API Demonstration\n');
  console.log('='.repeat(60));

  try {
    // 1. Get all templates
    await getAllTemplates();
    console.log('\n' + '-'.repeat(60) + '\n');

    // 2. Get specific templates
    await getMedicalTemplate();
    console.log('\n' + '-'.repeat(60) + '\n');

    await getNursingTemplate();
    console.log('\n' + '-'.repeat(60) + '\n');

    // 3. Create cases from templates
    await createMedicalCase();
    console.log('\n' + '-'.repeat(60) + '\n');

    await createNursingCase();
    console.log('\n' + '-'.repeat(60) + '\n');

    // 4. Validate case data
    await validateCaseData();
    console.log('\n' + '-'.repeat(60) + '\n');

    // 5. Get template fields
    await getTemplateFields();
    console.log('\n' + '-'.repeat(60) + '\n');

    console.log('✅ Case Template demonstration completed successfully!');
  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
  }
}

// Export functions for use in other modules
export {
  getAllTemplates,
  getMedicalTemplate,
  getNursingTemplate,
  getLaboratoryTemplate,
  getRadiologyTemplate,
  getPharmacyTemplate,
  createMedicalCase,
  createNursingCase,
  validateCaseData,
  getTemplateFields,
  demonstrateCaseTemplates,
};

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateCaseTemplates();
}
