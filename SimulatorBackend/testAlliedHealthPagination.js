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

async function testAlliedHealthPagination() {
  await connectToDatabase();
  
  console.log('=== Testing Allied Health Cases Pagination ===\n');
  
  // Test with a higher limit to see all cases
  try {
    const result = await CaseService.getCases({ limit: 200 }); // Get all cases
    console.log(`Total cases: ${result.totalCases}`);
    console.log(`Cases returned: ${result.cases.length}`);
    
    // Check allied health cases
    const alliedHealthCases = result.cases.filter(caseDoc => 
      caseDoc.case_metadata && 
      caseDoc.case_metadata.specialty && 
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.case_metadata.specialty)
    );
    
    console.log(`\nAllied health cases in full response: ${alliedHealthCases.length}`);
    alliedHealthCases.forEach(caseDoc => {
      console.log(`- ${caseDoc.case_metadata.case_id}: ${caseDoc.case_metadata.title} (${caseDoc.case_metadata.specialty})`);
    });
    
    // Check what cases are being returned in the first 20
    const firstPageResult = await CaseService.getCases({}); // Default limit 20
    console.log(`\nFirst page cases (limit 20): ${firstPageResult.cases.length}`);
    
    const firstPageAlliedHealth = firstPageResult.cases.filter(caseDoc => 
      caseDoc.case_metadata && 
      caseDoc.case_metadata.specialty && 
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.case_metadata.specialty)
    );
    
    console.log(`Allied health cases on first page: ${firstPageAlliedHealth.length}`);
    
    // Check what types of cases are on the first page
    const firstPageSpecialties = {};
    firstPageResult.cases.forEach(caseDoc => {
      if (caseDoc.case_metadata && caseDoc.case_metadata.specialty) {
        const specialty = caseDoc.case_metadata.specialty;
        firstPageSpecialties[specialty] = (firstPageSpecialties[specialty] || 0) + 1;
      }
    });
    
    console.log('\nFirst page specialties:');
    Object.entries(firstPageSpecialties).forEach(([specialty, count]) => {
      console.log(`- ${specialty}: ${count} cases`);
    });
    
  } catch (error) {
    console.error('Error testing pagination:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

testAlliedHealthPagination().catch(console.error);