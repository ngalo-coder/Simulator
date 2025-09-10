import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models directly to ensure they're registered
import '../src/models/UserModel.js';
import '../src/models/StudentProgressModel.js';
import '../src/models/ClinicianProgressModel.js';
import '../src/models/PerformanceMetricsModel.js';
import '../src/models/CaseModel.js';

async function fixAllUserProgress() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User');
        const StudentProgress = mongoose.model('StudentProgress');
        const ClinicianProgress = mongoose.model('ClinicianProgress');
        const PerformanceMetrics = mongoose.model('PerformanceMetrics');
        const Case = mongoose.model('Case');

        // Get all users
        const allUsers = await User.find({}, 'username email _id');
        console.log('Total users:', allUsers.length);

        // Process each user
        for (const user of allUsers) {
            console.log(`\nProcessing user: ${user.username} (${user.email})`);
            
            // Check if user has performance metrics (completed cases)
            const userMetrics = await PerformanceMetrics.find({ user_ref: user._id })
                .populate('case_ref', 'case_metadata.title case_metadata.difficulty');
            
            console.log(`Completed cases: ${userMetrics.length}`);
            
            if (userMetrics.length > 0) {
                // Ensure ClinicianProgress exists and is updated
                let clinicianProgress = await ClinicianProgress.findOne({ userId: user._id });
                if (!clinicianProgress) {
                    clinicianProgress = new ClinicianProgress({ userId: user._id });
                    console.log('Created new ClinicianProgress record');
                }
                
                // Reset progress counters
                clinicianProgress.beginnerCasesCompleted = 0;
                clinicianProgress.beginnerAverageScore = 0;
                clinicianProgress.intermediateCasesCompleted = 0;
                clinicianProgress.intermediateAverageScore = 0;
                clinicianProgress.advancedCasesCompleted = 0;
                clinicianProgress.advancedAverageScore = 0;
                clinicianProgress.totalCasesCompleted = 0;
                clinicianProgress.overallAverageScore = 0;
                
                // Recalculate progress from performance metrics
                for (const metric of userMetrics) {
                    const difficulty = metric.case_ref?.case_metadata?.difficulty || 'Unknown';
                    const score = metric.metrics?.overall_score || 0;
                    
                    if (difficulty === 'Beginner') {
                        clinicianProgress.beginnerCasesCompleted += 1;
                        clinicianProgress.beginnerAverageScore = 
                            ((clinicianProgress.beginnerAverageScore * (clinicianProgress.beginnerCasesCompleted - 1)) + score) / 
                            clinicianProgress.beginnerCasesCompleted;
                    } else if (difficulty === 'Intermediate') {
                        clinicianProgress.intermediateCasesCompleted += 1;
                        clinicianProgress.intermediateAverageScore = 
                            ((clinicianProgress.intermediateAverageScore * (clinicianProgress.intermediateCasesCompleted - 1)) + score) / 
                            clinicianProgress.intermediateCasesCompleted;
                    } else if (difficulty === 'Advanced') {
                        clinicianProgress.advancedCasesCompleted += 1;
                        clinicianProgress.advancedAverageScore = 
                            ((clinicianProgress.advancedAverageScore * (clinicianProgress.advancedCasesCompleted - 1)) + score) / 
                            clinicianProgress.advancedCasesCompleted;
                    }
                    
                    clinicianProgress.totalCasesCompleted += 1;
                    clinicianProgress.overallAverageScore = 
                        ((clinicianProgress.overallAverageScore * (clinicianProgress.totalCasesCompleted - 1)) + score) / 
                        clinicianProgress.totalCasesCompleted;
                }
                
                // Calculate progression level
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
                
                clinicianProgress.currentProgressionLevel = calculateProgressionLevel(clinicianProgress);
                clinicianProgress.lastUpdatedAt = new Date();
                
                await clinicianProgress.save();
                console.log('Updated ClinicianProgress');
                
                // Ensure StudentProgress exists and is updated
                let studentProgress = await StudentProgress.findOne({ userId: user._id });
                if (!studentProgress) {
                    studentProgress = new StudentProgress({ userId: user._id });
                    console.log('Created new StudentProgress record');
                }
                
                // Clear existing case attempts
                studentProgress.caseAttempts = [];
                
                // Add case attempts from performance metrics
                for (const metric of userMetrics) {
                    // Skip if case_ref is missing or invalid
                    if (!metric.case_ref?._id) {
                        console.log('Skipping metric with missing case_ref:', metric._id);
                        continue;
                    }
                    
                    const caseDetails = await Case.findById(metric.case_ref._id);
                    const startTime = metric.createdAt || new Date();
                    const endTime = metric.evaluated_at || new Date();
                    
                    // Ensure duration is not negative
                    const rawDuration = Math.floor((endTime - startTime) / 1000);
                    const duration = Math.max(0, rawDuration); // Ensure duration is at least 0
                    
                    const attemptData = {
                        caseId: metric.case_ref._id,
                        caseTitle: caseDetails?.case_metadata?.title || 'Unknown Case',
                        attemptNumber: 1, // Default to 1 since we don't have retry info
                        startTime: startTime,
                        endTime: endTime,
                        duration: duration,
                        score: metric.metrics?.overall_score || 0,
                        status: 'completed',
                        detailedMetrics: metric.metrics || {},
                        feedback: metric.evaluation_summary || '',
                        sessionId: metric.session_ref
                    };
                    
                    // Validate required fields before pushing
                    if (!attemptData.caseId) {
                        console.log('Skipping attempt with missing caseId for metric:', metric._id);
                        continue;
                    }
                    
                    studentProgress.caseAttempts.push(attemptData);
                }
                
                // Update overall progress
                studentProgress.overallProgress.totalCasesAttempted = userMetrics.length;
                studentProgress.overallProgress.totalCasesCompleted = userMetrics.length;
                studentProgress.overallProgress.totalLearningHours = studentProgress.caseAttempts
                    .reduce((total, attempt) => total + (attempt.duration || 0), 0) / 3600;
                
                // Calculate overall score based on average of all attempts
                const totalScore = studentProgress.caseAttempts
                    .reduce((sum, attempt) => sum + (attempt.score || 0), 0);
                studentProgress.overallProgress.overallScore = userMetrics.length > 0 
                    ? Math.round(totalScore / userMetrics.length) 
                    : 0;
                
                // Calculate current level
                const overallScore = studentProgress.overallProgress.overallScore;
                if (overallScore >= 90) studentProgress.overallProgress.currentLevel = 'Expert';
                else if (overallScore >= 80) studentProgress.overallProgress.currentLevel = 'Proficient';
                else if (overallScore >= 70) studentProgress.overallProgress.currentLevel = 'Competent';
                else if (overallScore >= 60) studentProgress.overallProgress.currentLevel = 'Beginner';
                else studentProgress.overallProgress.currentLevel = 'Novice';
                
                await studentProgress.save();
                console.log('Updated StudentProgress');
            } else {
                console.log('No completed cases found for user');
            }
        }
        
        console.log('\n=== Progress Fix Completed ===');
        console.log('All users now have updated progress records based on their actual performance metrics.');
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error fixing user progress:', error);
        process.exit(1);
    }
}

fixAllUserProgress();