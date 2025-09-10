import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkCurrentCases() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const Case = (await import('./src/models/CaseModel.js')).default;
        
        // Get all cases with minimal fields
        const cases = await Case.find({}, 'case_metadata.case_id case_metadata.specialty case_metadata.program_area case_metadata.title');
        
        console.log('Total cases in database:', cases.length);
        console.log('\n=== Cases by Specialty ===');
        
        const casesBySpecialty = {};
        cases.forEach(caseDoc => {
            const specialty = caseDoc.case_metadata?.specialty || 'Unknown';
            if (!casesBySpecialty[specialty]) {
                casesBySpecialty[specialty] = [];
            }
            casesBySpecialty[specialty].push({
                id: caseDoc.case_metadata?.case_id,
                title: caseDoc.case_metadata?.title,
                program_area: caseDoc.case_metadata?.program_area
            });
        });

        // Display specialties with cases
        Object.keys(casesBySpecialty).sort().forEach(specialty => {
            console.log(`\n${specialty}: ${casesBySpecialty[specialty].length} cases`);
            casesBySpecialty[specialty].forEach(caseInfo => {
                console.log(`  - ${caseInfo.title} (${caseInfo.id}) - ${caseInfo.program_area}`);
            });
        });

        // Show program area distribution
        console.log('\n=== Program Area Distribution ===');
        const programAreaCount = {};
        cases.forEach(caseDoc => {
            const programArea = caseDoc.case_metadata?.program_area || 'Unknown';
            programAreaCount[programArea] = (programAreaCount[programArea] || 0) + 1;
        });
        
        Object.keys(programAreaCount).sort().forEach(programArea => {
            console.log(`${programArea}: ${programAreaCount[programArea]} cases`);
        });

        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        
    } catch (error) {
        console.error('Error checking cases:', error);
        process.exit(1);
    }
}

checkCurrentCases();