import fetch from 'node-fetch';

async function testSpecialtyVisibilityAPI() {
  console.log('🧪 Testing Specialty Visibility API with Authentication...\n');

  // First, login to get a token
  const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.token;

  if (!token) {
    console.error('❌ Failed to get token');
    return;
  }

  console.log('✅ Login successful!');

  // Test 1: GET specialty visibility settings
  console.log('\n1. Testing GET /api/admin/specialties/visibility');
  try {
    const getResponse = await fetch('http://localhost:5001/api/admin/specialties/visibility', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const getData = await getResponse.json();

    if (getResponse.status === 200) {
      console.log('✅ GET request successful!');
      console.log(`📊 Found ${getData.specialties?.length || 0} specialties`);
      console.log('📋 Sample specialty data:');
      if (getData.specialties && getData.specialties.length > 0) {
        const sample = getData.specialties[0];
        console.log(`   - ${sample.specialtyId}: ${sample.isVisible ? 'Visible' : 'Hidden'} (${sample.programArea})`);
      }
    } else {
      console.log(`❌ GET request failed: ${getResponse.status} ${getResponse.statusText}`);
      console.log('Response:', getData);
    }
  } catch (error) {
    console.error('❌ GET request error:', error.message);
  }

  // Test 2: Test updating specialty visibility
  console.log('\n2. Testing PUT /api/admin/specialties/visibility');
  try {
    const updateData = {
      specialties: [
        {
          specialtyId: 'internal_medicine',
          isVisible: true,
          programArea: 'basic'
        },
        {
          specialtyId: 'cardiology',
          isVisible: false,
          programArea: 'specialty'
        }
      ]
    };

    const putResponse = await fetch('http://localhost:5001/api/admin/specialties/visibility', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const putData = await putResponse.json();

    if (putResponse.status === 200) {
      console.log('✅ PUT request successful!');
      console.log('Response:', putData.message || 'Settings updated');
    } else {
      console.log(`❌ PUT request failed: ${putResponse.status} ${putResponse.statusText}`);
      console.log('Response:', putData);
    }
  } catch (error) {
    console.error('❌ PUT request error:', error.message);
  }

  // Test 3: Verify the changes by getting the data again
  console.log('\n3. Verifying changes with GET request');
  try {
    const verifyResponse = await fetch('http://localhost:5001/api/admin/specialties/visibility', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const verifyData = await verifyResponse.json();

    if (verifyResponse.status === 200) {
      console.log('✅ Verification GET successful!');
      console.log('📊 Updated specialty data:');
      verifyData.specialties.forEach(specialty => {
        if (['internal_medicine', 'cardiology'].includes(specialty.specialtyId)) {
          console.log(`   - ${specialty.specialtyId}: ${specialty.isVisible ? 'Visible' : 'Hidden'} (${specialty.programArea})`);
        }
      });
    } else {
      console.log(`❌ Verification GET failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }
  } catch (error) {
    console.error('❌ Verification GET error:', error.message);
  }

  console.log('\n🎉 Specialty Visibility API test completed!');
}

// Run the test
testSpecialtyVisibilityAPI().catch(console.error);