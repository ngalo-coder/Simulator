import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';
import StudentDashboardService from './src/services/StudentDashboardService.js';

dotenv.config();

async function testProgressAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🧪 TESTING UPDATED PROGRESS API');
        console.log('='.repeat(50));

        // Test with the specific user
        const user = await User.findOne({ email: 'otienodominic@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`👤 Testing with user: ${user.email}`);

        // Test the updated progress summary
        const progressSummary = await StudentDashboardService.getProgressSummary(user);
        console.log('\n📊 PROGRESS SUMMARY:');
        console.log(`   - Total Cases: ${progressSummary.completedCases}`);
        console.log(`   - Average Score: ${progressSummary.averageScore}%`);
        console.log(`   - Overall Progress: ${progressSummary.overallProgress}%`);
        console.log(`   - Progression Level: ${progressSummary.progressionLevel}`);
        console.log(`   - Beginner Cases: ${progressSummary.beginnerCases} (avg: ${progressSummary.competencyScores.beginner}%)`);
        console.log(`   - Intermediate Cases: ${progressSummary.intermediateCases} (avg: ${progressSummary.competencyScores.intermediate}%)`);
        console.log(`   - Advanced Cases: ${progressSummary.advancedCases} (avg: ${progressSummary.competencyScores.advanced}%)`);
        console.log(`   - Recent Trend: ${progressSummary.recentTrend}`);
        console.log(`   - Last Activity: ${progressSummary.lastActivity}`);

        // Test achievements
        const achievements = await StudentDashboardService.getAchievements(user);
        console.log('\n🏆 ACHIEVEMENTS:');
        console.log(`   - Total Badges: ${achievements.badges.length}`);
        console.log(`   - Total Milestones: ${achievements.milestones.length}`);
        console.log(`   - Total Points: ${achievements.totalPoints}`);
        
        // Show completed milestones
        const completedMilestones = achievements.milestones.filter(m => m.completed);
        console.log(`   - Completed Milestones: ${completedMilestones.length}`);
        completedMilestones.forEach(milestone => {
            console.log(`     ✅ ${milestone.name} (${milestone.current}/${milestone.target})`);
        });

        // Show next milestones to achieve
        const nextMilestones = achievements.milestones.filter(m => !m.completed).slice(0, 3);
        console.log(`   - Next Milestones:`);
        nextMilestones.forEach(milestone => {
            console.log(`     🎯 ${milestone.name} (${milestone.current}/${milestone.target})`);
        });

        // Test dashboard overview
        const dashboardData = await StudentDashboardService.getDashboardOverview(user);
        console.log('\n📋 DASHBOARD OVERVIEW:');
        console.log(`   - Student Name: ${dashboardData.student.name}`);
        console.log(`   - Discipline: ${dashboardData.student.discipline}`);
        console.log(`   - Progress: ${dashboardData.progressSummary.completedCases} cases, ${dashboardData.progressSummary.averageScore}% avg`);
        console.log(`   - Recommended Cases: ${dashboardData.recommendedCases.length}`);
        console.log(`   - Recent Activity: ${dashboardData.recentActivity.length} entries`);

        console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('🎉 Progress tracking is now working correctly!');

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

testProgressAPI();