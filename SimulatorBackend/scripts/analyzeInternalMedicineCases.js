import mongoose from 'mongoose';
import Case from '../src/models/CaseModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Common Internal Medicine sub-specialties for categorization
const INTERNAL_MEDICINE_SUBSPECIALTIES = {
    CARDIOLOGY: ['chest pain', 'heart', 'cardiac', 'hypertension', 'myocardial', 'angina', 'arrhythmia'],
    PULMONOLOGY: ['cough', 'breathing', 'asthma', 'copd', 'pneumonia', 'respiratory', 'lung'],
    GASTROENTEROLOGY: ['abdominal', 'stomach', 'gi', 'gastro', 'liver', 'ibd', 'hepatitis'],
    ENDOCRINOLOGY: ['diabetes', 'thyroid', 'hormone', 'metabolic', 'glucose', 'insulin'],
    NEPHROLOGY: ['kidney', 'renal', 'dialysis', 'creatinine', 'urine', 'nephrotic'],
    INFECTIOUS_DISEASE: ['fever', 'infection', 'antibiotic', 'sepsis', 'hiv', 'tb', 'viral'],
    RHEUMATOLOGY: ['joint', 'arthritis', 'lupus', 'inflammatory', 'autoimmune', 'pain'],
    NEUROLOGY: ['headache', 'seizure', 'stroke', 'neurological', 'migraine', 'weakness'],
    HEMATOLOGY: ['anemia', 'blood', 'bleeding', 'clot', 'leukemia', 'lymphoma'],
    ONCOLOGY: ['cancer', 'tumor', 'chemotherapy', 'malignancy', 'oncology'],
    GENERAL: ['general', 'primary care', 'routine', 'checkup', 'preventive']
};

function categorizeCaseByContent(caseData) {
    const title = caseData.case_metadata?.title?.toLowerCase() || '';
    const description = caseData.description?.toLowerCase() || '';
    const chiefComplaint = caseData.patient_persona?.chief_complaint?.toLowerCase() || '';
    const hiddenDiagnosis = caseData.clinical_dossier?.hidden_diagnosis?.toLowerCase() || '';
    
    const allText = `${title} ${description} ${chiefComplaint} ${hiddenDiagnosis}`;
    
    // Check for matches with each sub-specialty
    for (const [specialty, keywords] of Object.entries(INTERNAL_MEDICINE_SUBSPECIALTIES)) {
        for (const keyword of keywords) {
            if (allText.includes(keyword.toLowerCase())) {
                return specialty;
            }
        }
    }
    
    return 'GENERAL';
}

async function analyzeInternalMedicineCases() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulator');
        console.log('Connected to MongoDB');

        // Get all Internal Medicine cases
        const internalMedicineCases = await Case.find({ 
            'case_metadata.specialty': 'Internal Medicine' 
        }).lean();

        console.log(`Total Internal Medicine cases: ${internalMedicineCases.length}`);

        // Categorize by difficulty
        const difficultyCounts = {
            Easy: 0,
            Intermediate: 0,
            Hard: 0
        };

        // Categorize by sub-specialty
        const specialtyCounts = {};
        Object.keys(INTERNAL_MEDICINE_SUBSPECIALTIES).forEach(spec => {
            specialtyCounts[spec] = 0;
        });

        // Categorize by location
        const locationCounts = {};

        // Detailed analysis
        const caseAnalysis = [];

        for (const caseData of internalMedicineCases) {
            // Count by difficulty
            const difficulty = caseData.case_metadata?.difficulty || 'Unknown';
            if (difficultyCounts.hasOwnProperty(difficulty)) {
                difficultyCounts[difficulty]++;
            }

            // Count by location
            const location = caseData.case_metadata?.location || 'Unknown';
            locationCounts[location] = (locationCounts[location] || 0) + 1;

            // Categorize by content
            const specialty = categorizeCaseByContent(caseData);
            specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;

            // Store detailed analysis
            caseAnalysis.push({
                caseId: caseData.case_metadata?.case_id,
                title: caseData.case_metadata?.title,
                difficulty: difficulty,
                location: location,
                specialty: specialty,
                chiefComplaint: caseData.patient_persona?.chief_complaint,
                hiddenDiagnosis: caseData.clinical_dossier?.hidden_diagnosis
            });
        }

        // Print summary
        console.log('\n=== DIFFICULTY DISTRIBUTION ===');
        Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
            console.log(`${difficulty}: ${count} cases (${((count/internalMedicineCases.length)*100).toFixed(1)}%)`);
        });

        console.log('\n=== SUB-SPECIALTY DISTRIBUTION ===');
        Object.entries(specialtyCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([specialty, count]) => {
                if (count > 0) {
                    console.log(`${specialty}: ${count} cases (${((count/internalMedicineCases.length)*100).toFixed(1)}%)`);
                }
            });

        console.log('\n=== LOCATION DISTRIBUTION ===');
        Object.entries(locationCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([location, count]) => {
                console.log(`${location}: ${count} cases`);
            });

        // Print sample cases from each category
        console.log('\n=== SAMPLE CASES FROM EACH SUB-SPECIALTY ===');
        const samples = {};
        for (const caseData of caseAnalysis) {
            if (!samples[caseData.specialty] && caseAnalysis.filter(c => c.specialty === caseData.specialty).length > 0) {
                samples[caseData.specialty] = caseData;
            }
        }

        Object.entries(samples).forEach(([specialty, caseData]) => {
            console.log(`\n${specialty}:`);
            console.log(`  Case ID: ${caseData.caseId}`);
            console.log(`  Title: ${caseData.title}`);
            console.log(`  Chief Complaint: ${caseData.chiefComplaint}`);
            console.log(`  Diagnosis: ${caseData.hiddenDiagnosis}`);
            console.log(`  Difficulty: ${caseData.difficulty}`);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        
        return {
            totalCases: internalMedicineCases.length,
            difficultyCounts,
            specialtyCounts,
            locationCounts,
            caseAnalysis
        };

    } catch (error) {
        console.error('Error analyzing Internal Medicine cases:', error);
        process.exit(1);
    }
}

// Run the analysis
analyzeInternalMedicineCases()
    .then(analysis => {
        console.log('\n✅ Internal Medicine case analysis completed successfully!');
        console.log(`\nTotal cases analyzed: ${analysis.totalCases}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('Analysis failed:', error);
        process.exit(1);
    });