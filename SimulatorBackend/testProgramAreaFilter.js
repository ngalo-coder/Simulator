import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CaseService } from './src/services/caseService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual-patient-simulator';

async function testProgramAreaFilter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully\n');

    // Test 1: Get all categories (no filter)
    console.log('=== Test 1: Get all categories (no filter) ===');
    const allCategories = await CaseService.getCaseCategories();
    console.log('Program Areas:', allCategories.program_areas);
    console.log('All Specialties:', allCategories.specialties);
    console.log('Total Specialties:', allCategories.specialties.length);
    console.log('Specialty Counts:', JSON.stringify(allCategories.specialty_counts, null, 2));
    console.log();

    // Test 2: Filter by 'Basic Program'
    console.log('=== Test 2: Filter by "Basic Program" ===');
    const basicCategories = await CaseService.getCaseCategories('Basic Program');
    console.log('Specialties in Basic Program:', basicCategories.specialties);
    console.log('Total:', basicCategories.specialties.length);
    console.log('Specialty Counts:', JSON.stringify(basicCategories.specialty_counts, null, 2));
    console.log();

    // Test 3: Filter by 'Specialty Program'
    console.log('=== Test 3: Filter by "Specialty Program" ===');
    const specialtyCategories = await CaseService.getCaseCategories('Specialty Program');
    console.log('Specialties in Specialty Program:', specialtyCategories.specialties);
    console.log('Total:', specialtyCategories.specialties.length);
    console.log('Specialty Counts:', JSON.stringify(specialtyCategories.specialty_counts, null, 2));
    console.log();

    // Test 4: Check Specialty model data
    console.log('=== Test 4: Check Specialty Model Data ===');
    const Specialty = mongoose.model('Specialty');
    const allSpecialties = await Specialty.find({ active: true, isVisible: true }, 'name programArea').lean();
    console.log('\nAll Specialties from DB:');
    allSpecialties.forEach(s => {
      console.log(`  - ${s.name}: ${s.programArea}`);
    });

    const basicSpecialties = allSpecialties.filter(s => s.programArea === 'basic');
    const specialtySpecialties = allSpecialties.filter(s => s.programArea === 'specialty');
    
    console.log(`\nBasic Program Modules (${basicSpecialties.length}):`, basicSpecialties.map(s => s.name));
    console.log(`Specialty Program Specialties (${specialtySpecialties.length}):`, specialtySpecialties.map(s => s.name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

testProgramAreaFilter();