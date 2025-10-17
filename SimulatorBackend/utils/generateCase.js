// utils/generateCase.js

import Chance from 'chance';
const chance = new Chance();

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Utility function to convert first-person complaints to clinical terms
const normalizeComplaint = (complaint) => {
  if (!complaint || typeof complaint !== 'string') {
    return 'Clinical symptoms';
  }

  const firstPersonPatterns = [
    /^i've?\s+/i,           // "I've " or "I"
    /^i\s+/i,               // "I "
    /^my\s+/i,              // "My "
    /^i've?\s+been\s+/i,     // "I've been "
    /^i'm\s+/i,             // "I'm "
    /^i've?\s+had\s+/i,      // "I've had "
    /^i've?\s+been\s+feeling\s+/i, // "I've been feeling "
    /^i've?\s+been\s+having\s+/i,  // "I've been having "
  ];

  let needsConversion = false;
  for (const pattern of firstPersonPatterns) {
    if (pattern.test(complaint)) {
      needsConversion = true;
      break;
    }
  }

  if (needsConversion) {
    let clinicalComplaint = complaint
      .replace(/^i've?\s+/gi, '')           // Remove "I've" or "I"
      .replace(/^my\s+/gi, '')              // Remove "My"
      .replace(/^i'm\s+/gi, '')             // Remove "I'm"
      .replace(/i've?\s+been\s+/gi, '')     // Remove "I've been"
      .replace(/i've?\s+had\s+/gi, '')      // Remove "I've had"
      .replace(/i've?\s+been\s+feeling\s+/gi, '') // Remove "I've been feeling"
      .replace(/i've?\s+been\s+having\s+/gi, '')  // Remove "I've been having"
      .replace(/\s+for\s+the\s+past\s+[^.]*?/gi, '') // Remove "for the past X months"
      .replace(/\s+since\s+[^.]*?/gi, '')           // Remove "since X"
      .replace(/\s+and\s+i\s+[^.]*$/gi, '')         // Remove trailing "and I..." clauses
      .trim();

    // If the result is empty or too short, use a generic clinical term
    if (clinicalComplaint.length < 3) {
      clinicalComplaint = 'Clinical symptoms';
    }

    // Capitalize first letter for proper clinical presentation
    return clinicalComplaint.charAt(0).toUpperCase() + clinicalComplaint.slice(1);
  }

  return complaint;
};

const hiddenDiagnoses = {
  "Chest pain": "Acute Myocardial Infarction",
  "Abdominal pain": "Appendicitis",
  "Headache": "Migraine",
  "Fever": "Malaria",
  "Shortness of breath": "Pneumonia",
  "Vaginal bleeding": "Ectopic Pregnancy",
  "Rash": "Allergic Reaction",
  "Jaundice": "Hepatitis",
  "Altered mental status": "Hypoglycemia",
  "Seizure": "Epilepsy"
};

const chiefComplaints = Object.keys(hiddenDiagnoses);

const emotionalTones = [
  "Visibly anxious and scared, speaks in short sentences.",
  "Quiet, withdrawn, avoids eye contact.",
  "Restless, agitated, irritable.",
  "Painful grimace, clutching abdomen.",
  "Fatigued, slow speech, drowsy."
];

const difficulties = ["Easy", "Intermediate", "Intermediate", "Hard"];

function generateCase(index, specialty, program_area) {
  // Add safety checks for parameters
  if (!specialty || typeof specialty !== 'string') {
    specialty = 'General Medicine';
  }
  if (!program_area || typeof program_area !== 'string') {
    program_area = 'Basic Program';
  }

  const complaint = pickOne(chiefComplaints);
  const gender = pickOne(["Male", "Female"]);
  const isPediatric = specialty.toLowerCase().includes("pediatric");

  const age = isPediatric ? String(chance.age({ min: 1, max: 17 })) : String(chance.age({ min: 18, max: 80 }));

  return {
    version: "3.1-program-aware",
    description: (() => {
      const onset = "Started suddenly about 1 hour ago.";
      const location = complaint.includes("chest") ? "chest" :
                      complaint.includes("abdominal") ? "abdomen" :
                      complaint.includes("head") ? "head" : 
                      complaint.includes("eye") || complaint.includes("vision") ? "right eye" : "unspecified";
      
      // Handle first-person complaints by converting to clinical presentation
      const clinicalComplaint = normalizeComplaint(complaint);

      // Create clinical description with fallback
      let description;
      try {
        description = `A ${age}-year-old ${gender.toLowerCase()} patient presenting with ${clinicalComplaint.toLowerCase()}`;

        // Add clinical context
        if (onset.includes('sudden')) {
          description += ', acute onset';
        }
        if (location !== 'unspecified') {
          description += `, affecting the ${location}`;
        }

        description += '.';
      } catch (error) {
        // Fallback to a generic but proper clinical description
        description = `A ${age}-year-old ${gender.toLowerCase()} patient presenting with clinical symptoms requiring evaluation.`;
      }

      return description;
    })(),
    system_instruction: "You are a highly realistic AI-simulated patient for a medical training application. You must portray the patient as defined below and strictly adhere to the specialty of '" + specialty + "'. Never introduce symptoms or diagnoses outside this area. Only reveal what is asked for. Avoid offering medical suggestions or diagnosis.",
    case_metadata: {
      program_area,
      case_id: `VP-${specialty.toUpperCase().replace(/\s+/g, '_')}-${String(index).padStart(4, '0')}`,
      title: (() => {
        // Add clinical context to the title based on specialty and complaint
        const formattedComplaint = complaint.toLowerCase();
        if (specialty.toLowerCase().includes('emergency')) {
          return `Acute ${complaint}`;
        } else if (specialty.toLowerCase().includes('chronic')) {
          return `Chronic ${complaint}`;
        } else if (formattedComplaint.includes('pain')) {
          return `${complaint} with Associated Symptoms`;
        } else if (formattedComplaint.includes('loss')) {
          return `Progressive ${complaint}`;
        } else {
          return complaint;
        }
      })(),
      specialty,
      difficulty: pickOne(difficulties),
      tags: [complaint.toLowerCase(), specialty.toLowerCase(), "clinical reasoning"]
    },
    patient_persona: {
      name: chance.name(),
      age,
      gender,
      occupation: chance.profession(),
      chief_complaint: complaint,
      emotional_tone: pickOne(emotionalTones),
      background_story: `Was at ${chance.sentence({ words: 4 }).toLowerCase()} when the symptoms started.`
    },
    initial_prompt: "You are now interacting with a virtual patient. Begin by asking your clinical questions.",
    clinical_dossier: {
      hidden_diagnosis: hiddenDiagnoses[complaint] || "To be filled",
      history_of_presenting_illness: {
        onset: "Started suddenly about 1 hour ago.",
        location: complaint.includes("chest") ? "chest" :
                 complaint.includes("abdominal") ? "abdomen" :
                 complaint.includes("head") ? "head" : "unspecified",
        radiation: "",
        character: "Sharp",
        severity: "7/10",
        timing_and_duration: "Constant",
        exacerbating_factors: "Movement",
        relieving_factors: "Rest",
        associated_symptoms: []
      },
      review_of_systems: {
        positive: [],
        negative: []
      },
      past_medical_history: [],
      medications: [],
      allergies: [],
      surgical_history: [],
      family_history: [],
      social_history: {}
    },
    simulation_triggers: {
      end_session: {
        condition_keyword: "diagnosis",
        patient_response: "Thank you, doctor. So, what do you think is going on with me?"
      }
    },
    evaluation_criteria: {
      History_Taking: "Did the user fully characterize the main complaint?",
      Risk_Factor_Assessment: "Were relevant risk factors discussed?",
      Differential_Diagnosis_Questioning: "Were alternative diagnoses considered?",
      Communication_and_Empathy: "Was the tone appropriate for the patient's condition?",
      Clinical_Urgency: "Was urgency addressed correctly?"
    }
  };
}

// Export the utility function for use in other modules
export { normalizeComplaint };
export default generateCase;
