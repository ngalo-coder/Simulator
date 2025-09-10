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

async function checkFrontendSpecialties() {
  await connectToDatabase();
  
  console.log('=== Checking Frontend Specialty Configuration ===\n');
  
  try {
    // Get all case categories to see what specialties are available
    const categories = await CaseService.getCaseCategories();
    
    console.log('Available program areas:', categories.program_areas);
    console.log('Available specialties:', categories.specialties);
    console.log('Specialty counts:', categories.specialty_counts);
    
    // Check Basic Program specialties
    console.log('\n=== Basic Program Specialties ===');
    const basicCategories = await CaseService.getCaseCategories({ program_area: 'Basic Program' });
    console.log('Basic Program specialties:', basicCategories.specialties);
    console.log('Basic Program specialty counts:', basicCategories.specialty_counts);
    
    // Check Specialty Program specialties  
    console.log('\n=== Specialty Program Specialties ===');
    const specialtyCategories = await CaseService.getCaseCategories({ program_area: 'Specialty Program' });
    console.log('Specialty Program specialties:', specialtyCategories.specialties);
    console.log('Specialty Program specialty counts:', specialtyCategories.specialty_counts);
    
    // Check which allied health specialties are missing from frontend config
    const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
    const frontendConfigSpecialties = [
      'General Surgery', 'Internal Medicine', 'Pediatrics', 'Reproductive Health', 
      'Emergency Medicine', 'Cardiology', 'Neurology', 'Psychiatry'
    ];
    
    console.log('\n=== Frontend Configuration Analysis ===');
    console.log('Allied health specialties:', alliedHealthSpecialties);
    console.log('Frontend configured specialties:', frontendConfigSpecialties);
    
    const missingAlliedHealth = alliedHealthSpecialties.filter(spec => !frontendConfigSpecialties.includes(spec));
    console.log('Allied health specialties missing from frontend config:', missingAlliedHealth);
    
    // Check if these specialties exist in the database
    console.log('\n=== Database Presence Check ===');
    for (const specialty of missingAlliedHealth) {
      const cases = await mongoose.connection.db.collection('cases').countDocuments({
        'case_metadata.specialty': specialty,
        status: 'published'
      });
      console.log(`${specialty}: ${cases} published cases`);
    }
    
  } catch (error) {
    console.error('Error checking specialties:', error);
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

checkFrontendSpecialties().catch(console.error);