import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkRadiologySpecialty() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const Specialty = (await import('./src/models/SpecialtyModel.js')).default;
        
        // Check Radiology specialty program area
        const radiologySpecialty = await Specialty.findOne({ name: 'Radiology' });
        
        if (radiologySpecialty) {
            console.log('Radiology specialty details:');
            console.log(`- Name: ${radiologySpecialty.name}`);
            console.log(`- Program Area: ${radiologySpecialty.programArea}`);
            console.log(`- Active: ${radiologySpecialty.active}`);
        } else {
            console.log('Radiology specialty not found in database');
        }

        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        
    } catch (error) {
        console.error('Error checking radiology specialty:', error);
        process.exit(1);
    }
}

checkRadiologySpecialty();