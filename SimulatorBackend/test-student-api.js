import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { authenticateToken } from './src/middleware/authMiddleware.js';
import studentRoutes from './src/routes/studentRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test the exact API endpoint the frontend is calling
async function testStudentProgressAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🧪 TESTING STUDENT PROGRESS API ENDPOINT');
        console.log('='.repeat(60));

        // Import necessary modules
        const User = (await import('./src/models/UserModel.js')).default;
        const studentDashboardService = (await import('./src/services/StudentDashboardService.js')).default;

        // Get the test user
        const user = await User.findOne({ email: 'otienodominic@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`👤 Testing API for: ${user.email}`);

        // Test the exact method called by the API
        console.log('\n📡 Testing getProgressSummary method...');
        const progressSummary = await studentDashboardService.getProgressSummary(user);
        console.log('Progress Summary Response:', JSON.stringify(progressSummary, null, 2));

        // Test the full dashboard method
        console.log('\n📡 Testing getDashboardOverview method...');
        try {
            const dashboardOverview = await studentDashboardService.getDashboardOverview(user);
            console.log('Dashboard Overview Response:', JSON.stringify(dashboardOverview, null, 2));
        } catch (error) {
            console.log('Dashboard Overview Error:', error.message);
        }

        // Test what the frontend should receive
        console.log('\n📊 Expected Frontend Data Structure:');
        console.log('Expected format for frontend compatibility:');
        console.log('- totalCasesCompleted: number');
        console.log('- totalCasesAttempted: number');
        console.log('- overallAverageScore: number');
        console.log('- recentPerformance: array');

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

testStudentProgressAPI();