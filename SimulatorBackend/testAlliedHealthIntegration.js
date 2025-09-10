import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
dotenv.config();

async function testAlliedHealthCases() {
  await connectDB();
  
  console.log('=== Testing Allied Health Cases Integration ===');
  
  // Test API endpoint for cases with allied health specialties
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  for (const specialty of alliedHealthSpecialties) {
    const cases = await mongoose.connection.db.collection('cases')
      .find({ 
        'case_metadata.specialty': specialty,
        'case_metadata.status': 'published'
      })
      .project({ title: 1, 'case_metadata.specialty': 1, 'case_metadata.difficulty': 1 })
      .toArray();
    
    console.log(`\n${specialty}: ${cases.length} published cases`);
    cases.forEach(c => console.log(`  - ${c.title} (${c.case_metadata?.difficulty})`));
  }
  
  await mongoose.connection.close();
  console.log('\n=== Test Complete ===');
}

testAlliedHealthCases().catch(console.error);