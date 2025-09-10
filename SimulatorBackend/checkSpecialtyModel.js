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

async function checkSpecialtyModel() {
  await connectToDatabase();
  
  console.log('=== Checking Specialty Model Data ===\n');
  
  try {
    // Get all specialties from the Specialty collection
    const specialties = await mongoose.connection.db.collection('specialties').find({}).toArray();
    console.log('Specialties in Specialty collection:');
    specialties.forEach(spec => {
      console.log(`- ${spec.name} (${spec.programArea}) ${spec.active ? '✅' : '❌'}`);
    });
    
    // Check if allied health specialties exist in the model
    const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
    console.log('\n=== Allied Health Specialties in Model ===');
    alliedHealthSpecialties.forEach(specialty => {
      const exists = specialties.some(spec => spec.name === specialty);
      console.log(`${specialty}: ${exists ? '✅ Exists' : '❌ Missing'}`);
    });
    
  } catch (error) {
    console.error('Error checking specialty model:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

checkSpecialtyModel().catch(console.error);