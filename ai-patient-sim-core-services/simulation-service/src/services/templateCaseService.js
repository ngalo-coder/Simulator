// ai-patient-sim-core-services/simulation-service/src/services/templateCaseService.js
const fs = require('fs').promises;
const path = require('path');

class TemplateCaseService {
  constructor() {
    this.casesData = null;
    this.casesPath = path.join(__dirname, '../data/case_templates.json');
  }

  /**
   * Load and parse case templates from JSON file
   */
  async loadCases() {
    try {
      if (!this.casesData) {
        const rawData = await fs.readFile(this.casesPath, 'utf8');
        this.casesData = JSON.parse(rawData);
        console.log(`✅ Loaded ${Array.isArray(this.casesData) ? this.casesData.length : 'template'} cases`);
      }
      return this.casesData;
    } catch (error) {
      console.error('❌ Error loading template cases:', error);
      // Fallback to sample template if file doesn't exist
      return this.getSampleTemplate();
    }
  }

  /**
   * Get sample template for testing
   */
  getSampleTemplate() {
    return [{
      "version": "3.1-program-aware",
      "description": "Sample virtual patient simulation case",
      "system_instruction": "You are an AI-powered virtual patient in a medical simulation environment...",
      "case_metadata": {
        "program_area": "Basic Program",
        "case_id": "VP-SAMPLE-001",
        "title": "Sample Patient Case",
        "specialty": "Internal Medicine",
        "difficulty": "Easy",
        "tags": ["sample", "internal medicine", "basic"],
        "location": "Kenya"
      },
      "patient_persona": {
        "name": "John Doe",
        "age": "45",
        "gender": "Male",
        "occupation": "Teacher",
        "chief_complaint": "Chest pain since morning",
        "emotional_tone": "Anxious",
        "background_story": "Works as a teacher, lives with family",
        "speaks_for": "Self",
        "patient_is_present": true,
        "patient_age_for_communication": 45
      },
      "initial_prompt": "You are now interacting with a virtual patient. Begin by asking your clinical questions.",
      "clinical_dossier": {
        "comment": "This is the AI's source of truth. Only reveal these details when directly asked.",
        "hidden_diagnosis": "Acute Myocardial Infarction",
        "history_of_presenting_illness": {
          "onset": "Started 2 hours ago",
          "location": "Central chest",
          "radiation": "Left arm and jaw",
          "character": "Crushing, heavy pressure",
          "severity": "8/10",
          "timing_and_duration": "Constant since onset",
          "exacerbating_factors": "Movement, deep breathing",
          "relieving_factors": "Rest partially helps",
          "associated_symptoms": ["Shortness of breath", "Sweating", "Nausea"]
        },
        "review_of_systems": {
          "positive": ["Chest pain", "Shortness of breath", "Diaphoresis"],
          "negative": ["No headache", "No abdominal pain", "No urinary symptoms"]
        },
        "past_medical_history": ["Hypertension", "Diabetes mellitus type 2"],
        "medications": ["Metformin 500mg BID", "Lisinopril 10mg daily"],
        "allergies": ["No known drug allergies"],
        "surgical_history": ["None"],
        "family_history": ["Father died of heart attack at 55"],
        "social_history": {
          "smoking_status": "Former smoker, quit 5 years ago",
          "alcohol_use": "Social drinking",
          "substance_use": "Denies",
          "diet_and_exercise": "Sedentary lifestyle",
          "living_situation": "Lives with wife and children"
        }
      },
      "simulation_triggers": {
        "end_session": {
          "condition_keyword": "diagnosis",
          "patient_response": "Thank you, doctor. What do you think is going on with me?"
        },
        "invalid_input": {
          "response": "Sorry, I didn't understand that. Can you ask it differently?"
        }
      },
      "evaluation_criteria": {
        "History_Taking": "Did the user thoroughly explore the symptoms using OPQRST or similar?",
        "Risk_Factor_Assessment": "Were lifestyle, past medical, and family histories covered?",
        "Differential_Diagnosis_Questioning": "Did the clinician ask questions to rule out similar or dangerous conditions?",
        "Communication_and_Empathy": "Was the approach sensitive to the patient's emotional tone?",
        "Clinical_Urgency": "Did the clinician demonstrate appropriate urgency or escalation?"
      }
    }];
  }

