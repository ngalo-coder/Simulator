// ai-patient-sim-core-services/simulation-service/src/services/templateCaseService.js
const TemplateCase = require('../models/TemplateCase');

class TemplateCaseService {
  constructor() {
    // No longer need to cache data since we're using database
    console.log('✅ TemplateCaseService initialized with database backend');
  }

  /**
   * Load cases from database
   */
  async loadCases(filters = {}) {
    try {
      const cases = await TemplateCase.searchCases(filters);
      console.log(`✅ Loaded ${cases.length} cases from database`);
      return cases;
    } catch (error) {
      console.error('❌ Error loading template cases from database:', error);
      // Fallback to sample template if database fails
      return [this.getSampleTemplate()];
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
    try {
      const cases = await TemplateCase.searchCases(filters);
      
      // Transform to frontend-friendly format
      return cases.map(case_ => case_.frontendFormat);
    } catch (error) {
      console.error('❌ Error getting cases from database:', error);
      // Fallback to sample case
      return [this.transformCaseForFrontend(this.getSampleTemplate())];
    }
  }

  /**
   * Get a specific case by ID
   */
  async getCaseById(caseId) {
    try {
      const caseData = await TemplateCase.findOne({ caseId, isActive: true });
      
      if (!caseData) {
        throw new Error(`Case not found: ${caseId}`);
      }

      // Transform to the format expected by the simulation engine
      return this.transformDatabaseCaseToEngineFormat(caseData);
    } catch (error) {
      console.error(`❌ Error getting case ${caseId} from database:`, error);
      throw error;
    }
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
    try {
      return await TemplateCase.getFilterOptions();
    } catch (error) {
      console.error('❌ Error getting filter options from database:', error);
      return {
        programAreas: ['Basic Program', 'Specialty Program'],
        specialties: ['Internal Medicine', 'Pediatrics'],
        difficulties: ['Easy', 'Intermediate', 'Hard'],
        locations: ['East Africa'],
        tags: []
      };
    }
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
   * Transform database case to simulation engine format
   */
  transformDatabaseCaseToEngineFormat(dbCase) {
    return {
      version: dbCase.version,
      description: dbCase.description,
      system_instruction: dbCase.systemInstruction,
      case_metadata: {
        program_area: dbCase.programArea,
        case_id: dbCase.caseId,
        title: dbCase.title,
        specialty: dbCase.specialty,
        difficulty: dbCase.difficulty,
        tags: dbCase.tags,
        location: dbCase.location
      },
      patient_persona: {
        name: dbCase.patientPersona.name,
        age: dbCase.patientPersona.age,
        gender: dbCase.patientPersona.gender,
        occupation: dbCase.patientPersona.occupation,
        chief_complaint: dbCase.patientPersona.chiefComplaint,
        emotional_tone: dbCase.patientPersona.emotionalTone,
        background_story: dbCase.patientPersona.backgroundStory,
        speaks_for: dbCase.patientPersona.speaksFor,
        patient_is_present: dbCase.patientPersona.patientIsPresent,
        patient_age_for_communication: dbCase.patientPersona.patientAgeForCommunication
      },
      initial_prompt: dbCase.initialPrompt,
      clinical_dossier: {
        comment: "This is the AI's source of truth. Only reveal these details when directly asked.",
        hidden_diagnosis: dbCase.clinicalDossier.hiddenDiagnosis,
        history_of_presenting_illness: dbCase.clinicalDossier.historyOfPresentingIllness ? {
          onset: dbCase.clinicalDossier.historyOfPresentingIllness.onset,
          location: dbCase.clinicalDossier.historyOfPresentingIllness.location,
          radiation: dbCase.clinicalDossier.historyOfPresentingIllness.radiation,
          character: dbCase.clinicalDossier.historyOfPresentingIllness.character,
          severity: dbCase.clinicalDossier.historyOfPresentingIllness.severity,
          timing_and_duration: dbCase.clinicalDossier.historyOfPresentingIllness.timingAndDuration,
          exacerbating_factors: dbCase.clinicalDossier.historyOfPresentingIllness.exacerbatingFactors,
          relieving_factors: dbCase.clinicalDossier.historyOfPresentingIllness.relievingFactors,
          associated_symptoms: dbCase.clinicalDossier.historyOfPresentingIllness.associatedSymptoms
        } : {},
        review_of_systems: dbCase.clinicalDossier.reviewOfSystems,
        past_medical_history: dbCase.clinicalDossier.pastMedicalHistory,
        medications: dbCase.clinicalDossier.medications,
        allergies: dbCase.clinicalDossier.allergies,
        surgical_history: dbCase.clinicalDossier.surgicalHistory,
        family_history: dbCase.clinicalDossier.familyHistory,
        social_history: dbCase.clinicalDossier.socialHistory ? {
          smoking_status: dbCase.clinicalDossier.socialHistory.smokingStatus,
          alcohol_use: dbCase.clinicalDossier.socialHistory.alcoholUse,
          substance_use: dbCase.clinicalDossier.socialHistory.substanceUse,
          diet_and_exercise: dbCase.clinicalDossier.socialHistory.dietAndExercise,
          living_situation: dbCase.clinicalDossier.socialHistory.livingSituation
        } : {}
      },
      simulation_triggers: {
        end_session: dbCase.simulationTriggers.endSession ? {
          condition_keyword: dbCase.simulationTriggers.endSession.conditionKeyword,
          patient_response: dbCase.simulationTriggers.endSession.patientResponse
        } : {},
        invalid_input: dbCase.simulationTriggers.invalidInput ? {
          response: dbCase.simulationTriggers.invalidInput.response
        } : {}
      },
      evaluation_criteria: Object.fromEntries(dbCase.evaluationCriteria || new Map())
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
   * Create a new template case in the database
   */
  async createCase(caseData) {
    try {
      const templateCase = new TemplateCase(caseData);
      await templateCase.save();
      console.log(`✅ Created new template case: ${templateCase.caseId}`);
      return templateCase.frontendFormat;
    } catch (error) {
      console.error('❌ Error creating template case:', error);
      throw error;
    }
  }

  /**
   * Update an existing template case
   */
  async updateCase(caseId, updateData) {
    try {
      const updatedCase = await TemplateCase.findOneAndUpdate(
        { caseId, isActive: true },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedCase) {
        throw new Error(`Case not found: ${caseId}`);
      }

      console.log(`✅ Updated template case: ${caseId}`);
      return updatedCase.frontendFormat;
    } catch (error) {
      console.error(`❌ Error updating case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a template case
   */
  async deleteCase(caseId) {
    try {
      const deletedCase = await TemplateCase.findOneAndUpdate(
        { caseId, isActive: true },
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      if (!deletedCase) {
        throw new Error(`Case not found: ${caseId}`);
      }

      console.log(`✅ Deleted template case: ${caseId}`);
      return { success: true, message: `Case ${caseId} deleted successfully` };
    } catch (error) {
      console.error(`❌ Error deleting case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Get case statistics
   */
  async getCaseStatistics() {
    try {
      const stats = await TemplateCase.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            byProgramArea: {
              $push: {
                programArea: '$programArea',
                count: 1
              }
            },
            bySpecialty: {
              $push: {
                specialty: '$specialty',
                count: 1
              }
            },
            byDifficulty: {
              $push: {
                difficulty: '$difficulty',
                count: 1
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalCases: 0,
        byProgramArea: [],
        bySpecialty: [],
        byDifficulty: []
      };
    } catch (error) {
      console.error('❌ Error getting case statistics:', error);
      return {
        totalCases: 0,
        byProgramArea: [],
        bySpecialty: [],
        byDifficulty: []
      };
    }
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