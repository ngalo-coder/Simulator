import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import caseRoutes from './src/routes/caseRoutes.js';

dotenv.config();

async function testApiEndpoint() {
  // Create a test server
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/simulation', caseRoutes);

  // Connect to database
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }

  // Test the API endpoint
  console.log('=== Testing API Endpoint /api/simulation/cases ===\n');
  
  const testServer = app.listen(0, () => {
    const port = testServer.address().port;
    console.log(`Test server running on port ${port}`);
    
    // Test the endpoint
    fetch(`http://localhost:${port}/api/simulation/cases`)
      .then(response => response.json())
      .then(data => {
        console.log('API Response:');
        console.log(`Total cases: ${data.totalCases}`);
        console.log(`Returned cases: ${data.cases.length}`);
        
        // Check if allied health cases are included
        const alliedHealthCases = data.cases.filter(caseDoc => 
          ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'].includes(caseDoc.case_metadata.specialty)
        );
        
        console.log(`\nAllied health cases in response: ${alliedHealthCases.length}`);
        alliedHealthCases.forEach(caseDoc => {
          console.log(`- ${caseDoc.case_metadata.case_id}: ${caseDoc.case_metadata.title} (${caseDoc.case_metadata.specialty})`);
        });
        
        testServer.close();
        mongoose.connection.close();
        console.log('\nTest completed successfully');
      })
      .catch(error => {
        console.error('API test failed:', error);
        testServer.close();
        mongoose.connection.close();
        process.exit(1);
      });
  });
}

testApiEndpoint().catch(console.error);