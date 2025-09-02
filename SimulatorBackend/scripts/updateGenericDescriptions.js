import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from '../src/models/CaseModel.js';
import connectDB from '../src/config/db.js';

// Load environment variables
dotenv.config();

async function updateGenericDescriptions() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Find cases with generic descriptions
        const genericDescriptions = [
            "A universal template for creating virtual patient simulation cases. Fill in the bracketed placeholders to define a new patient scenario.",
            "Program-specific AI-generated virtual patient case.",
            "AI-generated virtual patient case."
        ];

        const casesToUpdate = await Case.find({
            description: { $in: genericDescriptions }
        });

        console.log(`📋 Found ${casesToUpdate.length} cases with generic descriptions`);

        let updatedCount = 0;

        for (const caseDoc of casesToUpdate) {
            const metadata = caseDoc.case_metadata;
            const patient = caseDoc.patient_persona;
            
            if (metadata && patient) {
                // Create a meaningful description based on the case data
                const age = patient.age || 'Adult';
                const gender = patient.gender || 'Patient';
                const complaint = patient.chief_complaint || metadata.title || 'medical concern';
                const specialty = metadata.specialty || 'medical';
                
                const newDescription = `A ${age}-year-old ${gender.toLowerCase()} presents with ${complaint.toLowerCase()}. Practice your clinical skills in this ${specialty.toLowerCase()} case.`;
                
                // Update the case
                await Case.updateOne(
                    { _id: caseDoc._id },
                    { $set: { description: newDescription } }
                );
                
                updatedCount++;
                console.log(`✅ Updated case ${metadata.case_id}: "${newDescription}"`);
            }
        }

        console.log(`\n🎉 Successfully updated ${updatedCount} cases`);
        
    } catch (error) {
        console.error('❌ Error updating descriptions:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the update
updateGenericDescriptions();