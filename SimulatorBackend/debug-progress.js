import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PerformanceMetrics from './src/models/PerformanceMetricsModel.js';
import ClinicianProgress from './src/models/ClinicianProgressModel.js';
import User from './src/models/UserModel.js';
import Case from './src/models/CaseModel.js';

dotenv.config();

async function debugProgress() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔍 DEBUGGING PROGRESS ISSUE');
        console.log('='.repeat(60));

        // Find the specific user
        const user = await User.findOne({ email: 'otienodominic@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`👤 Found user: ${user.email} (ID: ${user._id})`);

        // Check performance metrics for this user
        const performanceCount = await PerformanceMetrics.countDocuments({ user_ref: user._id });
        console.log(`📊 Performance metrics count: ${performanceCount}`);

        if (performanceCount > 0) {
            // Get some sample performance metrics
            const sampleMetrics = await PerformanceMetrics.find({ user_ref: user._id })
                .populate('case_ref', 'case_metadata.difficulty case_metadata.title')
                .sort({ createdAt: -1 })
                .limit(10);

            console.log(`\n📈 Sample performance metrics (latest 10):`);
            sampleMetrics.forEach((metric, index) => {
                console.log(`  ${index + 1}. Score: ${metric.metrics?.overall_score || 'N/A'}, ` +
                           `Difficulty: ${metric.case_ref?.case_metadata?.difficulty || 'N/A'}, ` +
                           `Case: ${metric.case_ref?.case_metadata?.title || 'N/A'}`);
            });

            // Calculate what the average should be
            const allMetrics = await PerformanceMetrics.find({ user_ref: user._id });
            const scores = allMetrics.map(m => m.metrics?.overall_score || 0).filter(s => s > 0);
            const calculatedAverage = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            
            console.log(`\n🧮 Calculated average from ${scores.length} valid scores: ${calculatedAverage.toFixed(2)}%`);
        }

        // Check clinician progress record
        const progress = await ClinicianProgress.findOne({ userId: user._id });
        if (progress) {
            console.log(`\n📋 Current progress record:`);
            console.log(`  - Total cases: ${progress.totalCasesCompleted}`);
            console.log(`  - Overall average: ${progress.overallAverageScore}%`);
            console.log(`  - Beginner: ${progress.beginnerCasesCompleted} cases (avg: ${progress.beginnerAverageScore}%)`);
            console.log(`  - Intermediate: ${progress.intermediateCasesCompleted} cases (avg: ${progress.intermediateAverageScore}%)`);
            console.log(`  - Advanced: ${progress.advancedCasesCompleted} cases (avg: ${progress.advancedAverageScore}%)`);
            console.log(`  - Level: ${progress.currentProgressionLevel}`);
            console.log(`  - Last updated: ${progress.lastUpdatedAt}`);
        } else {
            console.log(`\n❌ No clinician progress record found`);
        }

        // Check for any performance metrics with null user_ref
        const nullMetricsCount = await PerformanceMetrics.countDocuments({ user_ref: null });
        console.log(`\n⚠️  Performance metrics with null user_ref: ${nullMetricsCount}`);

        if (nullMetricsCount > 0) {
            const nullMetrics = await PerformanceMetrics.find({ user_ref: null })
                .populate('session_ref')
                .limit(5);
            
            console.log(`\n🔍 Sample null metrics (showing session info):`);
            nullMetrics.forEach((metric, index) => {
                console.log(`  ${index + 1}. Session: ${metric.session_ref?._id || 'N/A'}, ` +
                           `Score: ${metric.metrics?.overall_score || 'N/A'}, ` +
                           `Created: ${metric.createdAt}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

debugProgress();