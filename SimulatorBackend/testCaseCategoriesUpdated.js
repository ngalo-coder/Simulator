import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testCaseCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const CaseService = (await import('./src/services/caseService.js')).default;
        
        console.log('Testing case categories API...\n');
        
        // Test without program_area filter
        console.log('=== All Case Categories ===');
        const allCategories = await CaseService.getCaseCategories();
        console.log('Program areas:', allCategories.program_areas);
        console.log('Specialties:', allCategories.specialties);
        console.log('Specialty counts:', allCategories.specialty_counts);
        
        console.log('\n=== Basic Program Categories ===');
        const basicCategories = await CaseService.getCaseCategories('Basic Program');
        console.log('Specialties:', basicCategories.specialties);
        console.log('Specialty counts:', basicCategories.specialty_counts);
        
        console.log('\n=== Specialty Program Categories ===');
        const specialtyCategories = await CaseService.getCaseCategories('Specialty Program');
        console.log('Specialties:', specialtyCategories.specialties);
        console.log('Specialty counts:', specialtyCategories.specialty_counts);
        
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        
    } catch (error) {
        console.error('Error testing case categories:', error);
        process.exit(1);
    }
}

testCaseCategories();