import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fixRadiologyCases() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const Case = (await import('./src/models/CaseModel.js')).default;
        
        // Find and update Radiology cases to have correct program_area
        const result = await Case.updateMany(
            { 'case_metadata.specialty': 'Radiology' },
            { $set: { 'case_metadata.program_area': 'Specialty Program' } }
        );

        console.log(`Updated ${result.modifiedCount} Radiology cases to Specialty Program`);
        
        // Verify the fix
        const radiologyBasic = await Case.countDocuments({
            'case_metadata.specialty': 'Radiology',
            'case_metadata.program_area': 'Basic Program'
        });
        
        const radiologySpecialty = await Case.countDocuments({
            'case_metadata.specialty': 'Radiology',
            'case_metadata.program_area': 'Specialty Program'
        });

        console.log(`Radiology cases in Basic Program: ${radiologyBasic}`);
        console.log(`Radiology cases in Specialty Program: ${radiologySpecialty}`);

        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        
    } catch (error) {
        console.error('Error fixing radiology cases:', error);
        process.exit(1);
    }
}

fixRadiologyCases();