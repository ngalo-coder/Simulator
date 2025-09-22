import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './src/models/CaseModel.js';
import Specialty from './src/models/SpecialtyModel.js';
import connectDB from './src/config/db.js';

dotenv.config();

async function checkInternalMedicineCases() {
  try {
    console.log('🔍 Checking Internal Medicine cases and program area assignments...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Check Internal Medicine specialty configuration
    const internalMedicineSpecialty = await Specialty.findOne({ name: 'Internal Medicine' });
    console.log('📋 Internal Medicine specialty configuration:');
    console.log(`   - Name: ${internalMedicineSpecialty.name}`);
    console.log(`   - Program Area: ${internalMedicineSpecialty.programArea}`);
    console.log(`   - Is Visible: ${internalMedicineSpecialty.isVisible}`);
    console.log(`   - Program Areas: [${internalMedicineSpecialty.programAreas.join(', ')}]`);

    // Check actual Internal Medicine cases
    console.log('\n📊 Internal Medicine cases in database:');
    const internalMedicineCases = await Case.find({
      'case_metadata.specialty': 'Internal Medicine'
    }).select('case_metadata.title case_metadata.specialty case_metadata.program_area status');

    console.log(`Found ${internalMedicineCases.length} Internal Medicine cases:`);
    internalMedicineCases.forEach(caseData => {
      console.log(`   - "${caseData.case_metadata.title}" (${caseData.case_metadata.program_area}) [${caseData.status}]`);
    });

    // Check program area distribution
    console.log('\n📈 Program area distribution for Internal Medicine cases:');
    const programAreaCounts = {};
    internalMedicineCases.forEach(caseData => {
      const programArea = caseData.case_metadata.program_area;
      programAreaCounts[programArea] = (programAreaCounts[programArea] || 0) + 1;
    });

    Object.entries(programAreaCounts).forEach(([programArea, count]) => {
      console.log(`   - ${programArea}: ${count} cases`);
    });

    // Check if there are any Internal Medicine cases in Specialty Program
    const specialtyProgramCases = internalMedicineCases.filter(
      caseData => caseData.case_metadata.program_area === 'Specialty Program'
    );

    if (specialtyProgramCases.length > 0) {
      console.log('\n❌ Found Internal Medicine cases incorrectly assigned to Specialty Program:');
      specialtyProgramCases.forEach(caseData => {
        console.log(`   - "${caseData.case_metadata.title}" should be in Basic Program`);
      });

      // Fix the incorrect assignments
      console.log('\n🔧 Fixing incorrect program area assignments...');
      const updateResult = await Case.updateMany(
        {
          'case_metadata.specialty': 'Internal Medicine',
          'case_metadata.program_area': 'Specialty Program'
        },
        {
          $set: { 'case_metadata.program_area': 'Basic Program' }
        }
      );
      console.log(`✅ Fixed ${updateResult.modifiedCount} Internal Medicine cases`);
    } else {
      console.log('\n✅ All Internal Medicine cases are correctly assigned to Basic Program');
    }

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const updatedCases = await Case.find({
      'case_metadata.specialty': 'Internal Medicine'
    }).select('case_metadata.title case_metadata.program_area');

    const finalCounts = {};
    updatedCases.forEach(caseData => {
      const programArea = caseData.case_metadata.program_area;
      finalCounts[programArea] = (finalCounts[programArea] || 0) + 1;
    });

    console.log('Final program area distribution:');
    Object.entries(finalCounts).forEach(([programArea, count]) => {
      console.log(`   - ${programArea}: ${count} cases`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkInternalMedicineCases();