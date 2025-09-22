import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', result.token ? result.token.substring(0, 50) + '...' : 'No token');
      console.log('User:', result.user ? result.user.username : 'No user data');
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('Error testing login:', error.message);
  }
}

testLogin();