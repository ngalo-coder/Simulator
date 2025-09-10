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

async function testAlliedHealthOrdering() {
  await connectToDatabase();
  
  console.log('=== Testing Allied Health Cases Ordering ===\n');
  
  try {
    // Test with a higher limit to see all cases
    const result = await CaseService.getCases({ limit: 200 }); // Get all cases
    console.log(`Total cases: ${result.totalCases}`);
    console.log(`Cases returned: ${result.cases.length}`);
    
    // Check allied health cases
    const alliedHealthCases = result.cases.filter(caseDoc => 
      caseDoc.specialty && 
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.specialty)
    );
    
    console.log(`\nAllied health cases in full response: ${alliedHealthCases.length}`);
    alliedHealthCases.forEach(caseDoc => {
      console.log(`- ${caseDoc.id}: ${caseDoc.title} (${caseDoc.specialty})`);
    });
    
    // Check what cases are being returned in the first 20
    const firstPageResult = await CaseService.getCases({}); // Default limit 20
    console.log(`\nFirst page cases (limit 20): ${firstPageResult.cases.length}`);
    
    const firstPageAlliedHealth = firstPageResult.cases.filter(caseDoc => 
      caseDoc.specialty && 
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.specialty)
    );
    
    console.log(`Allied health cases on first page: ${firstPageAlliedHealth.length}`);
    firstPageAlliedHealth.forEach(caseDoc => {
      console.log(`  - ${caseDoc.id}: ${caseDoc.title} (${caseDoc.specialty})`);
    });
    
    // Check what types of cases are on the first page
    const firstPageSpecialties = {};
    firstPageResult.cases.forEach(caseDoc => {
      if (caseDoc.specialty) {
        const specialty = caseDoc.specialty;
        firstPageSpecialties[specialty] = (firstPageSpecialties[specialty] || 0) + 1;
      }
    });
    
    console.log('\nFirst page specialties:');
    Object.entries(firstPageSpecialties).forEach(([specialty, count]) => {
      console.log(`- ${specialty}: ${count} cases`);
    });
    
    // Test with different pages to see where allied health cases appear
    console.log('\n=== Testing Different Pages ===');
    for (let page = 1; page <= 6; page++) {
      const pageResult = await CaseService.getCases({ page, limit: 20 });
      const pageAlliedHealth = pageResult.cases.filter(caseDoc => 
        caseDoc.specialty && 
        ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.specialty)
      );
      
      console.log(`Page ${page}: ${pageAlliedHealth.length} allied health cases`);
    }
    
  } catch (error) {
    console.error('Error testing ordering:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

testAlliedHealthOrdering().catch(console.error);