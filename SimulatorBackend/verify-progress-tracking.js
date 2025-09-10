import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PerformanceMetrics from './src/models/PerformanceMetricsModel.js';
import ClinicianProgress from './src/models/ClinicianProgressModel.js';
import User from './src/models/UserModel.js';
import { updateProgressAfterCase } from './src/services/clinicianProgressService.js';

dotenv.config();

/**
 * Utility script to verify and fix progress tracking issues
 * Can be run periodically to ensure data consistency
 */
async function verifyProgressTracking() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔍 PROGRESS TRACKING VERIFICATION');
        console.log('='.repeat(50));

        // Check for performance metrics without user_ref
        const orphanedMetrics = await PerformanceMetrics.countDocuments({ user_ref: null });
        if (orphanedMetrics > 0) {
            console.log(`⚠️  Found ${orphanedMetrics} orphaned performance metrics (null user_ref)`);
        }

        // Check for metrics with invalid scores
        const invalidScoreMetrics = await PerformanceMetrics.countDocuments({
            $or: [
                { 'metrics.overall_score': null },
                { 'metrics.overall_score': { $exists: false } },
                { 'metrics.overall_score': { $type: 'string' } } // Catches \"N/A\" strings
            ]
        });
        
        if (invalidScoreMetrics > 0) {
            console.log(`⚠️  Found ${invalidScoreMetrics} performance metrics with invalid scores`);
        }

        // Get users with progress discrepancies
        const usersWithMetrics = await PerformanceMetrics.aggregate([
            { $match: { user_ref: { $ne: null }, 'metrics.overall_score': { $type: 'number' } } },
            { $group: { _id: '$user_ref', count: { $sum: 1 }, avgScore: { $avg: '$metrics.overall_score' } } }
        ]);

        console.log(`\n📊 Found ${usersWithMetrics.length} users with valid performance data`);

        let discrepancies = 0;
        for (const userMetric of usersWithMetrics) {
            const progress = await ClinicianProgress.findOne({ userId: userMetric._id });
            if (!progress) {
                console.log(`❌ Missing progress record for user ${userMetric._id}`);
                discrepancies++;
            } else if (Math.abs(progress.totalCasesCompleted - userMetric.count) > 0) {
                console.log(`❌ Case count mismatch for user ${userMetric._id}: Progress=${progress.totalCasesCompleted}, Actual=${userMetric.count}`);
                discrepancies++;
            }
        }

        if (discrepancies === 0) {
            console.log('✅ All progress records are consistent!');
        } else {
            console.log(`⚠️  Found ${discrepancies} discrepancies that need fixing`);
        }

        // Summary statistics
        const totalUsers = await User.countDocuments();
        const usersWithProgress = await ClinicianProgress.countDocuments();
        const totalMetrics = await PerformanceMetrics.countDocuments();
        
        console.log(`\n📈 SYSTEM SUMMARY:`);
        console.log(`   - Total users: ${totalUsers}`);
        console.log(`   - Users with progress: ${usersWithProgress}`);
        console.log(`   - Total performance metrics: ${totalMetrics}`);
        console.log(`   - Valid performance metrics: ${totalMetrics - invalidScoreMetrics}`);
        console.log(`   - Orphaned metrics: ${orphanedMetrics}`);

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

verifyProgressTracking();