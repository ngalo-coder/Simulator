import mongoose from 'mongoose';
import Case from '../src/models/CaseModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enhanced Internal Medicine sub-specialties categorization
const INTERNAL_MEDICINE_CATEGORIES = {
    CARDIOLOGY: {
        name: "Cardiology",
        description: "Heart and cardiovascular system disorders",
        keywords: ['chest pain', 'heart', 'cardiac', 'hypertension', 'myocardial', 'angina', 'arrhythmia', 'ecg', 'heart failure'],
        color: '#DC2626', // Red
        icon: 'heart'
    },
    PULMONOLOGY: {
        name: "Pulmonology",
        description: "Respiratory system and lung disorders",
        keywords: ['cough', 'breathing', 'asthma', 'copd', 'pneumonia', 'respiratory', 'lung', 'bronchitis', 'spirometry'],
        color: '#0891B2', // Blue
        icon: 'lungs'
    },
    GASTROENTEROLOGY: {
        name: "Gastroenterology",
        description: "Digestive system disorders",
        keywords: ['abdominal', 'stomach', 'gi', 'gastro', 'liver', 'ibd', 'hepatitis', 'diarrhea', 'constipation'],
        color: '#65A30D', // Green
        icon: 'stomach'
    },
    ENDOCRINOLOGY: {
        name: "Endocrinology",
        description: "Hormonal and metabolic disorders",
        keywords: ['diabetes', 'thyroid', 'hormone', 'metabolic', 'glucose', 'insulin', 'thyroid', 'cushing'],
        color: '#CA8A04', // Yellow
        icon: 'hormones'
    },
    NEPHROLOGY: {
        name: "Nephrology",
        description: "Kidney and urinary system disorders",
        keywords: ['kidney', 'renal', 'dialysis', 'creatinine', 'urine', 'nephrotic', 'proteinuria', 'hematuria'],
        color: '#7C3AED', // Purple
        icon: 'kidney'
    },
    INFECTIOUS_DISEASE: {
        name: "Infectious Disease",
        description: "Infections and communicable diseases",
        keywords: ['fever', 'infection', 'antibiotic', 'sepsis', 'hiv', 'tb', 'viral', 'bacterial', 'malaria'],
        color: '#DB2777', // Pink
        icon: 'infection'
    },
    RHEUMATOLOGY: {
        name: "Rheumatology",
        description: "Joint and autoimmune disorders",
        keywords: ['joint', 'arthritis', 'lupus', 'inflammatory', 'autoimmune', 'pain', 'rheumatoid', 'osteoarthritis'],
        color: '#EA580C', // Orange
        icon: 'joint'
    },
    NEUROLOGY: {
        name: "Neurology",
        description: "Nervous system disorders",
        keywords: ['headache', 'seizure', 'stroke', 'neurological', 'migraine', 'weakness', 'paralysis', 'dementia'],
        color: '#4F46E5', // Indigo
        icon: 'brain'
    },
    HEMATOLOGY: {
        name: "Hematology",
        description: "Blood disorders",
        keywords: ['anemia', 'blood', 'bleeding', 'clot', 'leukemia', 'lymphoma', 'coagulation', 'hemoglobin'],
        color: '#DC2626', // Red
        icon: 'blood'
    },
    ONCOLOGY: {
        name: "Oncology",
        description: "Cancer and malignant disorders",
        keywords: ['cancer', 'tumor', 'chemotherapy', 'malignancy', 'oncology', 'metastasis', 'biopsy'],
        color: '#475569', // Gray
        icon: 'cancer'
    },
    GENERAL_MEDICINE: {
        name: "General Internal Medicine",
        description: "Primary care and general medical conditions",
        keywords: ['general', 'primary care', 'routine', 'checkup', 'preventive', 'screening', 'health maintenance'],
        color: '#6B7280', // Gray
        icon: 'stethoscope'
    }
};

