import { connectDB } from './src/config/db.js';
import Case from './src/models/CaseModel.js';

async function debugCaseStructure() {
  try {
    await connectDB();

    console.log('=== DEBUGGING CASE STRUCTURE ===\n');

    // Get a sample case to see the actual structure
    const sampleCase = await Case.findOne({}).select('case_metadata').lean();
    if (sampleCase) {
      console.log('Sample case structure:');
      console.log(JSON.stringify(sampleCase, null, 2));
    } else {
      console.log('No cases found in database');
    }

    // Check all unique program areas
    const programAreas = await Case.distinct('case_metadata.program_area');
    console.log('\nUnique program areas:', programAreas);

    // Check all unique specialties
    const specialties = await Case.distinct('case_metadata.specialty');
    console.log('\nUnique specialties:', specialties);

    // Try to find cases with Basic Program
    const basicCases = await Case.find({
      'case_metadata.program_area': 'Basic Program'
    }).limit(3).select('case_metadata.title case_metadata.specialty case_metadata.program_area');

    console.log(`\nFound ${basicCases.length} cases with 'Basic Program':`);
    basicCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.case_metadata.title} (${case_.case_metadata.specialty})`);
    });

    // Try to find cases with Specialty Program
    const specialtyCases = await Case.find({
      'case_metadata.program_area': 'Specialty Program'
    }).limit(3).select('case_metadata.title case_metadata.specialty case_metadata.program_area');

    console.log(`\nFound ${specialtyCases.length} cases with 'Specialty Program':`);
    specialtyCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.case_metadata.title} (${case_.case_metadata.specialty})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error debugging case structure:', error);
    process.exit(1);
  }
}

debugCaseStructure();