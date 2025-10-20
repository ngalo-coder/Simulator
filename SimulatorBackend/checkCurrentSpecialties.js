import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';

// Load environment variables from .env
dotenv.config();

async function checkCurrentSpecialties() {
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

    // Get all specialties
    const allSpecialties = await Specialty.find({}).sort({ name: 1 });

    console.log(`\n=== CURRENT SPECIALTIES (${allSpecialties.length}) ===`);

    // Group by program area
    const byProgramArea = {
      basic: [],
      specialty: [],
      internal_medicine: []
    };

    allSpecialties.forEach(spec => {
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

    // Check for potential matches for cardiology, emergency, gastroenterology
    const targetSpecialties = ['cardiology', 'emergency', 'gastroenterology', 'cardiac', 'emergency medicine', 'gastro'];
    console.log('\n=== SEARCHING FOR TARGET SPECIALTIES ===');

    targetSpecialties.forEach(target => {
      const matches = allSpecialties.filter(spec =>
        spec.name.toLowerCase().includes(target.toLowerCase())
      );

      if (matches.length > 0) {
        console.log(`\nPotential matches for "${target}":`);
        matches.forEach(match => {
          console.log(`  - ${match.name} (${match.programArea})`);
        });
      } else {
        console.log(`\nNo matches found for "${target}"`);
      }
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error checking specialties:', error.message);
    process.exit(1);
  }
}

// Run the function
checkCurrentSpecialties();