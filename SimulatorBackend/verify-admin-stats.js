import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';
import Case from './src/models/CaseModel.js';
import PerformanceMetrics from './src/models/PerformanceMetricsModel.js';
import ClinicianProgress from './src/models/ClinicianProgressModel.js';

dotenv.config();

async function verifyAdminStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 Connected to MongoDB');

        console.log('\n📊 ADMIN STATS VERIFICATION');
        console.log('===============================');

        // Total Users
        const totalUsers = await User.countDocuments();
        console.log(`👥 Total Users: ${totalUsers}`);

        // Total Cases
        const totalCases = await Case.countDocuments();
        console.log(`📝 Total Cases: ${totalCases}`);

        // OLD WAY: Using PerformanceMetrics (potentially incorrect)
        const oldTotalSessions = await PerformanceMetrics.countDocuments();
        const oldActiveUsers = await PerformanceMetrics.distinct('user_ref').then(userIds => userIds.length);
        
        console.log('\n❌ OLD STATS (PerformanceMetrics):');
        console.log(`   Sessions: ${oldTotalSessions}`);
        console.log(`   Active Users: ${oldActiveUsers}`);

        // NEW WAY: Using ClinicianProgress (correct)
        const newTotalSessions = await ClinicianProgress.aggregate([
            { $group: { _id: null, totalSessions: { $sum: '$totalCasesCompleted' } } }
        ]).then(result => result[0]?.totalSessions || 0);
        
        const newActiveUsers = await ClinicianProgress.countDocuments({ totalCasesCompleted: { $gt: 0 } });

        console.log('\n✅ NEW STATS (ClinicianProgress):');
        console.log(`   Sessions: ${newTotalSessions}`);
        console.log(`   Active Users: ${newActiveUsers}`);

        // Recent activity comparison
        const recentPerformanceActivity = await PerformanceMetrics.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const recentProgressActivity = await ClinicianProgress.countDocuments({
            lastUpdatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            totalCasesCompleted: { $gt: 0 }
        });

        console.log('\n📈 RECENT ACTIVITY (Last 7 days):');
        console.log(`   Old way (PerformanceMetrics): ${recentPerformanceActivity}`);
        console.log(`   New way (ClinicianProgress): ${recentProgressActivity}`);

        // Sample ClinicianProgress data
        const sampleProgress = await ClinicianProgress.find({ totalCasesCompleted: { $gt: 0 } })
            .populate('userId', 'username email')
            .limit(5);

        console.log('\n🔍 SAMPLE PROGRESS DATA:');
        sampleProgress.forEach((progress, index) => {
            console.log(`   ${index + 1}. User: ${progress.userId?.username || 'N/A'}`);
            console.log(`      - Total Cases: ${progress.totalCasesCompleted}`);
            console.log(`      - Overall Average: ${progress.overallAverageScore}%`);
            console.log(`      - Level: ${progress.currentProgressionLevel}`);
            console.log(`      - Last Updated: ${progress.lastUpdatedAt}`);
        });

        console.log('\n🎯 SUMMARY:');
        console.log(`   Data source has been switched from PerformanceMetrics to ClinicianProgress`);
        console.log(`   Admin dashboard should now show accurate statistics`);
        console.log(`   Sessions count: ${oldTotalSessions} → ${newTotalSessions}`);
        console.log(`   Active users: ${oldActiveUsers} → ${newActiveUsers}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

verifyAdminStats();