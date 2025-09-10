import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
dotenv.config();

async function debugCases() {
  await connectDB();
  
  console.log('=== Debugging Allied Health Cases ===');
  
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  for (const specialty of alliedHealthSpecialties) {
    const cases = await mongoose.connection.db.collection('cases')
      .find({ 'case_metadata.specialty': specialty })
      .limit(1)
      .toArray();
    
    if (cases.length > 0) {
      console.log(`\n${specialty} case structure:`);
      console.log(JSON.stringify(cases[0], null, 2));
    }
  }
  
  await mongoose.connection.close();
}

debugCases().catch(console.error);