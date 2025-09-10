import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

async function checkSpecialtiesDirect() {
  await connectToDatabase();
  
  console.log('=== Checking Specialties Directly from Database ===\n');
  
  try {
    // Get all distinct specialties
    const allSpecialties = await mongoose.connection.db.collection('cases').distinct('case_metadata.specialty');
    console.log('All specialties in database:', allSpecialties.sort());
    
    // Check allied health specialties
    const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
    console.log('\nAllied health specialties to check:', alliedHealthSpecialties);
    
    // Check case counts for each allied health specialty
    console.log('\n=== Allied Health Case Counts ===');
    for (const specialty of alliedHealthSpecialties) {
      const count = await mongoose.connection.db.collection('cases').countDocuments({
        'case_metadata.specialty': specialty,
        status: 'published'
      });
      console.log(`${specialty}: ${count} published cases`);
    }
    
    // Check program areas for allied health specialties
    console.log('\n=== Program Areas for Allied Health Specialties ===');
    for (const specialty of alliedHealthSpecialties) {
      const cases = await mongoose.connection.db.collection('cases').find({
        'case_metadata.specialty': specialty,
        status: 'published'
      }).limit(1).toArray();
      
      if (cases.length > 0) {
        console.log(`${specialty}: ${cases[0].case_metadata.program_area}`);
      } else {
        console.log(`${specialty}: No published cases found`);
      }
    }
    
    // Check frontend configuration issue
    console.log('\n=== Frontend Configuration Analysis ===');
    const frontendConfigSpecialties = [
      'General Surgery', 'Internal Medicine', 'Pediatrics', 'Reproductive Health', 
      'Emergency Medicine', 'Cardiology', 'Neurology', 'Psychiatry'
    ];
    
    console.log('Frontend configured specialties:', frontendConfigSpecialties);
    console.log('Allied health specialties missing from frontend:', 
      alliedHealthSpecialties.filter(spec => !frontendConfigSpecialties.includes(spec))
    );
    
  } catch (error) {
    console.error('Error checking specialties:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

checkSpecialtiesDirect().catch(console.error);