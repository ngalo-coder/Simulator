import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
dotenv.config();

async function checkCaseStatus() {
  await connectDB();
  
  console.log('=== Checking Allied Health Case Status ===');
  
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  for (const specialty of alliedHealthSpecialties) {
    const cases = await mongoose.connection.db.collection('cases')
      .find({ 'case_metadata.specialty': specialty })
      .project({ title: 1, 'case_metadata.specialty': 1, 'case_metadata.status': 1 })
      .toArray();
    
    console.log(`\n${specialty}: ${cases.length} total cases`);
    cases.forEach(c => console.log(`  - ${c.title} (status: ${c.case_metadata?.status || 'unknown'})`));
  }
  
  await mongoose.connection.close();
}

checkCaseStatus().catch(console.error);