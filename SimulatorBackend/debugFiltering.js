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

async function debugFiltering() {
  await connectToDatabase();
  
  console.log('=== Debugging Filtering Logic ===\n');
  
  try {
    // Test the buildQuery method directly
    const query = CaseService.buildQuery({});
    console.log('Default query:', query);
    
    // Get all cases with specialty field
    const allCases = await mongoose.connection.db.collection('cases').find({
      'case_metadata.specialty': { $exists: true }
    }).project({ 'case_metadata.case_id': 1, 'case_metadata.specialty': 1, 'case_metadata.program_area': 1 }).toArray();
    
    console.log(`\nCases with specialty field: ${allCases.length}`);
    
    // Count specialties
    const specialtyCounts = {};
    allCases.forEach(caseDoc => {
      const specialty = caseDoc.case_metadata.specialty;
      specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;
    });
    
    console.log('\nSpecialty counts:');
    Object.entries(specialtyCounts).forEach(([specialty, count]) => {
      console.log(`- ${specialty}: ${count} cases`);
    });
    
    // Check allied health cases specifically
    const alliedHealthCases = allCases.filter(caseDoc => 
      ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.case_metadata.specialty)
    );
    
    console.log(`\nAllied health cases in database: ${alliedHealthCases.length}`);
    alliedHealthCases.forEach(caseDoc => {
      console.log(`- ${caseDoc.case_metadata.case_id}: ${caseDoc.case_metadata.specialty} (${caseDoc.case_metadata.program_area})`);
    });
    
    // Now test the CaseService with specialty filter
    console.log('\n=== Testing CaseService with Specialty Filter ===');
    const nursingResult = await CaseService.getCases({ specialty: 'Nursing' });
    console.log(`Nursing cases via CaseService: ${nursingResult.cases.length}`);
    
    nursingResult.cases.forEach(caseDoc => {
      console.log(`  - ${caseDoc.id}: ${caseDoc.title} (specialty: ${caseDoc.specialty})`);
    });
    
  } catch (error) {
    console.error('Error debugging filtering:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

debugFiltering().catch(console.error);