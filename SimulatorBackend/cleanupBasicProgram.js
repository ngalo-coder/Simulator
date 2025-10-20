import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';

// Load environment variables from .env
dotenv.config();

async function cleanupBasicProgram() {
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

    // Specialties to delete from Basic Program
    const specialtiesToDelete = [
      'Nursing',
      'Laboratory',
      'Pharmacy',
      'General Surgery',
      'Family Medicine'
    ];

    console.log('=== DELETING SPECIALTIES FROM BASIC PROGRAM ===');

    for (const specialtyName of specialtiesToDelete) {
      const specialty = await Specialty.findOne({ name: specialtyName });

      if (specialty) {
        console.log(`\nDeleting specialty: ${specialtyName}`);
        console.log(`  Current program area: ${specialty.programArea}`);

        // Delete the specialty
        await Specialty.deleteOne({ _id: specialty._id });
        console.log(`  ✅ Deleted: ${specialtyName}`);
      } else {
        console.log(`\n❌ Specialty '${specialtyName}' not found in database`);
      }
    }

    console.log('\n=== VERIFICATION ===');

    // Check remaining specialties
    const remainingSpecialties = await Specialty.find({}).sort({ name: 1 });

    console.log(`\nRemaining specialties (${remainingSpecialties.length}):`);

    // Group by program area
    const byProgramArea = {
      basic: [],
      specialty: [],
      internal_medicine: []
    };

    remainingSpecialties.forEach(spec => {
      if (byProgramArea[spec.programArea]) {
        byProgramArea[spec.programArea].push(spec.name);
      } else {
        console.log(`Unknown program area: ${spec.programArea} for specialty: ${spec.name}`);
      }
    });

    // Display results
    Object.entries(byProgramArea).forEach(([programArea, specialties]) => {
      if (specialties.length > 0) {
        console.log(`\n${programArea.toUpperCase()} PROGRAM (${specialties.length}):`);
        specialties.forEach(name => console.log(`  - ${name}`));
      }
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error cleaning up Basic Program:', error.message);
    process.exit(1);
  }
}

// Run the function
cleanupBasicProgram();