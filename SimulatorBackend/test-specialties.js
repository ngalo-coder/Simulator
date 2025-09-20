import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';
import connectDB from './src/config/db.js';

dotenv.config();

async function testSpecialties() {
  try {
    console.log('Testing specialty functionality...');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Check existing specialties
    const count = await Specialty.countDocuments();
    console.log(`📊 Found ${count} specialties in database`);

    if (count === 0) {
      console.log('📝 Creating test specialties...');

      // Create some test specialties
      const testSpecialties = [
        { name: 'Internal Medicine', programArea: 'Basic Program', active: true },
        { name: 'Surgery', programArea: 'Specialty Program', active: true },
        { name: 'Pediatrics', programArea: 'Basic Program', active: true },
        { name: 'Cardiology', programArea: 'Specialty Program', active: true },
        { name: 'Emergency Medicine', programArea: 'Basic Program', active: true },
        { name: 'Radiology', programArea: 'Specialty Program', active: false }, // Hidden specialty
        { name: 'Nursing', programArea: 'Basic Program', active: true },
        { name: 'Pharmacy', programArea: 'Basic Program', active: true }
      ];

      await Specialty.insertMany(testSpecialties);
      console.log(`✅ Created ${testSpecialties.length} test specialties`);
    }

    // Fetch all specialties
    const specialties = await Specialty.find().sort({ name: 1 });
    console.log('📋 All specialties:');
    specialties.forEach(specialty => {
      console.log(`  - ${specialty.name} (${specialty.programArea}) - ${specialty.active ? 'Visible' : 'Hidden'}`);
    });

    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testSpecialties();