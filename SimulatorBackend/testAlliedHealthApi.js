import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CaseService from './src/services/caseService.js';

dotenv.config();

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

async function testAlliedHealthApi() {
  await connectToDatabase();
  
  console.log('=== Testing Allied Health Cases API Compatibility ===\n');
  
  // Test the case service directly (simulating what the API endpoint does)
  try {
    const result = await CaseService.getCases({});
    console.log(`API would return: ${result.totalCases} total cases, ${result.cases.length} cases in response`);
    
    // Check allied health cases
    const alliedHealthCases = result.cases.filter(caseDoc =>
      caseDoc.specialty &&
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.specialty)
    );
    
    console.log(`\nAllied health cases in API response: ${alliedHealthCases.length}`);
    alliedHealthCases.forEach(caseDoc => {
      console.log(`- ${caseDoc.id}: ${caseDoc.title} (${caseDoc.specialty})`);
    });
    
    // Test with program_area filter
    console.log('\n=== Testing Specialty Program Filter ===');
    const specialtyResult = await CaseService.getCases({ program_area: 'Specialty Program' });
    const specialtyAlliedHealth = specialtyResult.cases.filter(caseDoc =>
      caseDoc.specialty &&
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.specialty)
    );
    
    console.log(`Specialty Program cases: ${specialtyResult.cases.length} total, ${specialtyAlliedHealth.length} allied health`);
    
    // Test with individual specialty filters
    const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
    console.log('\n=== Testing Individual Specialty Filters ===');
    
    for (const specialty of alliedHealthSpecialties) {
      const specialtyResult = await CaseService.getCases({ specialty });
      console.log(`${specialty}: ${specialtyResult.cases.length} cases`);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

testAlliedHealthApi().catch(console.error);