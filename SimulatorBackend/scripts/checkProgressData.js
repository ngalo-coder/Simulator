import mongoose from 'mongoose';
import StudentProgress from '../src/models/StudentProgressModel.js';
import User from '../src/models/UserModel.js';
import dotenv from 'dotenv';

// Import models to ensure they're registered
import '../src/models/CompetencyModel.js';
import '../src/models/CaseModel.js';

dotenv.config();

async function checkProgressData() {
  try {
    // Connect to MongoDB using the same method as the main app
    if (mongoose.connections[0].readyState === 1) {
      console.log('Using existing MongoDB connection');
    } else {
      // Validate MongoDB URI
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      console.log('Connecting to MongoDB...');
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }

    // Get all student progress records
    const progressRecords = await StudentProgress.find({})
      .populate('userId', 'username profile')
      .populate('caseAttempts.caseId');

    console.log(`Found ${progressRecords.length} progress records`);

    for (const progress of progressRecords) {
      console.log('\n' + '='.repeat(50));
      console.log(`Student: ${progress.userId?.username || 'Unknown'}`);
      console.log(`Total Cases Attempted: ${progress.overallProgress.totalCasesAttempted}`);
      console.log(`Total Cases Completed: ${progress.overallProgress.totalCasesCompleted}`);
      console.log(`Overall Score: ${progress.overallProgress.overallScore}`);
      console.log(`Progress Percentage: ${progress.progressPercentage}%`);
      console.log(`Current Level: ${progress.overallProgress.currentLevel}`);
      console.log(`Total Learning Hours: ${progress.overallProgress.totalLearningHours}`);
      
      console.log(`\nCompetencies (${progress.competencies.length}):`);
      progress.competencies.forEach(comp => {
        console.log(`  - ${comp.competencyName || comp.competencyId}: ${comp.score}% (${comp.proficiencyLevel})`);
      });

      console.log(`\nCase Attempts (${progress.caseAttempts.length}):`);
      progress.caseAttempts.slice(0, 5).forEach(attempt => {
        console.log(`  - ${attempt.caseTitle || attempt.caseId}: ${attempt.score}% (${attempt.status})`);
      });

      if (progress.caseAttempts.length > 5) {
        console.log(`  ... and ${progress.caseAttempts.length - 5} more attempts`);
      }

      // Check for data consistency issues
      const actualAttempts = progress.caseAttempts.length;
      const recordedAttempts = progress.overallProgress.totalCasesAttempted;
      
      if (actualAttempts !== recordedAttempts) {
        console.log(`❌ DATA INCONSISTENCY: ${actualAttempts} actual attempts vs ${recordedAttempts} recorded attempts`);
      }

      const completedAttempts = progress.caseAttempts.filter(a => a.status === 'completed').length;
      const recordedCompleted = progress.overallProgress.totalCasesCompleted;
      
      if (completedAttempts !== recordedCompleted) {
        console.log(`❌ DATA INCONSISTENCY: ${completedAttempts} actual completed vs ${recordedCompleted} recorded completed`);
      }
    }

    // Check if there are any users without progress records
    const users = await User.find({ role: 'student' });
    const usersWithProgress = progressRecords.map(p => p.userId._id.toString());
    
    console.log('\n' + '='.repeat(50));
    console.log('Users without progress records:');
    users.forEach(user => {
      if (!usersWithProgress.includes(user._id.toString())) {
        console.log(`  - ${user.username} (${user._id})`);
      }
    });

  } catch (error) {
    console.error('Error checking progress data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkProgressData();