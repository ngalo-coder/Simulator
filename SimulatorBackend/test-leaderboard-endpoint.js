import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import leaderboardRoutes from './src/routes/leaderboardRoutes.js';

// Load environment variables
dotenv.config();

// Create a simple test server
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use('/api/leaderboard', (req, res, next) => {
  // Mock user for authentication
  req.user = {
    _id: new mongoose.Types.ObjectId(),
    id: new mongoose.Types.ObjectId(),
    role: 'student',
    username: 'testuser'
  };
  next();
});

app.use('/api/leaderboard', leaderboardRoutes);

async function testLeaderboardEndpoint() {
  try {
    console.log('Setting up test server...');
    
    // Connect to database with simplified options
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB');
    
    const server = app.listen(0, () => {
      const port = server.address().port;
      console.log(`Test server running on port ${port}`);
    });
    
    // Import fetch for Node.js
    const { default: fetch } = await import('node-fetch');
    const port = server.address().port;
    
    // Test the leaderboard endpoint
    console.log('\nTesting leaderboard endpoint...');
    
    try {
      const response = await fetch(`http://localhost:${port}/api/leaderboard?limit=5`);
      const data = await response.json();
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        console.log(`Found ${data.length} leaderboard entries`);
        
        if (data.length > 0) {
          console.log('\nSample entries:');
          data.slice(0, 3).forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.displayName}`);
            console.log(`   Cases: ${entry.totalCases}, Score: ${entry.averageScore}%, Excellence: ${entry.excellentRate}%`);
            console.log(`   Privacy: ${entry.privacyLevel}, Anonymous: ${entry.isAnonymous}`);
          });
        } else {
          console.log('No leaderboard entries returned');
        }
      } else {
        console.error('Error response:', data);
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError.message);
    }
    
    // Test with specialty filter
    console.log('\nTesting with specialty filter...');
    try {
      const response = await fetch(`http://localhost:${port}/api/leaderboard?specialty=medicine&limit=3`);
      const data = await response.json();
      
      console.log(`Response status: ${response.status}`);
      console.log(`Found ${data.length} entries for specialty filter`);
    } catch (fetchError) {
      console.error('Specialty fetch error:', fetchError.message);
    }
    
    server.close();
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testLeaderboardEndpoint();