import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './src/models/CaseModel.js';

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

async function debugCaseFormat() {
  await connectToDatabase();
  
  console.log('=== Debugging Case Format ===\n');
  
  try {
    // Get a few allied health cases directly from the database
    const alliedHealthCases = await Case.find({
      'case_metadata.specialty': { 
        $in: ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'] 
      },
      status: 'published'
    }).limit(5).lean();
    
    console.log('Raw database documents (first 5 allied health cases):');
    alliedHealthCases.forEach((caseDoc, index) => {
      console.log(`\n--- Case ${index + 1} ---`);
      console.log('ID:', caseDoc._id);
      console.log('Case ID:', caseDoc.case_metadata?.case_id);
      console.log('Title:', caseDoc.case_metadata?.title);
      console.log('Specialty:', caseDoc.case_metadata?.specialty);
      console.log('Program Area:', caseDoc.case_metadata?.program_area);
      console.log('Status:', caseDoc.status);
      console.log('Full case_metadata:', JSON.stringify(caseDoc.case_metadata, null, 2));
    });
    
    // Test the CaseService.formatCase method
    console.log('\n=== Testing CaseService.formatCase ===');
    const CaseService = await import('./src/services/caseService.js');
    
    alliedHealthCases.forEach((caseDoc, index) => {
      console.log(`\n--- Formatted Case ${index + 1} ---`);
      const formatted = CaseService.default.formatCase(caseDoc);
      console.log('Formatted case:', JSON.stringify(formatted, null, 2));
      
      // Check if specialty is missing
      if (!formatted.hasOwnProperty('specialty')) {
        console.log('❌ SPECIALTY FIELD IS MISSING FROM FORMATTED CASE!');
      }
    });
    
  } catch (error) {
    console.error('Error debugging case format:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

debugCaseFormat().catch(console.error);