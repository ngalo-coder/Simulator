import fetch from 'node-fetch';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODcyNjFjZTIxYWNiODQ3ODE2ZTk1MTMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInByaW1hcnlSb2xlIjoiYWRtaW4iLCJkaXNjaXBsaW5lIjoibWVkaWNpbmUiLCJpYXQiOjE3NTg1NTIwMzIsImV4cCI6MTc1ODYzODQzMn0.7ZtEZgwDBbRb9umBxzDPWMdllgsjY80abQsJjPGGy6I';

async function testFrontendAuth() {
  try {
    console.log('Testing frontend authentication flow...');

    // Test 1: Check if we can access the login endpoint
    console.log('\n1. Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('Login Response status:', loginResponse.status);
    console.log('Login successful:', loginResult.success);

    if (loginResult.success) {
      const newToken = loginResult.token;
      console.log('New token received:', newToken.substring(0, 50) + '...');

      // Test 2: Check if we can access protected admin endpoints with the new token
      console.log('\n2. Testing admin stats with new token...');
      const statsResponse = await fetch('http://localhost:5001/api/admin/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        }
      });

      const statsResult = await statsResponse.json();
      console.log('Stats Response status:', statsResponse.status);
      console.log('Stats data received:', !!statsResult.totalUsers);

      // Test 3: Check if we can access admin users endpoint
      console.log('\n3. Testing admin users with new token...');
      const usersResponse = await fetch('http://localhost:5001/api/admin/users?limit=2&page=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        }
      });

      const usersResult = await usersResponse.json();
      console.log('Users Response status:', usersResponse.status);
      console.log('Users data received:', !!usersResult.users);
      console.log('Number of users:', usersResult.users ? usersResult.users.length : 0);
    }

  } catch (error) {
    console.error('Error testing frontend auth:', error.message);
  }
}

testFrontendAuth();