import mongoose from 'mongoose';
import Case from '../src/models/CaseModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function countInternalMedicineCases() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulator');
        console.log('Connected to MongoDB');

        // Count cases with specialty "Internal Medicine"
        const count = await Case.countDocuments({ 
            'case_metadata.specialty': 'Internal Medicine' 
        });

        console.log(`Number of Internal Medicine cases: ${count}`);

        // Also get the list of all specialties to verify
        const specialties = await Case.distinct('case_metadata.specialty');
        console.log('\nAll available specialties:');
        specialties.forEach(spec => console.log(`- ${spec}`));

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        
        return count;
    } catch (error) {
        console.error('Error counting Internal Medicine cases:', error);
        process.exit(1);
    }
}

// Run the function
countInternalMedicineCases()
    .then(count => {
        console.log(`\n✅ Total Internal Medicine cases: ${count}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });