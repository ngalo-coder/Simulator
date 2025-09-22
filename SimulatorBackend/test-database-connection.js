import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';
import connectDB from './src/config/db.js';

dotenv.config();

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection and Specialty Queries...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database successfully');

    // Test 1: Count specialties
    console.log('\n1. Testing specialty count...');
    const count = await Specialty.countDocuments();
    console.log(`📊 Found ${count} specialties in database`);

    // Test 2: Get sample specialties
    console.log('\n2. Testing specialty retrieval...');
    const specialties = await Specialty.find({}).limit(5).select('name isVisible programAreas');
    console.log('📋 Sample specialties:');
    specialties.forEach(specialty => {
      console.log(`   - ${specialty.name}: visible=${specialty.isVisible}, programAreas=[${specialty.programAreas.join(', ')}]`);
    });

    // Test 3: Test specialty visibility update
    console.log('\n3. Testing specialty visibility update...');
    const updateResult = await Specialty.updateOne(
      { name: 'Internal Medicine' },
      {
        $set: {
          isVisible: false,
          programAreas: ['basic'],
          lastModified: new Date(),
          modifiedBy: 'test_script'
        }
      }
    );
    console.log(`✅ Update result: ${updateResult.modifiedCount} document(s) modified`);

    // Test 4: Verify the update
    console.log('\n4. Verifying the update...');
    const updatedSpecialty = await Specialty.findOne({ name: 'Internal Medicine' }).select('name isVisible programAreas lastModified');
    console.log(`📋 Updated specialty: ${updatedSpecialty.name}`);
    console.log(`   - Visible: ${updatedSpecialty.isVisible}`);
    console.log(`   - Program Areas: [${updatedSpecialty.programAreas.join(', ')}]`);
    console.log(`   - Last Modified: ${updatedSpecialty.lastModified}`);

    // Test 5: Test the API response format
    console.log('\n5. Testing API response format...');
    const allSpecialties = await Specialty.find({}).select('name isVisible programAreas lastModified modifiedBy');
    const visibilitySettings = {
      specialties: allSpecialties.map(specialty => ({
        specialtyId: specialty.name.toLowerCase().replace(/\s+/g, '_'),
        isVisible: specialty.isVisible,
        programAreas: specialty.programAreas,
        lastModified: specialty.lastModified,
        modifiedBy: specialty.modifiedBy
      }))
    };

    console.log(`📊 API response format: ${visibilitySettings.specialties.length} specialties`);
    console.log('📋 Sample API response:');
    console.log(JSON.stringify(visibilitySettings.specialties[0], null, 2));

    console.log('\n✅ All database tests passed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testDatabaseConnection();