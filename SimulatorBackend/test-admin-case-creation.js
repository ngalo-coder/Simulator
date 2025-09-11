// Test script to verify admin case creation workflow
// This can be run with node to test the backend endpoints

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAdminCaseCreation() {
  console.log('🧪 Testing Admin Case Creation Workflow...\n');

  try {
    // Step 1: Login as admin (you'll need to provide valid admin credentials)
    console.log('1️⃣ Login as admin user...');
    
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Replace with actual admin email
        password: 'adminpassword123' // Replace with actual admin password
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // Step 2: Fetch case templates
    console.log('2️⃣ Fetching case templates...');
    
    const templatesResponse = await fetch(`${API_BASE}/admin/cases/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!templatesResponse.ok) {
      console.error('❌ Templates fetch failed:', await templatesResponse.text());
      return;
    }

    const templatesData = await templatesResponse.json();
    console.log('✅ Templates fetched:', templatesData.templates.length, 'templates available\n');

    // Step 3: Create a new case
    console.log('3️⃣ Creating new case...');
    
    const createResponse = await fetch(`${API_BASE}/admin/cases/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discipline: 'medicine',
        title: 'Test Case - Cardiac Emergency',
        description: 'A test case for cardiac emergency simulation created via admin interface',
        difficulty: 'intermediate',
        estimatedDuration: 45,
        specialty: 'Cardiology',
        programArea: 'Internal Medicine',
      }),
    });

    if (!createResponse.ok) {
      console.error('❌ Case creation failed:', await createResponse.text());
      return;
    }

    const createData = await createResponse.json();
    console.log('✅ Case created successfully:', createData.caseId);
    console.log('   Case Title:', createData.case.case_metadata.title);
    console.log('   Case Specialty:', createData.case.case_metadata.specialty);
    console.log('   Case Difficulty:', createData.case.case_metadata.difficulty, '\n');

    // Step 4: Verify case appears in admin cases list
    console.log('4️⃣ Verifying case appears in admin cases list...');
    
    const casesResponse = await fetch(`${API_BASE}/admin/cases?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!casesResponse.ok) {
      console.error('❌ Cases list fetch failed:', await casesResponse.text());
      return;
    }

    const casesData = await casesResponse.json();
    const foundCase = casesData.cases.find(c => c._id === createData.caseId);
    
    if (foundCase) {
      console.log('✅ Case found in admin list');
      console.log('   List contains', casesData.cases.length, 'cases\n');
    } else {
      console.log('⚠️ Case not found in admin list (may be due to pagination)\n');
    }

    console.log('🎉 Admin case creation workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testAdminCaseCreation();
}

module.exports = { testAdminCaseCreation };