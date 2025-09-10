// Test script to verify frontend registration format works correctly
const API_BASE_URL = 'http://localhost:5003';

async function testFrontendRegistration() {
  // This simulates the data structure that the frontend sends
  const frontendUserData = {
    username: 'frontenduser' + Date.now(),
    email: `frontenduser${Date.now()}@example.com`,
    password: 'password123',
    profile: {
      firstName: 'Frontend',
      lastName: 'User',
      institution: 'Frontend University',
      specialization: 'Frontend Specialty',
      yearOfStudy: 2,
      licenseNumber: 'FRONT123',
      competencyLevel: 'novice'
    },
    discipline: 'nursing',
    primaryRole: 'student'
  };

  console.log('Testing frontend registration format with data:', JSON.stringify(frontendUserData, null, 2));

  try {
    // Transform the data structure to match backend expectations (what the frontend API service should do)
    const registrationData = {
      username: frontendUserData.username,
      email: frontendUserData.email,
      password: frontendUserData.password,
      discipline: frontendUserData.discipline,
      primaryRole: frontendUserData.primaryRole,
      firstName: frontendUserData.profile.firstName,
      lastName: frontendUserData.profile.lastName,
      institution: frontendUserData.profile.institution,
      specialization: frontendUserData.profile.specialization,
      yearOfStudy: frontendUserData.profile.yearOfStudy,
      licenseNumber: frontendUserData.profile.licenseNumber,
      competencyLevel: frontendUserData.profile.competencyLevel
    };

    console.log('Transformed data for backend:', JSON.stringify(registrationData, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Frontend registration test PASSED');
      return true;
    } else {
      console.log('❌ Frontend registration test FAILED:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend registration test ERROR:', error.message);
    return false;
  }
}

// Run the test
testFrontendRegistration().then(success => {
  process.exit(success ? 0 : 1);
});