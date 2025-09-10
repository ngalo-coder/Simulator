import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkRadiologyCases() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const Case = (await import('./src/models/CaseModel.js')).default;
        
        // Check Radiology cases in both program areas
        const radiologyBasic = await Case.find({
            'case_metadata.specialty': 'Radiology',
            'case_metadata.program_area': 'Basic Program'
        }, 'case_metadata.case_id case_metadata.title case_metadata.program_area');
        
        const radiologySpecialty = await Case.find({
            'case_metadata.specialty': 'Radiology',
            'case_metadata.program_area': 'Specialty Program'
        }, 'case_metadata.case_id case_metadata.title case_metadata.program_area');

        console.log('Radiology cases in Basic Program:', radiologyBasic.length);
        radiologyBasic.forEach(caseDoc => {
            console.log(`  - ${caseDoc.case_metadata.title} (${caseDoc.case_metadata.case_id})`);
        });

        console.log('\nRadiology cases in Specialty Program:', radiologySpecialty.length);
        radiologySpecialty.forEach(caseDoc => {
            console.log(`  - ${caseDoc.case_metadata.title} (${caseDoc.case_metadata.case_id})`);
        });

        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        
    } catch (error) {
        console.error('Error checking radiology cases:', error);
        process.exit(1);
    }
}

checkRadiologyCases();