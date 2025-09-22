import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';
import connectDB from './src/config/db.js';

dotenv.config();

async function checkInternalMedicine() {
  try {
    console.log('🔍 Checking Internal Medicine configuration...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Check Internal Medicine specialty
    const internalMedicine = await Specialty.findOne({ name: 'Internal Medicine' });
    console.log('📋 Internal Medicine specialty:');
    console.log(`   - Name: ${internalMedicine.name}`);
    console.log(`   - Program Area: ${internalMedicine.programArea}`);
    console.log(`   - Is Visible: ${internalMedicine.isVisible}`);
    console.log(`   - Program Areas: [${internalMedicine.programAreas.join(', ')}]`);
    console.log(`   - Last Modified: ${internalMedicine.lastModified}`);
    console.log(`   - Modified By: ${internalMedicine.modifiedBy}`);

    // Check what other specialties are in Basic Program
    console.log('\n📊 All specialties in Basic Program:');
    const basicProgramSpecialties = await Specialty.find({ programArea: 'Basic Program' }).select('name programArea');
    basicProgramSpecialties.forEach(specialty => {
      console.log(`   - ${specialty.name} (${specialty.programArea})`);
    });

    // Check what other specialties are in Specialty Program
    console.log('\n📊 All specialties in Specialty Program:');
    const specialtyProgramSpecialties = await Specialty.find({ programArea: 'Specialty Program' }).select('name programArea');
    specialtyProgramSpecialties.forEach(specialty => {
      console.log(`   - ${specialty.name} (${specialty.programArea})`);
    });

    // Fix Internal Medicine if it's in the wrong program
    if (internalMedicine.programArea === 'Specialty Program') {
      console.log('\n🔧 Fixing Internal Medicine program area...');
      const updateResult = await Specialty.updateOne(
        { name: 'Internal Medicine' },
        {
          $set: {
            programArea: 'Basic Program',
            lastModified: new Date(),
            modifiedBy: 'correction_script'
          }
        }
      );
      console.log(`✅ Update result: ${updateResult.modifiedCount} document(s) modified`);

      // Verify the fix
      const fixedSpecialty = await Specialty.findOne({ name: 'Internal Medicine' });
      console.log(`📋 Fixed Internal Medicine: ${fixedSpecialty.name} (${fixedSpecialty.programArea})`);
    } else {
      console.log('\n✅ Internal Medicine is already correctly assigned to Basic Program');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkInternalMedicine();