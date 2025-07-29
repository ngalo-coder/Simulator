// Debug script to test deployed services
const axios = require('axios');

const GATEWAY_URL = 'https://ai-patient-sim-gateway.onrender.com';
const FRONTEND_URL = 'https://simuatech.netlify.app';

async function testServices() {
  console.log('🔍 Testing deployed services...\n');

  // Test Gateway Health
  try {
    console.log('1. Testing Gateway Health...');
    const gatewayHealth = await axios.get(`${GATEWAY_URL}/health`);
    console.log('✅ Gateway Health:', gatewayHealth.data);
  } catch (error) {
    console.log('❌ Gateway Health Failed:', error.message);
  }

  // Test Simulation Service Health via Gateway
  try {
    console.log('\n2. Testing Simulation Service Health via Gateway...');
    const simHealth = await axios.get(`${GATEWAY_URL}/health/simulations`);
    console.log('✅ Simulation Service Health:', simHealth.data);
  } catch (error) {
    console.log('❌ Simulation Service Health Failed:', error.message);
  }

  // Test Cases Endpoint
  try {
    console.log('\n3. Testing Cases Endpoint...');
    const cases = await axios.get(`${GATEWAY_URL}/api/simulations/cases`);
    console.log('✅ Cases Response:', {
      success: cases.data.success,
      casesCount: cases.data.cases?.length || 0,
      firstCase: cases.data.cases?.[0]?.chiefComplaint || 'No cases'
    });
  } catch (error) {
    console.log('❌ Cases Failed:', error.response?.data || error.message);
  }

  // Test Direct Simulation Service (if accessible)
  try {
    console.log('\n4. Testing Direct Simulation Service...');
    const directSim = await axios.get('https://ai-patient-sim-simulation-service.onrender.com/health');
    console.log('✅ Direct Simulation Service:', directSim.data);
  } catch (error) {
    console.log('❌ Direct Simulation Service Failed:', error.message);
  }
}

testServices().catch(console.error);