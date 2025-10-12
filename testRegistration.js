// Test script to verify user registration works correctly
const API_BASE_URL = 'http://localhost:5001';

async function testRegistration() {
  const testUserData = {
    username: 'testuser' + Date.now(),
    email: `testuser${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    institution: 'Test University',
    specialization: 'Test Specialty',
    yearOfStudy: 3,
    licenseNumber: 'TEST123',
    competencyLevel: 'novice',
    discipline: 'medicine',
    primaryRole: 'student'
  };

  console.log('Testing registration with data:', JSON.stringify(testUserData, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserData),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Registration test PASSED');
      return true;
    } else {
      console.log('❌ Registration test FAILED:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Registration test ERROR:', error.message);
    return false;
  }
}

// Run the test
testRegistration().then(success => {
  process.exit(success ? 0 : 1);
});