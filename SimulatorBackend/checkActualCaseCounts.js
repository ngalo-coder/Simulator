import connectDB from './src/config/db.js';
import Case from './src/models/CaseModel.js';
import Specialty from './src/models/SpecialtyModel.js';

async function checkActualCaseCounts() {
  try {
    await connectDB();

    console.log('=== CHECKING ACTUAL CASE COUNTS ===\n');

    // Get all program areas
    const programAreas = await Case.distinct('case_metadata.program_area');
    console.log('Program Areas found in DB:', programAreas);

    // Check what the actual values are in the database
    const sampleCases = await Case.find({}).limit(5).select('case_metadata.program_area case_metadata.specialty');
    console.log('\n=== SAMPLE CASES TO CHECK PROGRAM AREA VALUES ===');
    sampleCases.forEach((case_, index) => {
      console.log(`${index + 1}. Program Area: "${case_.case_metadata.program_area}", Specialty: "${case_.case_metadata.specialty}"`);
    });

    // Get actual case counts for each program area
    console.log('\n=== ACTUAL CASE COUNTS BY PROGRAM AREA ===');
    for (const programArea of programAreas) {
      const count = await Case.countDocuments({
        'case_metadata.program_area': programArea
      });
      console.log(`${programArea}: ${count} cases`);
    }

    // Get all specialties
    const specialties = await Case.distinct('case_metadata.specialty');
    console.log('\n=== ACTUAL CASE COUNTS BY SPECIALTY ===');
    for (const specialty of specialties) {
      if (specialty && specialty.trim()) {
        const count = await Case.countDocuments({
          'case_metadata.specialty': specialty
        });
        console.log(`${specialty}: ${count} cases`);
      }
    }

    // Check specific program area that user mentioned
    console.log('\n=== CHECKING BASIC PROGRAM CASES ===');
    const basicCases = await Case.find({
      'case_metadata.program_area': 'basic'
    }).select('case_metadata.title case_metadata.specialty case_metadata.program_area');

    console.log(`Found ${basicCases.length} cases in Basic Program:`);
    basicCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.case_metadata.title} (${case_.case_metadata.specialty})`);
    });

    // Check Specialty Program cases
    console.log('\n=== CHECKING SPECIALTY PROGRAM CASES ===');
    const specialtyCases = await Case.find({
      'case_metadata.program_area': 'specialty'
    }).select('case_metadata.title case_metadata.specialty case_metadata.program_area');

    console.log(`Found ${specialtyCases.length} cases in Specialty Program:`);
    specialtyCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.case_metadata.title} (${case_.case_metadata.specialty})`);
    });

    // Check total cases
    const totalCases = await Case.countDocuments({});
    console.log(`\n=== TOTAL CASES IN DATABASE ===`);
    console.log(`Total cases: ${totalCases}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking case counts:', error);
    process.exit(1);
  }
}

checkActualCaseCounts();