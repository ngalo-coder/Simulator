// ai-patient-sim-core-services/simulation-service/src/services/templateCaseService.js
const fs = require('fs').promises;
const path = require('path');

class TemplateCaseService {
  constructor() {
    this.casesData = null;
    this.casesPath = path.join(__dirname, '../data/case_100.json');
  }

  /**
   * Load and parse case templates from case_100.json
   */
  async loadCases() {
    try {
      if (!this.casesData) {
        const rawData = await fs.readFile(this.casesPath, 'utf8');
        this.casesData = JSON.parse(rawData);
        console.log(`✅ Loaded ${this.casesData.length} template cases`);
      }
      return this.casesData;
    } catch (error) {
      console.error('❌ Error loading template cases:', error);
      throw new Error('Failed to load case templates');
    }
  }

  /**
   * Get all available cases with optional filtering
   */
  async getCases(filters = {}) {
    const cases = await this.loadCases();
    
    let filteredCases = cases;

    // Apply filters
    if (filters.programArea) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata.program_area === filters.programArea
      );
    }

    if (filters.specialty) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata.specialty === filters.specialty
      );
    }

    if (filters.difficulty) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata.difficulty === filters.difficulty
      );
    }

    if (filters.location) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata.location === filters.location
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredCases = filteredCases.filter(
        caseItem => filters.tags.some(tag => 
          caseItem.case_metadata.tags.includes(tag)
        )
      );
    }

    // Transform to frontend-friendly format
    return filteredCases.map(this.transformCaseForFrontend);
  }

  /**
   * Get a specific case by ID
   */
  async getCaseById(caseId) {
    const cases = await this.loadCases();
    const caseData = cases.find(caseItem => caseItem.case_metadata.case_id === caseId);
    
    if (!caseData) {
      throw new Error(`Case not found: ${caseId}`);
    }

    return caseData;
  }

  /**
   * Transform case data for frontend consumption
   */
  transformCaseForFrontend(caseData) {
    return {
      id: caseData.case_metadata.case_id,
      title: caseData.case_metadata.title,
      specialty: caseData.case_metadata.specialty,
      difficulty: caseData.case_metadata.difficulty,
      programArea: caseData.case_metadata.program_area,
      tags: caseData.case_metadata.tags,
      location: caseData.case_metadata.location,
      patientInfo: {
        name: caseData.patient_persona.name,
        age: caseData.patient_persona.age,
        gender: caseData.patient_persona.gender,
        occupation: caseData.patient_persona.occupation,
        chiefComplaint: caseData.patient_persona.chief_complaint,
        emotionalTone: caseData.patient_persona.emotional_tone
      },
      description: caseData.description,
      version: caseData.version
    };
  }

  /**
   * Get unique values for filtering
   */
  async getFilterOptions() {
    const cases = await this.loadCases();
    
    const programAreas = [...new Set(cases.map(caseItem => caseItem.case_metadata.program_area))];
    const specialties = [...new Set(cases.map(caseItem => caseItem.case_metadata.specialty))];
    const difficulties = [...new Set(cases.map(caseItem => caseItem.case_metadata.difficulty))];
    const locations = [...new Set(cases.map(caseItem => caseItem.case_metadata.location))];
    const allTags = cases.flatMap(caseItem => caseItem.case_metadata.tags);
    const tags = [...new Set(allTags)];

    return {
      programAreas,
      specialties,
      difficulties,
      locations,
      tags
    };
  }

  /**
   * Build system prompt for AI from case template
   */
  buildSystemPrompt(caseData) {
    const { patient_persona, clinical_dossier, case_metadata } = caseData;
    
    return `${caseData.system_instruction}

PATIENT PERSONA:
- Name: ${patient_persona.name}
- Age: ${patient_persona.age}
- Gender: ${patient_persona.gender}
- Occupation: ${patient_persona.occupation}
- Chief Complaint: ${patient_persona.chief_complaint}
- Emotional Tone: ${patient_persona.emotional_tone}
- Background: ${patient_persona.background_story}

CLINICAL INFORMATION (HIDDEN FROM STUDENT):
- Hidden Diagnosis: ${clinical_dossier.hidden_diagnosis}
- History of Presenting Illness: ${JSON.stringify(clinical_dossier.history_of_presenting_illness, null, 2)}
- Review of Systems: ${JSON.stringify(clinical_dossier.review_of_systems, null, 2)}
- Past Medical History: ${clinical_dossier.past_medical_history.join(', ')}
- Medications: ${clinical_dossier.medications.join(', ')}
- Allergies: ${clinical_dossier.allergies.join(', ')}
- Social History: ${JSON.stringify(clinical_dossier.social_history, null, 2)}

LOCATION CONTEXT: ${case_metadata.location}
SPECIALTY: ${case_metadata.specialty}
DIFFICULTY LEVEL: ${case_metadata.difficulty}

IMPORTANT INSTRUCTIONS:
1. Stay in character as the patient/guardian
2. Only reveal information when appropriately asked
3. Respond naturally based on emotional tone and background
4. Use clinical information to provide realistic responses
5. Consider cultural context of ${case_metadata.location}
6. Maintain consistency with the hidden diagnosis
7. Show appropriate emotional responses based on the situation`;
  }

  /**
   * Get evaluation criteria for a case
   */
  getEvaluationCriteria(caseData) {
    return caseData.evaluation_criteria;
  }

  /**
   * Get simulation triggers for a case
   */
  getSimulationTriggers(caseData) {
    return caseData.simulation_triggers;
  }
}

module.exports = TemplateCaseService;