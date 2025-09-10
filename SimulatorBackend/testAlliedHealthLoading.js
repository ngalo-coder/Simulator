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

async function testAlliedHealthLoading() {
  await connectToDatabase();
  
  console.log('=== Testing Allied Health Case Loading ===\n');
  
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  for (const specialty of alliedHealthSpecialties) {
    console.log(`Testing ${specialty} cases:`);
    
    try {
      const result = await CaseService.getCases({ specialty });
      console.log(`   Found ${result.cases.length} ${specialty} cases out of ${result.totalCases} total`);
      
      if (result.cases.length > 0) {
        result.cases.forEach(caseDoc => {
          console.log(`   - ${caseDoc.id}: ${caseDoc.title}`);
        });
      } else {
        console.log('   No cases found - checking database directly...');
        
        // Check directly in database
        const directCases = await mongoose.connection.db.collection('cases').find({
          'case_metadata.specialty': specialty,
          status: 'published'
        }).project({ 'case_metadata.case_id': 1, 'case_metadata.title': 1 }).toArray();
        
        console.log(`   Database has ${directCases.length} published ${specialty} cases:`);
        directCases.forEach(caseDoc => {
          console.log(`     - ${caseDoc.case_metadata.case_id}: ${caseDoc.case_metadata.title}`);
        });
      }
    } catch (error) {
      console.log(`   Error loading ${specialty} cases:`, error.message);
    }
    console.log('');
  }
  
  // Test with program_area filter for Specialty Program
  console.log('Testing Specialty Program with allied health specialties:');
  try {
    const result = await CaseService.getCases({ 
      program_area: 'Specialty Program',
      specialty: { $in: alliedHealthSpecialties }
    });
    console.log(`   Found ${result.cases.length} allied health cases in Specialty Program`);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

testAlliedHealthLoading().catch(console.error);