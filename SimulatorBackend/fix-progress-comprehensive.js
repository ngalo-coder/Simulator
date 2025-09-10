import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PerformanceMetrics from './src/models/PerformanceMetricsModel.js';
import ClinicianProgress from './src/models/ClinicianProgressModel.js';
import User from './src/models/UserModel.js';
import Case from './src/models/CaseModel.js';

dotenv.config();

// Enhanced difficulty mapping to handle all variations
const normalizeDifficulty = (difficulty) => {
    if (!difficulty) return 'Beginner';
    
    const difficultyLower = difficulty.toLowerCase();
    
    if (difficultyLower.includes('easy') || difficultyLower.includes('beginner')) {
        return 'Beginner';
    } else if (difficultyLower.includes('intermediate') || difficultyLower.includes('medium')) {
        return 'Intermediate';
    } else if (difficultyLower.includes('hard') || difficultyLower.includes('advanced') || difficultyLower.includes('expert')) {
        return 'Advanced';
    }
    
    // Default to Beginner for unknown values
    return 'Beginner';
};

const calculateProgressionLevel = (progress) => {
    if (progress.advancedCasesCompleted >= 10 && progress.advancedAverageScore > 80) {
        return 'Expert';
    } else if (progress.intermediateCasesCompleted >= 15 && progress.intermediateAverageScore > 75) {
        return 'Advanced';
    } else if (progress.beginnerCasesCompleted >= 10 && progress.beginnerAverageScore > 70) {
        return 'Intermediate';
    } else {
        return 'Beginner';
    }
};

async function fixProgressTracking() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🚀 COMPREHENSIVE PROGRESS TRACKING FIX');
        console.log('='.repeat(70));

        // Get all users who have performance records
        const usersWithPerformance = await PerformanceMetrics.distinct('user_ref');
        console.log(`👥 Found ${usersWithPerformance.length} users with performance records`);

        let totalFixed = 0;
        let totalErrors = 0;

        for (const userId of usersWithPerformance) {
            if (!userId) {
                console.log('⚠️  Skipping null user_ref');
                continue;
            }

            try {
                console.log(`\\n🔍 Processing user: ${userId}`);
                
                // Get user details
                const user = await User.findById(userId);
                if (!user) {
                    console.log(`❌ User ${userId} not found, skipping...`);
                    totalErrors++;
                    continue;
                }
                
                console.log(`👤 Processing: ${user.email}`);

                // Get all performance records for this user
                const performanceRecords = await PerformanceMetrics.find({ user_ref: userId })
                    .populate('case_ref', 'case_metadata.difficulty case_metadata.title case_metadata.case_id')
                    .sort({ createdAt: 1 });

                if (performanceRecords.length === 0) {
                    console.log(`   No performance records found`);
                    continue;
                }

                console.log(`   📊 Found ${performanceRecords.length} performance records`);

                // Initialize progress counters
                let beginnerCases = 0, intermediateCases = 0, advancedCases = 0;
                let beginnerScores = [], intermediateScores = [], advancedScores = [];
                let allValidScores = [];

                // Process each performance record with enhanced logic
                for (const record of performanceRecords) {
                    const rawScore = record.metrics?.overall_score;
                    
                    // Skip records with invalid scores
                    if (rawScore === null || rawScore === undefined || isNaN(rawScore)) {
                        console.log(`   ⚠️  Skipping record with invalid score: ${rawScore}`);
                        continue;
                    }

                    const score = Number(rawScore);
                    const rawDifficulty = record.case_ref?.case_metadata?.difficulty;
                    const normalizedDifficulty = normalizeDifficulty(rawDifficulty);
                    
                    allValidScores.push(score);

                    // Categorize by normalized difficulty
                    switch (normalizedDifficulty) {
                        case 'Beginner':
                            beginnerCases++;
                            beginnerScores.push(score);
                            break;
                        case 'Intermediate':
                            intermediateCases++;
                            intermediateScores.push(score);
                            break;
                        case 'Advanced':
                            advancedCases++;
                            advancedScores.push(score);
                            break;
                        default:
                            // Fallback to beginner
                            beginnerCases++;
                            beginnerScores.push(score);
                            console.log(`   ⚠️  Unknown difficulty '${rawDifficulty}' treated as Beginner`);
                    }
                }

                // Calculate averages with proper rounding
                const beginnerAvg = beginnerScores.length > 0 ? 
                    Math.round((beginnerScores.reduce((a, b) => a + b, 0) / beginnerScores.length) * 100) / 100 : 0;
                const intermediateAvg = intermediateScores.length > 0 ? 
                    Math.round((intermediateScores.reduce((a, b) => a + b, 0) / intermediateScores.length) * 100) / 100 : 0;
                const advancedAvg = advancedScores.length > 0 ? 
                    Math.round((advancedScores.reduce((a, b) => a + b, 0) / advancedScores.length) * 100) / 100 : 0;
                const overallAvg = allValidScores.length > 0 ? 
                    Math.round((allValidScores.reduce((a, b) => a + b, 0) / allValidScores.length) * 100) / 100 : 0;

                // Create comprehensive progress data
                const progressData = {
                    userId: userId,
                    beginnerCasesCompleted: beginnerCases,
                    intermediateCasesCompleted: intermediateCases,
                    advancedCasesCompleted: advancedCases,
                    beginnerAverageScore: beginnerAvg,
                    intermediateAverageScore: intermediateAvg,
                    advancedAverageScore: advancedAvg,
                    totalCasesCompleted: allValidScores.length,
                    overallAverageScore: overallAvg,
                    currentProgressionLevel: calculateProgressionLevel({
                        beginnerCasesCompleted: beginnerCases,
                        intermediateCasesCompleted: intermediateCases,
                        advancedCasesCompleted: advancedCases,
                        beginnerAverageScore: beginnerAvg,
                        intermediateAverageScore: intermediateAvg,
                        advancedAverageScore: advancedAvg
                    }),
                    lastUpdatedAt: new Date()
                };

                // Update or create progress record
                await ClinicianProgress.findOneAndUpdate(
                    { userId: userId },
                    progressData,
                    { upsert: true, new: true }
                );

                console.log(`   ✅ Fixed progress:`);
                console.log(`      - Total valid cases: ${allValidScores.length} (from ${performanceRecords.length} records)`);
                console.log(`      - Overall average: ${overallAvg}% (was broken)`);
                console.log(`      - Beginner: ${beginnerCases} cases (avg: ${beginnerAvg}%)`);
                console.log(`      - Intermediate: ${intermediateCases} cases (avg: ${intermediateAvg}%)`);
                console.log(`      - Advanced: ${advancedCases} cases (avg: ${advancedAvg}%)`);
                console.log(`      - Level: ${progressData.currentProgressionLevel}`);

                totalFixed++;

            } catch (error) {
                console.error(`❌ Error processing user ${userId}:`, error.message);
                totalErrors++;
            }
        }

        console.log(`\\n🎉 PROGRESS TRACKING FIX COMPLETED!`);
        console.log(`=`.repeat(70));
        console.log(`✅ Successfully fixed: ${totalFixed} users`);
        console.log(`❌ Errors encountered: ${totalErrors} users`);
        console.log(`📊 Users now have accurate progress tracking and average scores`);
        console.log(`🔧 Dashboard should display correct data for all users`);

        // Special verification for the reported user
        const targetUser = await User.findOne({ email: 'otienodominic@gmail.com' });
        if (targetUser) {
            const targetProgress = await ClinicianProgress.findOne({ userId: targetUser._id });
            console.log(`\\n🎯 VERIFICATION FOR otienodominic@gmail.com:`);
            console.log(`   - Email: ${targetUser.email}`);
            console.log(`   - Total cases: ${targetProgress?.totalCasesCompleted || 0}`);
            console.log(`   - Overall average: ${targetProgress?.overallAverageScore || 0}%`);
            console.log(`   - Status: ${targetProgress ? 'FIXED' : 'NOT FOUND'}`);
        }

    } catch (error) {
        console.error('❌ Critical error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\\n🔌 Database connection closed');
    }
}

// Run the fix
fixProgressTracking();