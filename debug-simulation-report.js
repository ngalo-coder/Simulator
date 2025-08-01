// debug-simulation-report.js - Debug script for simulation report issues
const axios = require('axios');

const GATEWAY_URL = 'https://ai-patient-sim-gateway.onrender.com';
const SIMULATION_ID = '280b3c25-d65e-46a9-b6d8-faac373a01af';

// You'll need to get this token from your browser's localStorage or network tab
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIs...'; // Replace with actual token

async function debugSimulationReport() {
  console.log('🔍 Debugging Simulation Report Issue');
  console.log('=====================================');
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Check gateway health
    console.log('\n1. Checking Gateway Health...');
    const gatewayHealth = await axios.get(`${GATEWAY_URL}/health`);
    console.log('✅ Gateway Status:', gatewayHealth.data.status);

    // 2. Check simulation service health
    console.log('\n2. Checking Simulation Service Health...');
    const simHealth = await axios.get(`${GATEWAY_URL}/health/simulations`);
    console.log('✅ Simulation Service Status:', simHealth.data.status);
    console.log('📊 Database Status:', simHealth.data.database?.status);

    // 3. Check user's simulations
    console.log('\n3. Checking User Simulations...');
    try {
      const userSims = await axios.get(`${GATEWAY_URL}/api/simulations/debug/user-simulations`, { headers });
      console.log('📋 User Simulations Found:', userSims.data.totalFound);
      
      if (userSims.data.simulations.length > 0) {
        console.log('\nRecent Simulations:');
        userSims.data.simulations.forEach(sim => {
          console.log(`  - ${sim.id}: ${sim.status} (${sim.caseName})`);
          if (sim.id === SIMULATION_ID) {
            console.log(`    ⭐ This is the simulation we're trying to get a report for!`);
            console.log(`    📊 Can Generate Report: ${sim.canGenerateReport}`);
          }
        });
      }
    } catch (error) {
      console.log('❌ Could not fetch user simulations:', error.response?.data?.error || error.message);
    }

    // 4. Check specific simulation status
    console.log(`\n4. Checking Specific Simulation Status (${SIMULATION_ID})...`);
    try {
      const simStatus = await axios.get(`${GATEWAY_URL}/api/simulations/${SIMULATION_ID}/status`, { headers });
      console.log('✅ Simulation Found!');
      console.log('📋 Status:', simStatus.data.simulation.status);
      console.log('📊 Can Generate Report:', simStatus.data.simulation.canGenerateReport);
      console.log('🎯 Available Actions:', simStatus.data.simulation.availableActions);
      
      if (!simStatus.data.simulation.canGenerateReport) {
        console.log(`\n⚠️  ISSUE IDENTIFIED: Simulation status is "${simStatus.data.simulation.status}"`);
        console.log('💡 SOLUTION: Complete the simulation first, then try generating the report.');
        
        if (simStatus.data.simulation.status === 'active') {
          console.log('   You can complete it by calling: POST /api/simulations/' + SIMULATION_ID + '/complete');
        } else if (simStatus.data.simulation.status === 'paused') {
          console.log('   You can resume it by calling: POST /api/simulations/' + SIMULATION_ID + '/resume');
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Simulation not found or access denied');
        console.log('💡 This could mean:');
        console.log('   - The simulation ID is incorrect');
        console.log('   - The simulation belongs to a different user');
        console.log('   - The simulation was deleted');
      } else {
        console.log('❌ Error checking simulation status:', error.response?.data?.error || error.message);
      }
    }

    // 5. Try to generate report (this will likely fail, but we'll see the exact error)
    console.log(`\n5. Attempting Report Generation...`);
    try {
      const report = await axios.get(`${GATEWAY_URL}/api/simulations/${SIMULATION_ID}/report`, { headers });
      console.log('✅ Report generated successfully!');
      console.log('📊 Report data available');
    } catch (error) {
      console.log('❌ Report generation failed (as expected)');
      console.log('📋 Status Code:', error.response?.status);
      console.log('📋 Error Message:', error.response?.data?.error);
      console.log('📋 Current Status:', error.response?.data?.currentStatus);
      
      if (error.response?.data?.suggestion) {
        console.log('💡 Suggestion:', error.response.data.suggestion);
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Instructions for getting the auth token
console.log('📝 INSTRUCTIONS:');
console.log('1. Open your browser and go to the simulation app');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Application/Storage tab > Local Storage');
console.log('4. Find the "token" key and copy its value');
console.log('5. Replace AUTH_TOKEN in this script with that value');
console.log('6. Run: node debug-simulation-report.js');
console.log('\nAlternatively, check the Network tab for any API request and copy the Authorization header\n');

// Only run if token is provided
if (AUTH_TOKEN && AUTH_TOKEN !== 'eyJhbGciOiJIUzI1NiIs...') {
  debugSimulationReport();
} else {
  console.log('⚠️  Please update the AUTH_TOKEN in this script first!');
}