import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5001';

async function testSpecialtyVisibilityAPI() {
  console.log('🧪 Testing Specialty Visibility API...\n');

  try {
    // Test 1: Get specialty visibility settings
    console.log('1. Testing GET /api/admin/specialties/visibility');
    const getResponse = await fetch(`${API_BASE_URL}/api/admin/specialties/visibility`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET request successful');
      console.log('📊 Response structure:', JSON.stringify(getData, null, 2));
      console.log(`📋 Found ${getData.data?.specialties?.length || 0} specialties in response`);
    } else {
      console.log('❌ GET request failed:', getResponse.status, getResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get admin specialties
    console.log('2. Testing GET /api/admin/programs/specialties');
    const specialtiesResponse = await fetch(`${API_BASE_URL}/api/admin/programs/specialties`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    if (specialtiesResponse.ok) {
      const specialtiesData = await specialtiesResponse.json();
      console.log('✅ GET specialties successful');
      console.log('📊 Response structure:', JSON.stringify(specialtiesData, null, 2));
      console.log(`📋 Found ${specialtiesData.specialties?.length || 0} specialties in response`);

      if (specialtiesData.specialties && specialtiesData.specialties.length > 0) {
        console.log('\n📝 Sample specialty data:');
        const sample = specialtiesData.specialties[0];
        console.log(`   - Name: ${sample.name}`);
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Case Count: ${sample.caseCount}`);
        console.log(`   - Visibility: ${JSON.stringify(sample.visibility)}`);
      }
    } else {
      console.log('❌ GET specialties failed:', specialtiesResponse.status, specialtiesResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test PUT request with sample data
    console.log('3. Testing PUT /api/admin/specialties/visibility');
    const testData = {
      specialties: [
        {
          specialtyId: 'internal_medicine',
          isVisible: true,
          programAreas: ['basic', 'specialty']
        },
        {
          specialtyId: 'cardiology',
          isVisible: false,
          programAreas: ['specialty']
        }
      ]
    };

    const putResponse = await fetch(`${API_BASE_URL}/api/admin/specialties/visibility`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log('✅ PUT request successful');
      console.log('📊 Response:', JSON.stringify(putData, null, 2));
    } else {
      console.log('❌ PUT request failed:', putResponse.status, putResponse.statusText);
      const errorText = await putResponse.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testSpecialtyVisibilityAPI();