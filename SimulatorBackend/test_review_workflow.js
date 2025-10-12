import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateToken } from './src/services/authService.js';
import User from './src/models/UserModel.js';
import ContributedCase from './src/models/ContributedCaseModel.js';
import CaseReview from './src/models/CaseReviewModel.js';

dotenv.config();

const BASE_URL = 'http://localhost:5001';

// Test data
const testUsers = {
  admin: {
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'password123',
    primaryRole: 'admin',
    discipline: 'medicine',
    profile: {
      firstName: 'Test',
      lastName: 'Admin',
      institution: 'Test Hospital'
    }
  },
  educator: {
    username: 'testeducator',
    email: 'educator@test.com',
    password: 'password123',
    primaryRole: 'educator',
    discipline: 'medicine',
    profile: {
      firstName: 'Test',
      lastName: 'Educator',
      institution: 'Test University'
    }
  },
  student: {
    username: 'teststudent',
    email: 'student@test.com',
    password: 'password123',
    primaryRole: 'student',
    discipline: 'medicine',
    profile: {
      firstName: 'Test',
      lastName: 'Student',
      institution: 'Test College'
    }
  }
};

const testCase = {
  title: 'Test Case for Review',
  description: 'This is a test case for the review workflow',
  specialty: 'internal_medicine',
  difficulty: 'intermediate',
  caseData: {
    case_metadata: {
      title: 'Test Case for Review',
      specialty: 'internal_medicine',
      difficulty: 'intermediate',
      estimated_time: 30,
      author: 'Test Student',
      version: '1.0.0'
    },
    patient_profile: {
      demographics: {
        age: 45,
        gender: 'male',
        ethnicity: 'caucasian'
      },
      medical_history: {
        conditions: ['hypertension'],
        medications: ['lisinopril'],
        allergies: ['penicillin']
      }
    },
    presentation: {
      chief_complaint: 'Chest pain for 2 hours',
      history_of_present_illness: 'Patient reports substernal chest pain radiating to left arm',
      physical_exam: 'BP 150/90, HR 95, RR 18, O2 sat 96%'
    }
  }
};

// Helper functions
async function createTestUser(userData) {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    console.error('Error creating test user:', error.message);
    return null;
  }
}

