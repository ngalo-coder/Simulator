// ai-patient-sim-core-services/simulation-service/src/scripts/migrateTemplateCases.js
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const TemplateCase = require('../models/TemplateCase');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrateTemplateCases() {
  try {
    console.log('🚀 Starting template cases migration...');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-patient-sim';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Use the case_100.json file which contains the template cases
    const jsonPath = path.join(__dirname, '../data/case_100.json');
    
    let casesData;
    try {
      const rawData = await fs.readFile(jsonPath, 'utf8');
      casesData = JSON.parse(rawData);
    } catch (error) {
      console.log('⚠️ JSON file not found - migration has already been completed.');
      console.log('📋 All template cases are now stored in MongoDB database.');
      
      // Show current database status
      const totalCasesInDB = await TemplateCase.countDocuments({ isActive: true });
      console.log(`✅ Current cases in database: ${totalCasesInDB}`);
      
      if (totalCasesInDB > 0) {
        console.log('🎉 Migration was successful! Cases are available in the database.');
      } else {
        console.log('⚠️ No cases found in database. You may need to restore the JSON file to re-run migration.');
      }
      return;
    }
    
    console.log(`📋 Found ${casesData.length} cases to migrate`);

    // Clear existing template cases (optional - comment out if you want to keep existing)
    await TemplateCase.deleteMany({});
    console.log('🧹 Cleared existing template cases');

    let successCount = 0;
    let errorCount = 0;

    // Process each case
    for (const caseData of casesData) {
      try {
        // Transform JSON structure to database schema
        const templateCase = new TemplateCase({
          caseId: caseData.case_metadata.case_id,
          version: caseData.version || '3.1-program-aware',
          title: caseData.case_metadata.title,
          description: caseData.description || 'Virtual patient simulation case',
          
          // Case classification
          programArea: caseData.case_metadata.program_area,
          specialty: caseData.case_metadata.specialty,
          difficulty: caseData.case_metadata.difficulty,
          tags: caseData.case_metadata.tags || [],
          location: caseData.case_metadata.location,

          // Patient persona
          patientPersona: {
            name: caseData.patient_persona.name,
            age: caseData.patient_persona.age,
            gender: caseData.patient_persona.gender,
            occupation: caseData.patient_persona.occupation,
            chiefComplaint: caseData.patient_persona.chief_complaint,
            emotionalTone: caseData.patient_persona.emotional_tone,
            backgroundStory: caseData.patient_persona.background_story,
            speaksFor: caseData.patient_persona.speaks_for || 'Self',
            patientIsPresent: caseData.patient_persona.patient_is_present !== false,
            patientAgeForCommunication: caseData.patient_persona.patient_age_for_communication
          },

          // Clinical dossier
          clinicalDossier: {
            hiddenDiagnosis: caseData.clinical_dossier.hidden_diagnosis,
            historyOfPresentingIllness: caseData.clinical_dossier.history_of_presenting_illness ? {
              onset: caseData.clinical_dossier.history_of_presenting_illness.onset,
              location: caseData.clinical_dossier.history_of_presenting_illness.location,
              radiation: caseData.clinical_dossier.history_of_presenting_illness.radiation,
              character: caseData.clinical_dossier.history_of_presenting_illness.character,
              severity: caseData.clinical_dossier.history_of_presenting_illness.severity,
              timingAndDuration: caseData.clinical_dossier.history_of_presenting_illness.timing_and_duration,
              exacerbatingFactors: caseData.clinical_dossier.history_of_presenting_illness.exacerbating_factors,
              relievingFactors: caseData.clinical_dossier.history_of_presenting_illness.relieving_factors,
              associatedSymptoms: caseData.clinical_dossier.history_of_presenting_illness.associated_symptoms || []
            } : {},
            reviewOfSystems: caseData.clinical_dossier.review_of_systems || { positive: [], negative: [] },
            pastMedicalHistory: caseData.clinical_dossier.past_medical_history || [],
            medications: caseData.clinical_dossier.medications || [],
            allergies: caseData.clinical_dossier.allergies || [],
            surgicalHistory: caseData.clinical_dossier.surgical_history || [],
            familyHistory: caseData.clinical_dossier.family_history || [],
            socialHistory: caseData.clinical_dossier.social_history ? {
              smokingStatus: caseData.clinical_dossier.social_history.smoking_status,
              alcoholUse: caseData.clinical_dossier.social_history.alcohol_use,
              substanceUse: caseData.clinical_dossier.social_history.substance_use,
              dietAndExercise: caseData.clinical_dossier.social_history.diet_and_exercise,
              livingSituation: caseData.clinical_dossier.social_history.living_situation
            } : {}
          },

          // System instructions
          systemInstruction: caseData.system_instruction || 'You are an AI-powered virtual patient in a medical simulation environment.',
          initialPrompt: caseData.initial_prompt || 'You are now interacting with a virtual patient. Begin by asking your clinical questions.',

          // Simulation triggers
          simulationTriggers: {
            endSession: caseData.simulation_triggers?.end_session ? {
              conditionKeyword: caseData.simulation_triggers.end_session.condition_keyword,
              patientResponse: caseData.simulation_triggers.end_session.patient_response
            } : {},
            invalidInput: caseData.simulation_triggers?.invalid_input ? {
              response: caseData.simulation_triggers.invalid_input.response
            } : {}
          },

          // Evaluation criteria
          evaluationCriteria: new Map(Object.entries(caseData.evaluation_criteria || {})),

          // Metadata
          isActive: true,
          createdBy: 'migration-script'
        });

        await templateCase.save();
        successCount++;
        console.log(`✅ Migrated case: ${templateCase.caseId} - ${templateCase.title}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating case ${caseData.case_metadata?.case_id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} cases`);
    console.log(`❌ Failed to migrate: ${errorCount} cases`);
    console.log(`📋 Total cases processed: ${casesData.length}`);

    // Verify the migration
    const totalCasesInDB = await TemplateCase.countDocuments({ isActive: true });
    console.log(`🔍 Total active cases in database: ${totalCasesInDB}`);

    // Show some sample cases
    const sampleCases = await TemplateCase.find({ isActive: true })
      .select('caseId title specialty difficulty programArea')
      .limit(5);
    
    console.log('\n📋 Sample migrated cases:');
    sampleCases.forEach(case_ => {
      console.log(`  - ${case_.caseId}: ${case_.title} (${case_.specialty}, ${case_.difficulty})`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateTemplateCases();
}

module.exports = migrateTemplateCases;