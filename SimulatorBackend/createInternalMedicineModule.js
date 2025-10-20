import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';

// Load environment variables from .env
dotenv.config();

async function createInternalMedicineModule() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    if (!DB_NAME) {
      throw new Error('DB_NAME environment variable is not set');
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });

    console.log('Connected to MongoDB successfully.');

    // Define the specialties to move to Internal Medicine
    const internalMedicineSpecialties = [
      'Cardiology',
      'Emergency Medicine',
      'Gastroenterology'
    ];

    console.log('=== UPDATING SPECIALTIES TO INTERNAL MEDICINE ===');

    for (const specialtyName of internalMedicineSpecialties) {
      const specialty = await Specialty.findOne({ name: specialtyName });

      if (specialty) {
        console.log(`\nUpdating ${specialtyName}:`);
        console.log(`  Current program area: ${specialty.programArea}`);

        if (specialty.programArea !== 'internal_medicine') {
          specialty.programArea = 'internal_medicine';
          specialty.lastModified = new Date();
          specialty.modifiedBy = 'create-internal-medicine-script';

          await specialty.save();
          console.log(`  ✅ Updated to: ${specialty.programArea}`);
        } else {
          console.log(`  ✓ Already in: ${specialty.programArea}`);
        }
      } else {
        console.log(`\n❌ Specialty '${specialtyName}' not found in database`);
      }
    }

    console.log('\n=== VERIFICATION ===');

    // Check all specialties in internal_medicine
    const internalMedicineSpecs = await Specialty.find({ programArea: 'internal_medicine' });
    console.log(`\nInternal Medicine specialties (${internalMedicineSpecs.length}):`);
    internalMedicineSpecs.forEach(spec => {
      console.log(`  - ${spec.name}`);
    });

    // Check other program areas for reference
    const basicSpecs = await Specialty.find({ programArea: 'basic' });
    const specialtySpecs = await Specialty.find({ programArea: 'specialty' });

    console.log(`\nOther program areas:`);
    console.log(`  Basic Program: ${basicSpecs.length} specialties`);
    console.log(`  Specialty Program: ${specialtySpecs.length} specialties`);

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error creating Internal Medicine module:', error.message);
    process.exit(1);
  }
}

// Run the function
createInternalMedicineModule();