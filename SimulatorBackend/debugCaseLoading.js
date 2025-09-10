import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './src/models/CaseModel.js';
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

async function debugCaseLoading() {
  await connectToDatabase();
  
  console.log('=== Debugging Case Loading Issues ===\n');
  
  // Check total cases by status
  const statusCounts = await Case.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  console.log('Cases by status:');
  statusCounts.forEach(({ _id, count }) => {
    console.log(`- ${_id || 'no status'}: ${count}`);
  });
  
  // Check cases by program area
  const programAreaCounts = await Case.aggregate([
    { $group: { _id: '$case_metadata.program_area', count: { $sum: 1 } } }
  ]);
  
  console.log('\nCases by program area:');
  programAreaCounts.forEach(({ _id, count }) => {
    console.log(`- ${_id || 'no program area'}: ${count}`);
  });
  
  // Check cases by specialty
  const specialtyCounts = await Case.aggregate([
    { $group: { _id: '$case_metadata.specialty', count: { $sum: 1 } } }
  ]);
  
  console.log('\nCases by specialty:');
  specialtyCounts.forEach(({ _id, count }) => {
    console.log(`- ${_id || 'no specialty'}: ${count}`);
  });
  
  // Test the CaseService.getCases method with different filters
  console.log('\n=== Testing CaseService.getCases() ===');
  
  // Test 1: No filters (should return all published cases)
  console.log('\n1. Testing with no filters:');
  try {
    const result1 = await CaseService.getCases({});
    console.log(`   Found ${result1.cases.length} cases out of ${result1.totalCases} total`);
    result1.cases.slice(0, 5).forEach(caseDoc => {
      console.log(`   - ${caseDoc.id}: ${caseDoc.title} (${caseDoc.program_area})`);
    });
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 2: Basic Program filter
  console.log('\n2. Testing with program_area=Basic Program:');
  try {
    const result2 = await CaseService.getCases({ program_area: 'Basic Program' });
    console.log(`   Found ${result2.cases.length} cases out of ${result2.totalCases} total`);
    result2.cases.slice(0, 5).forEach(caseDoc => {
      console.log(`   - ${caseDoc.id}: ${caseDoc.title} (${caseDoc.specialized_area})`);
    });
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 3: Specialty Program filter
  console.log('\n3. Testing with program_area=Specialty Program:');
  try {
    const result3 = await CaseService.getCases({ program_area: 'Specialty Program' });
    console.log(`   Found ${result3.cases.length} cases out of ${result3.totalCases} total`);
    result3.cases.slice(0, 5).forEach(caseDoc => {
      console.log(`   - ${caseDoc.id}: ${caseDoc.title} (${caseDoc.specialized_area})`);
    });
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Check if allied health cases have the right status
  console.log('\n=== Checking Allied Health Cases Status ===');
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  for (const specialty of alliedHealthSpecialties) {
    const cases = await Case.find({ 
      'case_metadata.specialty': specialty,
      status: { $ne: 'published' }
    }).select('case_metadata.case_id case_metadata.title status');
    
    if (cases.length > 0) {
      console.log(`\n${specialty} cases with non-published status:`);
      cases.forEach(caseDoc => {
        console.log(`   - ${caseDoc.case_metadata.case_id}: ${caseDoc.case_metadata.title} (${caseDoc.status})`);
      });
    }
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

debugCaseLoading().catch(console.error);