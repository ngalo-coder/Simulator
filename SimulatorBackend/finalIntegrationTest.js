import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
dotenv.config();

async function finalIntegrationTest() {
  await connectDB();
  
  console.log('=== FINAL INTEGRATION TEST: Allied Health Cases ===');
  
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  let totalPublishedCases = 0;
  
  for (const specialty of alliedHealthSpecialties) {
    const cases = await mongoose.connection.db.collection('cases')
      .find({ 
        'case_metadata.specialty': specialty,
        'status': 'published'
      })
      .project({ 
        'case_metadata.title': 1, 
        'case_metadata.specialty': 1, 
        'case_metadata.difficulty': 1,
        'status': 1
      })
      .toArray();
    
    console.log(`\n${specialty}: ${cases.length} published cases`);
    cases.forEach(c => console.log(`  - ${c.case_metadata?.title} (${c.case_metadata?.difficulty})`));
    
    totalPublishedCases += cases.length;
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Allied Health Published Cases: ${totalPublishedCases}`);
  
  // Check if specialties exist in Specialty collection
  const specialties = await mongoose.connection.db.collection('specialties')
    .find({ name: { $in: alliedHealthSpecialties } })
    .project({ name: 1, programArea: 1 })
    .toArray();
  
  console.log(`\nSpecialties in database: ${specialties.length}`);
  specialties.forEach(s => console.log(`  - ${s.name} (${s.programArea})`));
  
  await mongoose.connection.close();
  console.log('\n=== TEST COMPLETE ===');
  
  if (totalPublishedCases > 0 && specialties.length === alliedHealthSpecialties.length) {
    console.log('✅ ALL SYSTEMS GO! Allied health cases are ready for frontend use.');
  } else {
    console.log('❌ Some issues detected. Please check the output above.');
  }
}

finalIntegrationTest().catch(console.error);