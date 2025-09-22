import fetch from 'node-fetch';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODcyNjFjZTIxYWNiODQ3ODE2ZTk1MTMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInByaW1hcnlSb2xlIjoiYWRtaW4iLCJkaXNjaXBsaW5lIjoibWVkaWNpbmUiLCJpYXQiOjE3NTg1NTIwMzIsImV4cCI6MTc1ODYzODQzMn0.7ZtEZgwDBbRb9umBxzDPWMdllgsjY80abQsJjPGGy6I';

async function testAdminAPI() {
  try {
    console.log('Testing admin stats endpoint...');
    const statsResponse = await fetch('http://localhost:5001/api/admin/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const statsResult = await statsResponse.json();
    console.log('Stats Response status:', statsResponse.status);
    console.log('Stats Response:', JSON.stringify(statsResult, null, 2));

    console.log('\nTesting admin users endpoint...');
    const usersResponse = await fetch('http://localhost:5001/api/admin/users?limit=5&page=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const usersResult = await usersResponse.json();
    console.log('Users Response status:', usersResponse.status);
    console.log('Users Response:', JSON.stringify(usersResult, null, 2));

    console.log('\nTesting admin users statistics endpoint...');
    const userStatsResponse = await fetch('http://localhost:5001/api/admin/users/statistics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const userStatsResult = await userStatsResponse.json();
    console.log('User Stats Response status:', userStatsResponse.status);
    console.log('User Stats Response:', JSON.stringify(userStatsResult, null, 2));

  } catch (error) {
    console.error('Error testing admin API:', error.message);
  }
}

testAdminAPI();