import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ClinicianProgress from './src/models/ClinicianProgressModel.js';
import PerformanceMetrics from './src/models/PerformanceMetricsModel.js';
import User from './src/models/UserModel.js';

// Load environment variables
dotenv.config();

async function testLeaderboardData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // Check if we have test data
    const progressCount = await ClinicianProgress.countDocuments();
    const metricsCount = await PerformanceMetrics.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`\nData counts:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Progress records: ${progressCount}`);
    console.log(`- Performance metrics: ${metricsCount}`);

    if (progressCount > 0) {
      console.log('\nSample progress data:');
      const sampleProgress = await ClinicianProgress.findOne()
        .populate('userId', 'username email')
        .lean();
      
      if (sampleProgress) {
        console.log(`- User: ${sampleProgress.userId?.username || 'Unknown'}`);
        console.log(`- Total cases: ${sampleProgress.totalCasesCompleted}`);
        console.log(`- Average score: ${sampleProgress.overallAverageScore}`);
      }
    }

    if (metricsCount > 0) {
      console.log('\nSample performance metrics:');
      const sampleMetrics = await PerformanceMetrics.findOne()
        .populate('user_ref', 'username')
        .lean();
      
      if (sampleMetrics) {
        console.log(`- User: ${sampleMetrics.user_ref?.username || 'Unknown'}`);
        console.log(`- Overall score: ${sampleMetrics.metrics?.overall_score || 'N/A'}`);
        console.log(`- Performance label: ${sampleMetrics.metrics?.performance_label || 'N/A'}`);
        console.log(`- Full metrics:`, JSON.stringify(sampleMetrics.metrics, null, 2));
        
        // Check for metrics with actual scores
        const metricsWithScores = await PerformanceMetrics.find({
          'metrics.overall_score': { $exists: true, $ne: null, $type: 'number' }
        }).limit(5).lean();
        
        console.log(`\n- Metrics with valid scores: ${metricsWithScores.length}`);
        if (metricsWithScores.length > 0) {
          metricsWithScores.forEach((metric, index) => {
            console.log(`  ${index + 1}. Score: ${metric.metrics?.overall_score}, Label: ${metric.metrics?.performance_label}`);
          });
        }
      }
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testLeaderboardData();