async function createTestCase(caseData, submitterId) {
  try {
    const caseDoc = new ContributedCase({
      ...caseData,
      submitterId,
      submitterName: 'Test Student',
      status: 'submitted',
      priority: 'medium'
    });
    await caseDoc.save();
    return caseDoc;
  } catch (error) {
    console.error('Error creating test case:', error.message);
    return null;
  }
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Request error:', error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function testReviewWorkflow() {
  console.log('🚀 Starting Review Workflow Test...\n');
  
  // Connect to database
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return;
  }
  
  // Clean up existing test data
  console.log('🧹 Cleaning up existing test data...');
  await User.deleteMany({ username: { $in: ['testadmin', 'testeducator', 'teststudent'] } });
  await ContributedCase.deleteMany({ 'caseData.case_metadata.title': 'Test Case for Review' });
  await CaseReview.deleteMany({});
  
  // Create test users
  console.log('👥 Creating test users...');
  const adminUser = await createTestUser(testUsers.admin);
  const educatorUser = await createTestUser(testUsers.educator);
  const studentUser = await createTestUser(testUsers.student);
  
  if (!adminUser || !educatorUser || !studentUser) {
    console.error('❌ Failed to create test users');
    return;
  }
  
  console.log('✅ Test users created');
  
  // Create test case
  console.log('📝 Creating test case...');
  const testCaseDoc = await createTestCase(testCase, studentUser._id);
  if (!testCaseDoc) {
    console.error('❌ Failed to create test case');
    return;
  }
  
  console.log('✅ Test case created with ID:', testCaseDoc._id.toString());
  
  // Generate tokens
  const adminToken = generateToken(adminUser._id.toString(), adminUser.username, adminUser.primaryRole);
  const educatorToken = generateToken(educatorUser._id.toString(), educatorUser.username, educatorUser.primaryRole);
  
  console.log('\n🔐 Generated tokens for testing');
  
  // Test 1: Get review queue (admin)
  console.log('\n📋 Test 1: Getting review queue (admin)...');
  const queueResponse = await makeRequest(`${BASE_URL}/api/reviews/queue`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (queueResponse.status === 200) {
    console.log('✅ Review queue retrieved successfully');
    console.log(`   Cases in queue: ${queueResponse.data.cases?.length || 0}`);
  } else {
    console.error('❌ Failed to get review queue:', queueResponse.data);
  }
  
  // Test 2: Assign case for review (admin)
  console.log('\n📋 Test 2: Assigning case for review (admin)...');
  const assignResponse = await makeRequest(`${BASE_URL}/api/reviews/assign/${testCaseDoc._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      priority: 'high',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  
  if (assignResponse.status === 201) {
    console.log('✅ Case assigned successfully');
    console.log('   Review ID:', assignResponse.data.review?._id);
    console.log('   Assigned to:', assignResponse.data.reviewer?.username);
  } else {
    console.error('❌ Failed to assign case:', assignResponse.data);
    return;
  }
  
  const reviewId = assignResponse.data.review?._id;
  
  // Test 3: Get pending reviews (educator)
  console.log('\n📋 Test 3: Getting pending reviews (educator)...');
  const pendingResponse = await makeRequest(`${BASE_URL}/api/reviews/pending`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${educatorToken}` }
  });
  
  if (pendingResponse.status === 200) {
    console.log('✅ Pending reviews retrieved successfully');
    console.log(`   Pending reviews: ${pendingResponse.data.length}`);
  } else {
    console.error('❌ Failed to get pending reviews:', pendingResponse.data);
  }
  
  // Test 4: Start review (educator)
  console.log('\n📋 Test 4: Starting review (educator)...');
  const startResponse = await makeRequest(`${BASE_URL}/api/reviews/${reviewId}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${educatorToken}` }
  });
  
  if (startResponse.status === 200) {
    console.log('✅ Review started successfully');
    console.log('   Review status:', startResponse.data.review?.status);
  } else {
    console.error('❌ Failed to start review:', startResponse.data);
    return;
  }
  
  // Test 5: Add annotation (educator)
  console.log('\n📋 Test 5: Adding annotation (educator)...');
  const annotationResponse = await makeRequest(`${BASE_URL}/api/reviews/${reviewId}/annotations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${educatorToken}` },
    body: JSON.stringify({
      type: 'comment',
      fieldPath: 'patient_profile.demographics.age',
      content: 'Consider adding more demographic details',
      suggestedValue: '45 years old',
      severity: 'low'
    })
  });
  
  if (annotationResponse.status === 201) {
    console.log('✅ Annotation added successfully');
    console.log('   Annotations count:', annotationResponse.data.review?.annotations?.length);
  } else {
    console.error('❌ Failed to add annotation:', annotationResponse.data);
  }
  
  // Test 6: Complete review (educator)
  console.log('\n📋 Test 6: Completing review (educator)...');
  const completeResponse = await makeRequest(`${BASE_URL}/api/reviews/${reviewId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${educatorToken}` },
    body: JSON.stringify({
      decision: 'approved',
      feedback: 'Excellent case with good clinical details. Minor suggestions provided.',
      ratings: {
        clinical_accuracy: 4,
        educational_value: 5,
        completeness: 4
      }
    })
  });
  
  if (completeResponse.status === 200) {
    console.log('✅ Review completed successfully');
    console.log('   Final decision:', completeResponse.data.review?.decision);
    console.log('   Case status:', completeResponse.data.case?.status);
  } else {
    console.error('❌ Failed to complete review:', completeResponse.data);
  }
  
  // Test 7: Get review statistics (admin)
  console.log('\n📋 Test 7: Getting review statistics (admin)...');
  const statsResponse = await makeRequest(`${BASE_URL}/api/reviews/statistics`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (statsResponse.status === 200) {
    console.log('✅ Review statistics retrieved successfully');
    console.log('   Total reviews:', statsResponse.data.totalReviews);
    console.log('   Approved cases:', statsResponse.data.approvedCount);
  } else {
    console.error('❌ Failed to get review statistics:', statsResponse.data);
  }
  
  // Test 8: Get case reviews (educator)
  console.log('\n📋 Test 8: Getting case reviews (educator)...');
  const caseReviewsResponse = await makeRequest(`${BASE_URL}/api/reviews/case/${testCaseDoc._id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${educatorToken}` }
  });
  
  if (caseReviewsResponse.status === 200) {
    console.log('✅ Case reviews retrieved successfully');
    console.log('   Review count:', caseReviewsResponse.data.length);
  } else {
    console.error('❌ Failed to get case reviews:', caseReviewsResponse.data);
  }
  
  console.log('\n🎉 Review workflow test completed!');
  console.log('\n📊 Summary:');
  console.log('   - Users created: 3 (admin, educator, student)');
  console.log('   - Test case created and submitted');
  console.log('   - Case assigned for review');
  console.log('   - Review started and completed');
  console.log('   - Annotation added');
  console.log('   - Statistics retrieved');
  
  // Clean up
  console.log('\n🧹 Cleaning up test data...');
  await User.deleteMany({ _id: { $in: [adminUser._id, educatorUser._id, studentUser._id] } });
  await ContributedCase.deleteOne({ _id: testCaseDoc._id });
  await CaseReview.deleteMany({ caseId: testCaseDoc._id });
  
  console.log('✅ Test data cleaned up');
  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected');
}

// Run the test
testReviewWorkflow().catch(console.error);