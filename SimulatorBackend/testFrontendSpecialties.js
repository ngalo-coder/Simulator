import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CaseService from './src/services/caseService.js';

dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

async function testFrontendSpecialties() {
  await connectToDatabase();
  
  console.log('=== Testing Frontend Specialty Display ===\n');
  
  try {
    // Test what the frontend would see for Basic Program
    console.log('=== Basic Program Specialties (Frontend View) ===');
    const basicCategories = await CaseService.getCaseCategories('Basic Program');
    console.log('Available specialties:', basicCategories.specialties);
    console.log('Specialty counts:', basicCategories.specialty_counts);
    
    // Check if allied health specialties are included
    const alliedHealthInBasic = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology'];
    console.log('\nAllied health specialties in Basic Program:');
    alliedHealthInBasic.forEach(specialty => {
      const count = basicCategories.specialty_counts[specialty] || 0;
      console.log(`  - ${specialty}: ${count} cases ${count > 0 ? '✅' : '❌'}`);
    });
    
    // Test what the frontend would see for Specialty Program
    console.log('\n=== Specialty Program Specialties (Frontend View) ===');
    const specialtyCategories = await CaseService.getCaseCategories('Specialty Program');
    console.log('Available specialties:', specialtyCategories.specialties);
    console.log('Specialty counts:', specialtyCategories.specialty_counts);
    
    // Check if ophthalmology is included
    console.log('\nOphthalmology in Specialty Program:');
    const ophthalmologyCount = specialtyCategories.specialty_counts['Ophthalmology'] || 0;
    console.log(`  - Ophthalmology: ${ophthalmologyCount} cases ${ophthalmologyCount > 0 ? '✅' : '❌'}`);
    
    // Verify frontend configuration matches
    console.log('\n=== Frontend Configuration Verification ===');
    const frontendConfigSpecialties = [
      'General Surgery', 'Internal Medicine', 'Pediatrics', 'Reproductive Health', 
      'Emergency Medicine', 'Cardiology', 'Neurology', 'Psychiatry',
      'Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'
    ];
    
    const allAvailableSpecialties = [...new Set([
      ...basicCategories.specialties,
      ...specialtyCategories.specialties
    ])].filter(Boolean);
    
    console.log('All available specialties from backend:', allAvailableSpecialties.sort());
    console.log('Frontend configured specialties:', frontendConfigSpecialties.sort());
    
    // Check for missing specialties
    const missingFromFrontend = allAvailableSpecialties.filter(spec => 
      !frontendConfigSpecialties.includes(spec)
    );
    
    const missingFromBackend = frontendConfigSpecialties.filter(spec => 
      !allAvailableSpecialties.includes(spec)
    );
    
    console.log('Specialties missing from frontend config:', missingFromFrontend);
    console.log('Specialties in frontend config but not in backend:', missingFromBackend);
    
    if (missingFromFrontend.length === 0 && missingFromBackend.length === 0) {
      console.log('✅ Frontend configuration matches backend specialties perfectly!');
    } else {
      console.log('⚠️  Frontend/backend specialty mismatch detected');
    }
    
  } catch (error) {
    console.error('Error testing frontend specialties:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

testFrontendSpecialties().catch(console.error);