function categorizeCase(caseData) {
    const title = caseData.case_metadata?.title?.toLowerCase() || '';
    const description = caseData.description?.toLowerCase() || '';
    const chiefComplaint = caseData.patient_persona?.chief_complaint?.toLowerCase() || '';
    const hiddenDiagnosis = caseData.clinical_dossier?.hidden_diagnosis?.toLowerCase() || '';
    
    const allText = `${title} ${description} ${chiefComplaint} ${hiddenDiagnosis}`;
    
    // Check for matches with each category
    for (const [categoryKey, category] of Object.entries(INTERNAL_MEDICINE_CATEGORIES)) {
        for (const keyword of category.keywords) {
            if (allText.includes(keyword.toLowerCase())) {
                return categoryKey;
            }
        }
    }
    
    return 'GENERAL_MEDICINE';
}

async function createInternalMedicineCategorization() {
    try {
        // Connect to MongoDB
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all Internal Medicine cases
        const internalMedicineCases = await Case.find({ 
            'case_metadata.specialty': 'Internal Medicine' 
        }).lean();

        console.log(`Categorizing ${internalMedicineCases.length} Internal Medicine cases...\n`);

        // Categorize cases
        const categorizedCases = {};
        Object.keys(INTERNAL_MEDICINE_CATEGORIES).forEach(category => {
            categorizedCases[category] = [];
        });

        for (const caseData of internalMedicineCases) {
            const category = categorizeCase(caseData);
            categorizedCases[category].push({
                caseId: caseData.case_metadata?.case_id,
                title: caseData.case_metadata?.title,
                difficulty: caseData.case_metadata?.difficulty,
                chiefComplaint: caseData.patient_persona?.chief_complaint,
                diagnosis: caseData.clinical_dossier?.hidden_diagnosis
            });
        }

        // Print categorization results
        console.log('=== INTERNAL MEDICINE CASE CATEGORIZATION ===\n');
        
        let totalCategorized = 0;
        Object.entries(categorizedCases).forEach(([categoryKey, cases]) => {
            if (cases.length > 0) {
                const category = INTERNAL_MEDICINE_CATEGORIES[categoryKey];
                console.log(`📁 ${category.name} (${cases.length} cases - ${((cases.length/internalMedicineCases.length)*100).toFixed(1)}%)`);
                console.log(`   ${category.description}`);
                console.log(`   Color: ${category.color}, Icon: ${category.icon}`);
                
                // Show sample cases
                cases.slice(0, 3).forEach(caseItem => {
                    console.log(`   • ${caseItem.caseId}: ${caseItem.title} (${caseItem.difficulty})`);
                    console.log(`     Complaint: ${caseItem.chiefComplaint}`);
                    console.log(`     Diagnosis: ${caseItem.diagnosis}`);
                });
                
                if (cases.length > 3) {
                    console.log(`   ... and ${cases.length - 3} more cases`);
                }
                console.log('');
                totalCategorized += cases.length;
            }
        });

        // Summary
        console.log('=== CATEGORIZATION SUMMARY ===');
        console.log(`Total cases: ${internalMedicineCases.length}`);
        console.log(`Successfully categorized: ${totalCategorized}`);
        console.log(`Uncategorized: ${internalMedicineCases.length - totalCategorized}`);

        // Recommended learning progression
        console.log('\n=== RECOMMENDED LEARNING PROGRESSION ===');
        console.log('1. Start with General Internal Medicine cases (foundational skills)');
        console.log('2. Move to common sub-specialties: Cardiology, Pulmonology, Gastroenterology');
        console.log('3. Progress to complex specialties: Neurology, Rheumatology, Nephrology');
        console.log('4. Advanced cases: Oncology, Hematology, complex Infectious Diseases');
        console.log('5. Mix difficulty levels within each specialty for comprehensive training');

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');

    } catch (error) {
        console.error('Error creating Internal Medicine categorization:', error);
        process.exit(1);
    }
}

// Run the categorization
createInternalMedicineCategorization()
    .then(() => {
        console.log('\n✅ Internal Medicine case categorization completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Categorization failed:', error);
        process.exit(1);
    });