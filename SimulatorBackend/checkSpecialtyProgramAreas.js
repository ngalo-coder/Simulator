import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkSpecialtyProgramAreas() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const Specialty = (await import('./src/models/SpecialtyModel.js')).default;
        
        // Get all specialties with their program areas
        const specialties = await Specialty.find({ active: true }, 'name programArea').sort('programArea name');
        
        console.log('=== Specialties by Program Area ===');
        
        const specialtiesByProgramArea = {};
        specialties.forEach(specialty => {
            const programArea = specialty.programArea || 'Unknown';
            if (!specialtiesByProgramArea[programArea]) {
                specialtiesByProgramArea[programArea] = [];
            }
            specialtiesByProgramArea[programArea].push(specialty.name);
        });

        Object.keys(specialtiesByProgramArea).sort().forEach(programArea => {
            console.log(`\n${programArea}:`);
            specialtiesByProgramArea[programArea].forEach(specialty => {
                console.log(`  - ${specialty}`);
            });
        });

        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        
    } catch (error) {
        console.error('Error checking specialty program areas:', error);
        process.exit(1);
    }
}

checkSpecialtyProgramAreas();