  /**
   * Get all available cases with optional filtering
   */
  async getCases(filters = {}) {
    const cases = await this.loadCases();
    let filteredCases = Array.isArray(cases) ? cases : [cases];

    // Apply filters
    if (filters.programArea) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata?.program_area === filters.programArea
      );
    }

    if (filters.specialty) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata?.specialty === filters.specialty
      );
    }

    if (filters.difficulty) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata?.difficulty === filters.difficulty
      );
    }

    if (filters.location) {
      filteredCases = filteredCases.filter(
        caseItem => caseItem.case_metadata?.location === filters.location
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredCases = filteredCases.filter(
        caseItem => filters.tags.some(tag => 
          caseItem.case_metadata?.tags?.includes(tag)
        )
      );
    }

    // Transform to frontend-friendly format and filter out invalid cases
    return filteredCases
      .map(this.transformCaseForFrontend)
      .filter(caseItem => caseItem !== null);
  }

  /**
   * Get a specific case by ID
   */
  async getCaseById(caseId) {
    const cases = await this.loadCases();
    const casesArray = Array.isArray(cases) ? cases : [cases];
    const caseData = casesArray.find(caseItem => caseItem.case_metadata?.case_id === caseId);
    
    if (!caseData) {
      throw new Error(`Case not found: ${caseId}`);
    }

    return caseData;
  }

  /**
   * Transform case data for frontend consumption (hide clinical dossier)
   */
  transformCaseForFrontend(caseData) {
    if (!caseData.case_metadata || !caseData.patient_persona) {
      console.warn('Invalid case data structure:', caseData);
      return null;
    }

    return {
      id: caseData.case_metadata.case_id,
      title: caseData.case_metadata.title,
      specialty: caseData.case_metadata.specialty,
      difficulty: caseData.case_metadata.difficulty,
      programArea: caseData.case_metadata.program_area,
      tags: caseData.case_metadata.tags || [],
      location: caseData.case_metadata.location,
      patientInfo: {
        name: caseData.patient_persona.name,
        age: caseData.patient_persona.age,
        gender: caseData.patient_persona.gender,
        occupation: caseData.patient_persona.occupation,
        chiefComplaint: caseData.patient_persona.chief_complaint,
        emotionalTone: caseData.patient_persona.emotional_tone,
        backgroundStory: caseData.patient_persona.background_story
      },
      description: caseData.description,
      version: caseData.version,
      hasGuardian: this.isPediatricCase(caseData.patient_persona),
      guardianInfo: this.isPediatricCase(caseData.patient_persona) ? {
        relationship: caseData.patient_persona.speaks_for || 'Parent/Guardian',
        patientAge: caseData.patient_persona.age
      } : null
    };
  }

  /**
   * Get unique values for filtering
   */
  async getFilterOptions() {
    const cases = await this.loadCases();
    const casesArray = Array.isArray(cases) ? cases : [cases];
    
    const programAreas = [...new Set(casesArray.map(c => c.case_metadata?.program_area).filter(Boolean))];
    const specialties = [...new Set(casesArray.map(c => c.case_metadata?.specialty).filter(Boolean))];
    const difficulties = [...new Set(casesArray.map(c => c.case_metadata?.difficulty).filter(Boolean))];
    const locations = [...new Set(casesArray.map(c => c.case_metadata?.location).filter(Boolean))];
    const allTags = casesArray.flatMap(c => c.case_metadata?.tags || []);
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
   * Build enhanced system prompt from template
   */
  buildSystemPrompt(caseData, conversationContext = {}) {
    const { patient_persona, clinical_dossier, case_metadata, system_instruction } = caseData;
    
    let enhancedPrompt = system_instruction;

    // Add patient persona details
    enhancedPrompt += `\n\nPATIENT PERSONA:
- Name: ${patient_persona.name}
- Age: ${patient_persona.age}
- Gender: ${patient_persona.gender}
- Occupation: ${patient_persona.occupation}
- Chief Complaint: ${patient_persona.chief_complaint}
- Emotional Tone: ${patient_persona.emotional_tone}
- Background: ${patient_persona.background_story}`;

    // Add guardian information if applicable
    if (patient_persona.speaks_for !== "Self") {
      enhancedPrompt += `\n- Guardian/Spokesperson: ${patient_persona.speaks_for}
- Patient is present: ${patient_persona.patient_is_present}
- Communication age level: ${patient_persona.patient_age_for_communication}`;
    }

    // Add clinical information (for AI use only)
    enhancedPrompt += `\n\nCLINICAL INFORMATION (CONFIDENTIAL - FOR AI USE ONLY):
- Hidden Diagnosis: ${clinical_dossier.hidden_diagnosis}
- Key Symptoms to Reveal When Asked:`;

    if (clinical_dossier.history_of_presenting_illness) {
      const hpi = clinical_dossier.history_of_presenting_illness;
      enhancedPrompt += `
  * Onset: ${hpi.onset}
  * Location: ${hpi.location}
  * Character: ${hpi.character}
  * Severity: ${hpi.severity}
  * Associated symptoms: ${hpi.associated_symptoms?.join(', ') || 'None specified'}`;
    }

    enhancedPrompt += `\n- Past Medical History: ${clinical_dossier.past_medical_history?.join(', ') || 'None'}
- Current Medications: ${clinical_dossier.medications?.join(', ') || 'None'}
- Allergies: ${clinical_dossier.allergies?.join(', ') || 'NKDA'}`;

    // Add location and cultural context
    if (case_metadata.location) {
      enhancedPrompt += `\n\nLOCATION CONTEXT: ${case_metadata.location}
- Consider local healthcare practices and cultural factors
- Use appropriate local references when natural`;
    }

    // Add behavioral instructions
    enhancedPrompt += `\n\nBEHAVIORAL INSTRUCTIONS:
1. Stay strictly in character as ${patient_persona.name}
2. Show emotional state: ${patient_persona.emotional_tone}
3. Only reveal clinical information when directly and appropriately asked
4. Respond naturally - use conversational language, not medical textbooks
5. Keep responses concise (1-3 sentences typically)
6. Show realistic human reactions (pain, worry, confusion, etc.)
7. Don't volunteer information unless it fits the emotional state and context`;

    // Add program-specific instructions
    if (case_metadata.program_area === "Basic Program") {
      enhancedPrompt += `\n8. Keep medical complexity appropriate for basic program level
9. Focus on fundamental clinical skills and communication`;
    } else if (case_metadata.program_area === "Specialty Program") {
      enhancedPrompt += `\n8. Include specialty-specific nuances and complexity
9. May present with more complex or subtle findings`;
    }

    return enhancedPrompt;
  }

  /**
   * Get evaluation criteria for a case
   */
  getEvaluationCriteria(caseData) {
    return caseData.evaluation_criteria || {};
  }

  /**
   * Get simulation triggers for a case
   */
  getSimulationTriggers(caseData) {
    return caseData.simulation_triggers || {};
  }

  /**
   * Create case from template structure
   */
  async createCaseFromTemplate(templateData) {
    try {
      // Validate template structure
      const requiredFields = ['case_metadata', 'patient_persona', 'clinical_dossier'];
      const missingFields = requiredFields.filter(field => !templateData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Add default values if not provided
      const caseData = {
        version: templateData.version || "3.1-program-aware",
        description: templateData.description || "Virtual patient simulation case",
        system_instruction: templateData.system_instruction || this.getDefaultSystemInstruction(),
        ...templateData,
        initial_prompt: templateData.initial_prompt || "You are now interacting with a virtual patient. Begin by asking your clinical questions.",
        simulation_triggers: templateData.simulation_triggers || this.getDefaultTriggers(),
        evaluation_criteria: templateData.evaluation_criteria || this.getDefaultEvaluationCriteria()
      };

      return caseData;
    } catch (error) {
      console.error('❌ Error creating case from template:', error);
      throw error;
    }
  }

  /**
   * Get default system instruction
   */
  getDefaultSystemInstruction() {
    return `You are an AI-powered virtual patient in a medical simulation environment. Your task is to role-play as a realistic patient based on the assigned medical program and subject area. 

✅ RULES:
1. DO use domain-specific vocabulary and realism
2. DO NOT offer diagnoses or volunteer information
3. ONLY respond based on what's in the Clinical Dossier
4. IF asked something out of scope, say you don't know or haven't experienced it
5. MAINTAIN the emotional tone described

Respond like a real patient based on the 'Patient Persona' and 'Clinical Dossier' below.`;
  }

  /**
   * Get default simulation triggers
   */
  getDefaultTriggers() {
    return {
      end_session: {
        condition_keyword: "diagnosis",
        patient_response: "Thank you, doctor. What do you think is going on with me?"
      },
      invalid_input: {
        response: "Sorry, I didn't understand that. Can you ask it differently?"
      }
    };
  }

  /**
   * Get default evaluation criteria
   */
  getDefaultEvaluationCriteria() {
    return {
      "History_Taking": "Did the user thoroughly explore the symptoms using a systematic approach?",
      "Communication_and_Empathy": "Was the approach sensitive to the patient's emotional state?",
      "Clinical_Reasoning": "Did the clinician demonstrate logical clinical thinking?",
      "Professionalism": "Was the interaction conducted professionally and respectfully?"
    };
  }

  /**
   * Determine if this is a pediatric case based on patient age
   */
  isPediatricCase(patientPersona) {
    const age = patientPersona.age;
    if (typeof age === 'number') {
      return age < 18;
    }
    if (typeof age === 'string') {
      const ageNum = parseInt(age);
      return !isNaN(ageNum) && ageNum < 18;
    }
    return false;
  }

  /**
   * Extract clinical information that should be revealed based on question
   */
  extractRelevantClinicalInfo(question, caseData) {
    const questionLower = question.toLowerCase();
    const clinicalDossier = caseData.clinical_dossier;
    const relevantInfo = {};

    // History of presenting illness
    if (questionLower.includes('pain') || questionLower.includes('hurt') || 
        questionLower.includes('feel') || questionLower.includes('symptom')) {
      if (clinicalDossier.history_of_presenting_illness) {
        relevantInfo.currentSymptoms = clinicalDossier.history_of_presenting_illness;
      }
    }

    // Timing questions
    if (questionLower.includes('when') || questionLower.includes('start') || 
        questionLower.includes('begin') || questionLower.includes('how long')) {
      if (clinicalDossier.history_of_presenting_illness?.onset) {
        relevantInfo.timing = clinicalDossier.history_of_presenting_illness.onset;
      }
    }

    // Severity questions
    if (questionLower.includes('bad') || questionLower.includes('severe') || 
        questionLower.includes('scale') || questionLower.includes('rate')) {
      if (clinicalDossier.history_of_presenting_illness?.severity) {
        relevantInfo.severity = clinicalDossier.history_of_presenting_illness.severity;
      }
    }

    // Past medical history
    if (questionLower.includes('history') || questionLower.includes('medical') || 
        questionLower.includes('before') || questionLower.includes('previous')) {
      relevantInfo.pastMedicalHistory = clinicalDossier.past_medical_history;
    }

    // Medications
    if (questionLower.includes('medication') || questionLower.includes('drug') || 
        questionLower.includes('pill') || questionLower.includes('medicine')) {
      relevantInfo.medications = clinicalDossier.medications;
    }

    // Allergies
    if (questionLower.includes('allerg') || questionLower.includes('reaction')) {
      relevantInfo.allergies = clinicalDossier.allergies;
    }

    // Social history
    if (questionLower.includes('smoke') || questionLower.includes('drink') || 
        questionLower.includes('alcohol') || questionLower.includes('social')) {
      relevantInfo.socialHistory = clinicalDossier.social_history;
    }

    // Family history
    if (questionLower.includes('family') || questionLower.includes('parent') || 
        questionLower.includes('father') || questionLower.includes('mother')) {
      relevantInfo.familyHistory = clinicalDossier.family_history;
    }

    return Object.keys(relevantInfo).length > 0 ? relevantInfo : null;
  }
}

module.exports = TemplateCaseService;