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

async function verifyImportedCases() {
  await connectToDatabase();
  
  console.log('=== Verifying Imported Allied Health Cases ===\n');
  
  // Count total cases by specialty
  const specialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  for (const specialty of specialties) {
    const count = await Case.countDocuments({ 'case_metadata.specialty': specialty });
    console.log(`${specialty} cases: ${count}`);
  }
  
  console.log('\n=== Detailed Case Information ===');
  
  // Get detailed information about each case
  const cases = await Case.find({
    'case_metadata.specialty': { $in: specialties }
  }).select('case_metadata.case_id case_metadata.title case_metadata.specialty case_metadata.difficulty');
  
  cases.forEach(caseDoc => {
    console.log(`- ${caseDoc.case_metadata.case_id}: ${caseDoc.case_metadata.title} (${caseDoc.case_metadata.difficulty})`);
  });
  
  console.log('\n=== Summary ===');
  const totalCases = await Case.countDocuments({
    'case_metadata.specialty': { $in: specialties }
  });
  console.log(`Total allied health cases in database: ${totalCases}`);
  
  await mongoose.connection.close();
  console.log('Database connection closed');
}

verifyImportedCases().catch(console.error);