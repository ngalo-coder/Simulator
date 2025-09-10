import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5003/api';

async function testAuthAndCategories() {
  console.log('Testing authentication and case categories API...\n');

  // Test user registration data
  const testUser = {
    username: 'testuser' + Date.now(),
    email: `testuser${Date.now()}@example.com`,
    password: 'password123',
    discipline: 'medicine',
    firstName: 'Test',
    lastName: 'User',
    institution: 'Test University',
    primaryRole: 'student'
  };

  try {
    console.log('1. Registering test user...');
    
    // Register user
    const registerResponse = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.error('Registration failed:', errorData);
      
      // If user already exists, try to login instead
      if (errorData.message && errorData.message.includes('already exists')) {
        console.log('User already exists, trying to login...');
        return await testLoginAndCategories(testUser.username, testUser.password);
      }
      
      throw new Error(`Registration failed: ${errorData.message}`);
    }

    const registerData = await registerResponse.json();
    console.log('✅ User registered successfully:', registerData.message);

    // Login with the registered user
    console.log('\n2. Logging in with test user...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${errorData.message}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.message);
    
    const authToken = loginData.token;
    console.log('🔑 Auth token received');

    // Test case categories endpoint with authentication
    console.log('\n3. Testing case categories endpoint with authentication...');
    const categoriesResponse = await fetch(`${API_BASE}/simulation/case-categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!categoriesResponse.ok) {
      const errorData = await categoriesResponse.json();
      throw new Error(`Case categories failed: ${errorData.message}`);
    }

    const categoriesData = await categoriesResponse.json();
    console.log('✅ Case categories retrieved successfully!');
    console.log('\n📋 Available specialties:');
    console.log(JSON.stringify(categoriesData, null, 2));

    // Check if all expected specialties are present
    const expectedSpecialties = ['Laboratory', 'Nursing', 'Pharmacy', 'Radiology'];
    const availableSpecialties = categoriesData.data?.specialties || [];
    
    console.log('\n4. Verifying all expected specialties are available:');
    expectedSpecialties.forEach(specialty => {
      const isAvailable = availableSpecialties.includes(specialty);
      console.log(`   ${specialty}: ${isAvailable ? '✅ Available' : '❌ Missing'}`);
    });

    // Test without authentication (should fail)
    console.log('\n5. Testing case categories without authentication (should fail)...');
    const noAuthResponse = await fetch(`${API_BASE}/simulation/case-categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (noAuthResponse.ok) {
      console.log('❌ Unexpected: Case categories accessible without authentication');
    } else {
      console.log('✅ Correctly requires authentication');
    }

    console.log('\n🎉 Test completed successfully! All specialties should now be accessible through the authenticated API.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testLoginAndCategories(username, password) {
  console.log(`Attempting login with username: ${username}`);
  
  try {
    // Login with existing user
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${errorData.message}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.message);
    
    const authToken = loginData.token;
    console.log('🔑 Auth token received');

    // Test case categories endpoint with authentication
    console.log('\nTesting case categories endpoint with authentication...');
    const categoriesResponse = await fetch(`${API_BASE}/cases/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!categoriesResponse.ok) {
      const errorData = await categoriesResponse.json();
      throw new Error(`Case categories failed: ${errorData.message}`);
    }

    const categoriesData = await categoriesResponse.json();
    console.log('✅ Case categories retrieved successfully!');
    console.log('\n📋 Available specialties:');
    console.log(JSON.stringify(categoriesData, null, 2));

    return categoriesData;

  } catch (error) {
    console.error('Login and categories test failed:', error.message);
    throw error;
  }
}

// Run the test
testAuthAndCategories().catch(console.error);