import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from '../src/models/SpecialtyModel.js';
import connectDB from '../src/config/db.js';

dotenv.config();

async function migrateSpecialtyVisibility() {
  try {
    console.log('🚀 Starting specialty visibility migration...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all existing specialties
    const existingSpecialties = await Specialty.find({});
    console.log(`📊 Found ${existingSpecialties.length} existing specialties`);

    // Define default visibility settings for each specialty
    const defaultVisibilitySettings = {
      'Internal Medicine': {
        isVisible: true,
        programAreas: ['basic', 'specialty']
      },
      'Surgery': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Pediatrics': {
        isVisible: true,
        programAreas: ['basic', 'specialty']
      },
      'Ophthalmology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'ENT': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Cardiology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Neurology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Psychiatry': {
        isVisible: true,
        programAreas: ['basic', 'specialty']
      },
      'Family Medicine': {
        isVisible: true,
        programAreas: ['basic']
      },
      'Obstetrics & Gynecology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Dermatology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Orthopedics': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Radiology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Pathology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Anesthesiology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Nursing': {
        isVisible: true,
        programAreas: ['basic']
      },
      'Laboratory': {
        isVisible: true,
        programAreas: ['basic']
      },
      'Gastroenterology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Oncology': {
        isVisible: true,
        programAreas: ['specialty']
      },
      'Reproductive Health': {
        isVisible: true,
        programAreas: ['specialty']
      }
    };

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each specialty with visibility settings
    for (const specialty of existingSpecialties) {
      const specialtyName = specialty.name;
      const defaultSettings = defaultVisibilitySettings[specialtyName];

      if (defaultSettings) {
        // Update with specific settings
        const result = await Specialty.updateOne(
          { _id: specialty._id },
          {
            $set: {
              isVisible: defaultSettings.isVisible,
              programAreas: defaultSettings.programAreas,
              lastModified: new Date(),
              modifiedBy: 'migration_script'
            }
          }
        );

        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`✅ Updated ${specialtyName}: visible=${defaultSettings.isVisible}, programAreas=[${defaultSettings.programAreas.join(', ')}]`);
        } else {
          skippedCount++;
          console.log(`⚠️  No changes needed for ${specialtyName}`);
        }
      } else {
        // Set default visibility for specialties not in our mapping
        const result = await Specialty.updateOne(
          { _id: specialty._id },
          {
            $set: {
              isVisible: true,
              programAreas: ['basic', 'specialty'],
              lastModified: new Date(),
              modifiedBy: 'migration_script'
            }
          }
        );

        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`✅ Updated ${specialtyName} with default settings: visible=true, programAreas=[basic, specialty]`);
        } else {
          skippedCount++;
          console.log(`⚠️  No changes needed for ${specialtyName}`);
        }
      }
    }

    console.log(`\n📋 Migration Summary:`);
    console.log(`   • Updated: ${updatedCount} specialties`);
    console.log(`   • Skipped: ${skippedCount} specialties`);
    console.log(`   • Total: ${existingSpecialties.length} specialties`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const sampleSpecialties = await Specialty.find({}).limit(5).select('name isVisible programAreas');
    console.log('Sample specialties after migration:');
    sampleSpecialties.forEach(specialty => {
      console.log(`  - ${specialty.name}: visible=${specialty.isVisible}, programAreas=[${specialty.programAreas.join(', ')}]`);
    });

    console.log('\n✅ Specialty visibility migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateSpecialtyVisibility();