import mongoose from 'mongoose';
import User from '../src/models/UserModel.js';
import PerformanceMetrics from '../src/models/PerformanceMetricsModel.js';
import ClinicianProgress from '../src/models/ClinicianProgressModel.js';
import Case from '../src/models/CaseModel.js';

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

async function fixUserProgress() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const user = await User.findOne({ email: 'otienodominic@gmail.com' });
        if (!user) {
            console.log('User not found');
            return;
        }
        
        console.log('Found user:', user.email);
        
        // Update all performance metrics with NULL user_ref to this user
        const nullMetrics = await PerformanceMetrics.find({ user_ref: null });
        console.log('Found', nullMetrics.length, 'metrics with NULL user_ref');
        
        if (nullMetrics.length > 0) {
            await PerformanceMetrics.updateMany(
                { user_ref: null },
                { user_ref: user._id }
            );
            console.log('Updated', nullMetrics.length, 'performance metrics with user_ref');
        }
        
        // Now recalculate progress based on all performance metrics
        const allMetrics = await PerformanceMetrics.find({ user_ref: user._id })
            .populate('case_ref', 'case_metadata.difficulty');
        
        console.log('Total performance metrics for user:', allMetrics.length);
        
        // Group by difficulty
        const beginnerScores = [];
        const intermediateScores = [];
        const advancedScores = [];
        const allScores = [];
        
        allMetrics.forEach(metric => {
            const score = metric.metrics?.overall_score || 0;
            const difficulty = metric.case_ref?.case_metadata?.difficulty;
            
            allScores.push(score);
            
            if (difficulty === 'Beginner') {
                beginnerScores.push(score);
            } else if (difficulty === 'Intermediate') {
                intermediateScores.push(score);
            } else if (difficulty === 'Advanced') {
                advancedScores.push(score);
            }
        });
        
        // Calculate averages
        const beginnerAvg = beginnerScores.length > 0 ? 
            Math.round((beginnerScores.reduce((a, b) => a + b, 0) / beginnerScores.length) * 100) / 100 : 0;
        const intermediateAvg = intermediateScores.length > 0 ? 
            Math.round((intermediateScores.reduce((a, b) => a + b, 0) / intermediateScores.length) * 100) / 100 : 0;
        const advancedAvg = advancedScores.length > 0 ? 
            Math.round((advancedScores.reduce((a, b) => a + b, 0) / advancedScores.length) * 100) / 100 : 0;
        const overallAvg = allScores.length > 0 ? 
            Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100 : 0;
        
        // Update or create progress record
        const progressData = {
            userId: user._id,
            beginnerCasesCompleted: beginnerScores.length,
            intermediateCasesCompleted: intermediateScores.length,
            advancedCasesCompleted: advancedScores.length,
            beginnerAverageScore: beginnerAvg,
            intermediateAverageScore: intermediateAvg,
            advancedAverageScore: advancedAvg,
            totalCasesCompleted: allScores.length,
            overallAverageScore: overallAvg,
            lastUpdatedAt: new Date()
        };
        
        progressData.currentProgressionLevel = calculateProgressionLevel(progressData);
        
        await ClinicianProgress.findOneAndUpdate(
            { userId: user._id },
            progressData,
            { upsert: true, new: true }
        );
        
        console.log('Updated progress:');
        console.log('- Total cases:', progressData.totalCasesCompleted);
        console.log('- Beginner:', progressData.beginnerCasesCompleted);
        console.log('- Intermediate:', progressData.intermediateCasesCompleted);
        console.log('- Advanced:', progressData.advancedCasesCompleted);
        console.log('- Overall average:', progressData.overallAverageScore);
        console.log('- Progression level:', progressData.currentProgressionLevel);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixUserProgress();