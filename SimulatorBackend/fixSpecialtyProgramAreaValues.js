import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual-patient-simulator';

async function fixSpecialtyProgramAreaValues() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully\n');

    // Specialty model is already imported

    // Get all specialties
    const allSpecialties = await Specialty.find({});
    console.log(`Found ${allSpecialties.length} specialties\n`);

    let fixedCount = 0;

    for (const specialty of allSpecialties) {
      let needsUpdate = false;
      let newProgramArea = specialty.programArea;

      // Normalize to lowercase values
      if (specialty.programArea === 'Basic Program') {
        newProgramArea = 'basic';
        needsUpdate = true;
      } else if (specialty.programArea === 'Specialty Program') {
        newProgramArea = 'specialty';
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`Updating ${specialty.name}: "${specialty.programArea}" → "${newProgramArea}"`);
        specialty.programArea = newProgramArea;
        specialty.lastModified = new Date();
        specialty.modifiedBy = 'fix-script';
        await specialty.save();
        fixedCount++;
      }
    }

    console.log(`\nFixed ${fixedCount} specialties`);

    // Verify the fix
    console.log('\n=== Verification ===');
    const basicSpecialties = await Specialty.find({ programArea: 'basic' });
    const specialtySpecialties = await Specialty.find({ programArea: 'specialty' });
    const invalidSpecialties = await Specialty.find({ 
      programArea: { $nin: ['basic', 'specialty'] } 
    });

    console.log(`\nBasic Program specialties (${basicSpecialties.length}):`);
    basicSpecialties.forEach(s => console.log(`  - ${s.name}`));

    console.log(`\nSpecialty Program specialties (${specialtySpecialties.length}):`);
    specialtySpecialties.forEach(s => console.log(`  - ${s.name}`));

    if (invalidSpecialties.length > 0) {
      console.log(`\nWarning: ${invalidSpecialties.length} specialties with invalid programArea values:`);
      invalidSpecialties.forEach(s => console.log(`  - ${s.name}: ${s.programArea}`));
    } else {
      console.log('\n✓ All specialties have valid programArea values');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

fixSpecialtyProgramAreaValues();