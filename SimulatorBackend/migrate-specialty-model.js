import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';

dotenv.config();

async function migrateSpecialtyModel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulatech');
    console.log('Connected to MongoDB');

    // Get all specialties
    const specialties = await Specialty.find({});
    console.log(`Found ${specialties.length} specialties to migrate`);

    // Migration mapping from old programArea string to new programArea enum
    const migrationMap = {
      'Basic Program': 'basic',
      'Specialty Program': 'specialty',
      'Advanced Program': 'specialty', // Advanced Program specialties go to specialty
      'basic': 'basic',
      'specialty': 'specialty'
    };

    let migratedCount = 0;

    for (const specialty of specialties) {
      // Force migration for all records to ensure correct enum values

      // Determine the new programArea value
      let newProgramArea = 'basic'; // default

      if (specialty.programArea) {
        // Handle object IDs - convert to specialty
        if (specialty.programArea.toString().match(/^[0-9a-fA-F]{24}$/)) {
          newProgramArea = 'specialty';
        } else {
          // Handle string values
          newProgramArea = migrationMap[specialty.programArea] || 'basic';
        }
      }

      // Update the specialty
      await Specialty.updateOne(
        { _id: specialty._id },
        {
          $set: {
            programArea: newProgramArea
          },
          $unset: {
            programAreas: 1 // Remove the old field
          }
        }
      );

      console.log(`Migrated ${specialty.name}: ${specialty.programAreas || 'none'} -> ${newProgramArea}`);
      migratedCount++;
    }

    console.log(`Migration completed. Migrated ${migratedCount} specialties.`);

    // Verify migration
    const updatedSpecialties = await Specialty.find({}).select('name programArea programAreas');
    console.log('\nVerification - Updated specialties:');
    updatedSpecialties.forEach(s => {
      console.log(`${s.name}: programArea=${s.programArea}, programAreas=${s.programAreas || 'removed'}`);
    });

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateSpecialtyModel();