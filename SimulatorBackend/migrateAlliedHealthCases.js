import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Case from './src/models/CaseModel.js';

dotenv.config();

// Configuration
const CASE_FILES = [
  'cases/nursing_cases.json',
  'cases/laboratory_cases.json', 
  'cases/pharmacy_cases.json',
  'cases/radiology_cases.json',
  'cases/ophthalmology_cases.json'
];

// Default admin user ID for createdBy field (you may need to adjust this)
const DEFAULT_ADMIN_ID = '000000000000000000000001'; // Example ObjectId

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

function loadCasesFromJson(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return [];
    }
    
    const rawData = fs.readFileSync(fullPath, 'utf-8');
    const cases = JSON.parse(rawData);
    console.log(`Loaded ${cases.length} cases from ${filePath}`);
    return cases;
  } catch (error) {
    console.error(`Error loading JSON file ${filePath}:`, error.message);
    return [];
  }
}

function transformCaseData(rawCase, specialty) {
  // Skip incomplete ophthalmology cases (OPHTH-005 to OPHTH-010)
  if (specialty === 'ophthalmology' &&
      (!rawCase.initial_prompt || !rawCase.clinical_dossier?.hidden_diagnosis)) {
    console.log(`Skipping incomplete ophthalmology case: ${rawCase.case_metadata?.case_id || 'unknown'}`);
    return null;
  }

  // Handle array fields that should be strings in the schema
  const hpi = rawCase.clinical_dossier?.history_of_presenting_illness || {};
  
  // Convert array fields to strings for schema compatibility
  const exacerbatingFactors = Array.isArray(hpi.exacerbating_factors)
    ? hpi.exacerbating_factors.join(', ')
    : hpi.exacerbating_factors || '';
    
  const relievingFactors = Array.isArray(hpi.relieving_factors)
    ? hpi.relieving_factors.join(', ')
    : hpi.relieving_factors || '';

  // Map difficulty to valid enum values
  const difficultyMap = {
    'Advanced': 'Hard',
    'Easy': 'Easy',
    'Intermediate': 'Intermediate',
    'Hard': 'Hard'
  };
  
  const difficulty = difficultyMap[rawCase.case_metadata?.difficulty] || 'Intermediate';

  // Generate initial prompt if missing
  const initialPrompt = rawCase.initial_prompt ||
    (rawCase.patient_persona?.chief_complaint ?
      `I'm experiencing ${rawCase.patient_persona.chief_complaint.toLowerCase()}.` :
      'I need help with my eye problem.');

  // Transform the JSON case data to match the Mongoose schema
  return {
    version: rawCase.version || 3.1,
    description: rawCase.description || '',
    system_instruction: rawCase.system_instruction || '',
    case_metadata: {
      case_id: rawCase.case_metadata?.case_id || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: rawCase.case_metadata?.title || 'Untitled Case',
      specialty: rawCase.case_metadata?.specialty || specialty,
      program_area: rawCase.case_metadata?.program_area || 'Basic Program',
      difficulty: difficulty,
      tags: rawCase.case_metadata?.tags || [],
      location: rawCase.case_metadata?.location || 'Hospital'
    },
    patient_persona: {
      name: rawCase.patient_persona?.name || 'Unknown Patient',
      age: parseInt(rawCase.patient_persona?.age) || 45,
      gender: rawCase.patient_persona?.gender || 'Unknown',
      occupation: rawCase.patient_persona?.occupation || '',
      chief_complaint: rawCase.patient_persona?.chief_complaint || '',
      emotional_tone: rawCase.patient_persona?.emotional_tone || 'Neutral',
      background_story: rawCase.patient_persona?.background_story || '',
      speaks_for: rawCase.patient_persona?.speaks_for || 'self',
      patient_is_present: rawCase.patient_persona?.patient_is_present !== undefined ? rawCase.patient_persona.patient_is_present : true
    },
    initial_prompt: initialPrompt,
    clinical_dossier: {
      hidden_diagnosis: rawCase.clinical_dossier?.hidden_diagnosis || 'Unknown Diagnosis',
      history_of_presenting_illness: {
        ...hpi,
        exacerbating_factors: exacerbatingFactors,
        relieving_factors: relievingFactors
      },
      review_of_systems: rawCase.clinical_dossier?.review_of_systems || {},
      past_medical_history: rawCase.clinical_dossier?.past_medical_history || [],
      medications: rawCase.clinical_dossier?.medications || [],
      allergies: rawCase.clinical_dossier?.allergies || [],
      surgical_history: rawCase.clinical_dossier?.surgical_history || [],
      family_history: rawCase.clinical_dossier?.family_history || [],
      social_history: rawCase.clinical_dossier?.social_history || {}
    },
    simulation_triggers: {
      end_session: rawCase.simulation_triggers?.end_session || { condition_keyword: '', patient_response: '' },
      invalid_input: rawCase.simulation_triggers?.invalid_input || { response: '' }
    },
    evaluation_criteria: rawCase.evaluation_criteria || {},
    
    // Nursing-specific fields
    nursing_diagnoses: rawCase.nursing_diagnoses || [],
    nursing_interventions: rawCase.nursing_interventions || [],
    nursing_outcomes: rawCase.nursing_outcomes || [],
    patient_safety_metrics: rawCase.patient_safety_metrics || {},
    quality_metrics: rawCase.quality_metrics || {},
    
    // Required fields for the schema
    createdBy: new mongoose.Types.ObjectId(DEFAULT_ADMIN_ID),
    status: 'published',
    tags: rawCase.case_metadata?.tags || [],
    categories: []
  };
}

async function migrateCases() {
  await connectToDatabase();
  
  let totalCases = 0;
  let successfulImports = 0;
  let failedImports = 0;
  
  for (const filePath of CASE_FILES) {
    const specialty = path.basename(filePath, '_cases.json');
    console.log(`\nProcessing ${specialty} cases...`);
    
    const rawCases = loadCasesFromJson(filePath);
    totalCases += rawCases.length;
    
    for (const rawCase of rawCases) {
      try {
        const transformedCase = transformCaseData(rawCase, specialty);
        
        // Skip if case is incomplete (returns null)
        if (!transformedCase) {
          continue;
        }
        
        // Check if case already exists
        const existingCase = await Case.findOne({
          'case_metadata.case_id': transformedCase.case_metadata.case_id
        });
        
        if (existingCase) {
          console.log(`Case ${transformedCase.case_metadata.case_id} already exists, skipping...`);
          continue;
        }
        
        const caseDoc = new Case(transformedCase);
        await caseDoc.save();
        console.log(`✓ Imported case: ${transformedCase.case_metadata.case_id}`);
        successfulImports++;
        
      } catch (error) {
        console.error(`✗ Failed to import case:`, error.message);
        failedImports++;
      }
    }
  }
  
  console.log('\n=== Migration Summary ===');
  console.log(`Total cases processed: ${totalCases}`);
  console.log(`Successfully imported: ${successfulImports}`);
  console.log(`Failed imports: ${failedImports}`);
  
  await mongoose.connection.close();
  console.log('Database connection closed');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--dry-run')) {
  console.log('Dry run mode: Would process cases without saving to database');
  // You could add dry run logic here
  process.exit(0);
}

migrateCases().catch(console.error);