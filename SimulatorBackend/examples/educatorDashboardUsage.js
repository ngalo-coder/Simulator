/**
 * Educator Dashboard Usage Examples
 * 
 * This file demonstrates how to use the Educator Dashboard API endpoints
 * for managing students, cases, and analytics in the healthcare education platform.
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:3000/api';
const educatorToken = 'your-educator-jwt-token-here';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${educatorToken}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example 1: Get Educator Dashboard Overview
 * Retrieves comprehensive dashboard data including student stats, case stats, and performance metrics
 */
async function getEducatorDashboard() {
  try {
    console.log('🎯 Getting educator dashboard overview...');
    
    const response = await apiClient.get('/educator/dashboard');
    
    console.log('✅ Dashboard Overview:');
    console.log(`   Total Students: ${response.data.data.overview.totalStudents}`);
    console.log(`   Active Students: ${response.data.data.overview.activeStudents}`);
    console.log(`   Total Cases: ${response.data.data.overview.totalCases}`);
    console.log(`   Published Cases: ${response.data.data.overview.publishedCases}`);
    console.log(`   Average Performance: ${response.data.data.overview.averagePerformance}%`);
    console.log(`   Completion Rate: ${response.data.data.overview.completionRate}%`);
    
    console.log('\n📊 Student Statistics:');
    console.log(`   Engagement Rate: ${response.data.data.studentStats.engagementRate}%`);
    console.log(`   Students Needing Attention: ${response.data.data.studentStats.studentsNeedingAttention}`);
    
    console.log('\n📚 Case Statistics:');
    console.log(`   Draft Cases: ${response.data.data.caseStats.draftCases}`);
    console.log(`   Pending Review: ${response.data.data.caseStats.pendingReviewCases}`);
    console.log(`   Publication Rate: ${response.data.data.caseStats.publicationRate}%`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting dashboard:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Get Assigned Students with Filtering
 * Retrieves paginated list of students with search, filtering, and sorting options
 */
async function getAssignedStudents(options = {}) {
  try {
    console.log('👥 Getting assigned students...');
    
    const params = {
      page: options.page || 1,
      limit: options.limit || 20,
      sortBy: options.sortBy || 'profile.lastName',
      sortOrder: options.sortOrder || 'asc',
      search: options.search || '',
      discipline: options.discipline || '',
      status: options.status || 'all'
    };
    
    const response = await apiClient.get('/educator/students', { params });
    
    console.log(`✅ Found ${response.data.data.students.length} students:`);
    response.data.data.students.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.profile.firstName} ${student.profile.lastName}`);
      console.log(`      Email: ${student.email}`);
      console.log(`      Discipline: ${student.profile.discipline}`);
      console.log(`      Progress: ${student.progress.totalAttempts} attempts, ${student.progress.averageScore}% avg`);
      console.log(`      Last Activity: ${student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}`);
      console.log('');
    });
    
    console.log(`📄 Pagination: Page ${response.data.data.pagination.page} of ${response.data.data.pagination.totalPages}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting students:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Get Detailed Student Progress
 * Retrieves comprehensive progress data for a specific student
 */
async function getStudentProgress(studentId) {
  try {
    console.log(`📈 Getting progress for student ${studentId}...`);
    
    const response = await apiClient.get(`/educator/students/${studentId}/progress`);
    
    const progress = response.data.data;
    console.log('✅ Student Progress:');
    console.log(`   Total Attempts: ${progress.totalAttempts}`);
    console.log(`   Average Score: ${progress.averageScore}%`);
    console.log(`   Completed Cases: ${progress.completedCases}`);
    console.log(`   Recent Trend: ${progress.recentTrend}`);
    console.log(`   Last Activity: ${progress.lastActivity ? new Date(progress.lastActivity).toLocaleDateString() : 'No activity'}`);
    
    console.log('\n🎯 Competency Scores:');
    Object.entries(progress.competencyScores).forEach(([competency, score]) => {
      console.log(`   ${competency}: ${score}%`);
    });
    
    return progress;
  } catch (error) {
    console.error('❌ Error getting student progress:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 4: Get Case Management Data
 * Retrieves educator's cases with management interface data
 */
async function getCaseManagementData(options = {}) {
  try {
    console.log('📚 Getting case management data...');
    
    const params = {
      page: options.page || 1,
      limit: options.limit || 20,
      sortBy: options.sortBy || 'updatedAt',
      sortOrder: options.sortOrder || 'desc',
      status: options.status || 'all',
      discipline: options.discipline || ''
    };
    
    const response = await apiClient.get('/educator/cases', { params });
    
    console.log(`✅ Found ${response.data.data.cases.length} cases:`);
    response.data.data.cases.forEach((caseItem, index) => {
      console.log(`   ${index + 1}. ${caseItem.case_metadata.title}`);
      console.log(`      ID: ${caseItem.case_metadata.case_id}`);
      console.log(`      Status: ${caseItem.status}`);
      console.log(`      Specialty: ${caseItem.case_metadata.specialty}`);
      console.log(`      Difficulty: ${caseItem.case_metadata.difficulty}`);
      console.log(`      Usage: ${caseItem.usageStats.totalAttempts} attempts by ${caseItem.usageStats.uniqueUsers} users`);
      console.log(`      Average Score: ${caseItem.usageStats.averageScore}%`);
      console.log('');
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting cases:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 5: Create a New Case
 * Demonstrates how to create a new medical case
 */
async function createNewCase() {
  try {
    console.log('➕ Creating new case...');
    
    const caseData = {
      case_metadata: {
        title: 'Acute Myocardial Infarction Case',
        specialty: 'medicine',
        difficulty: 'intermediate',
        estimated_duration: 45,
        learning_objectives: [
          'Recognize signs and symptoms of MI',
          'Order appropriate diagnostic tests',
          'Initiate appropriate treatment'
        ]
      },
      description: 'A 55-year-old male presents with acute chest pain and shortness of breath.',
      patient_persona: {
        name: 'Robert Johnson',
        age: 55,
        gender: 'male',
        occupation: 'Construction worker',
        medical_history: ['Hypertension', 'Smoking history']
      },
      clinical_dossier: {
        chief_complaint: 'Severe chest pain radiating to left arm',
        history_present_illness: 'Patient reports sudden onset of crushing chest pain while at work...',
        physical_examination: {
          vital_signs: {
            blood_pressure: '160/95',
            heart_rate: '110',
            respiratory_rate: '22',
            temperature: '98.6°F',
            oxygen_saturation: '94%'
          },
          general_appearance: 'Anxious, diaphoretic male in moderate distress'
        },
        hidden_diagnosis: 'ST-elevation myocardial infarction (STEMI)',
        treatment_plan: 'Emergency PCI, dual antiplatelet therapy, beta-blocker'
      },
      assessment_criteria: {
        diagnosis_accuracy: { weight: 30, max_score: 100 },
        diagnostic_workup: { weight: 25, max_score: 100 },
        treatment_selection: { weight: 25, max_score: 100 },
        time_to_treatment: { weight: 20, max_score: 100 }
      }
    };
    
    const response = await apiClient.post('/educator/cases', caseData);
    
    console.log('✅ Case created successfully:');
    console.log(`   Case ID: ${response.data.data.case_metadata.case_id}`);
    console.log(`   Title: ${response.data.data.case_metadata.title}`);
    console.log(`   Status: ${response.data.data.status}`);
    console.log(`   Created: ${new Date(response.data.data.createdAt).toLocaleDateString()}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating case:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Get Case Analytics
 * Retrieves detailed analytics for a specific case
 */
async function getCaseAnalytics(caseId) {
  try {
    console.log(`📊 Getting analytics for case ${caseId}...`);
    
    const response = await apiClient.get(`/educator/cases/${caseId}/analytics`);
    
    const analytics = response.data.data;
    console.log('✅ Case Analytics:');
    console.log(`   Total Attempts: ${analytics.totalAttempts}`);
    console.log(`   Unique Students: ${analytics.uniqueStudents}`);
    console.log(`   Average Score: ${analytics.averageScore}%`);
    console.log(`   Completion Rate: ${analytics.completionRate}%`);
    console.log(`   Average Time Spent: ${Math.round(analytics.averageTimeSpent / 60)} minutes`);
    console.log(`   Difficulty Rating: ${analytics.difficultyRating}/10`);
    
    console.log('\n📈 Performance Distribution:');
    console.log(`   Excellent (90-100%): ${analytics.performanceDistribution.excellent} students`);
    console.log(`   Good (80-89%): ${analytics.performanceDistribution.good} students`);
    console.log(`   Average (70-79%): ${analytics.performanceDistribution.average} students`);
    console.log(`   Poor (<70%): ${analytics.performanceDistribution.poor} students`);
    
    if (analytics.commonMistakes.length > 0) {
      console.log('\n⚠️ Common Mistakes:');
      analytics.commonMistakes.forEach((mistake, index) => {
        console.log(`   ${index + 1}. ${mistake.mistake} (${mistake.count} occurrences)`);
      });
    }
    
    if (analytics.improvementSuggestions.length > 0) {
      console.log('\n💡 Improvement Suggestions:');
      analytics.improvementSuggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. [${suggestion.priority.toUpperCase()}] ${suggestion.message}`);
      });
    }
    
    return analytics;
  } catch (error) {
    console.error('❌ Error getting case analytics:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 7: Create a Class/Group
 * Demonstrates how to create a class for student management
 */
async function createClass(studentIds = []) {
  try {
    console.log('🏫 Creating new class...');
    
    const classData = {
      name: 'Advanced Medical Cases - Fall 2024',
      description: 'Advanced case studies for senior medical students focusing on emergency medicine and critical care.',
      discipline: 'medicine',
      studentIds: studentIds
    };
    
    const response = await apiClient.post('/educator/classes', classData);
    
    console.log('✅ Class created successfully:');
    console.log(`   Name: ${response.data.data.name}`);
    console.log(`   Discipline: ${response.data.data.discipline}`);
    console.log(`   Students: ${response.data.data.students.length} enrolled`);
    console.log(`   Created: ${new Date(response.data.data.createdAt).toLocaleDateString()}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating class:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 8: Get Comprehensive Analytics
 * Retrieves all analytics data for the educator
 */
async function getComprehensiveAnalytics() {
  try {
    console.log('📊 Getting comprehensive analytics...');
    
    const response = await apiClient.get('/educator/analytics');
    
    const analytics = response.data.data;
    
    console.log('✅ Performance Metrics:');
    console.log(`   Average Score: ${analytics.performanceMetrics.averageScore}%`);
    console.log(`   Completion Rate: ${analytics.performanceMetrics.completionRate}%`);
    console.log(`   Improvement Rate: ${analytics.performanceMetrics.improvementRate}%`);
    console.log(`   Total Attempts: ${analytics.performanceMetrics.totalAttempts}`);
    console.log(`   Active Students: ${analytics.performanceMetrics.uniqueStudentsActive}`);
    
    console.log('\n📚 Case Statistics:');
    console.log(`   Total Cases: ${analytics.caseStatistics.totalCases}`);
    console.log(`   Published Cases: ${analytics.caseStatistics.publishedCases}`);
    console.log(`   Draft Cases: ${analytics.caseStatistics.draftCases}`);
    console.log(`   Publication Rate: ${analytics.caseStatistics.publicationRate}%`);
    
    console.log('\n👥 Student Statistics:');
    console.log(`   Total Students: ${analytics.studentStatistics.totalStudents}`);
    console.log(`   Active Students: ${analytics.studentStatistics.activeStudents}`);
    console.log(`   Engagement Rate: ${analytics.studentStatistics.engagementRate}%`);
    
    if (analytics.performanceMetrics.performanceTrends.length > 0) {
      console.log('\n📈 Performance Trends (Last 6 months):');
      analytics.performanceMetrics.performanceTrends.forEach(trend => {
        console.log(`   ${trend.month}: ${trend.averageScore}% (${trend.attemptCount} attempts)`);
      });
    }
    
    return analytics;
  } catch (error) {
    console.error('❌ Error getting analytics:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 9: Submit Case for Review
 * Demonstrates the case review workflow
 */
async function submitCaseForReview(caseId) {
  try {
    console.log(`📝 Submitting case ${caseId} for review...`);
    
    const response = await apiClient.post(`/educator/cases/${caseId}/submit-review`);
    
    console.log('✅ Case submitted for review:');
    console.log(`   Status: ${response.data.data.status}`);
    console.log(`   Submitted: ${new Date(response.data.data.submittedForReviewAt).toLocaleDateString()}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error submitting case for review:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 10: Add Collaborator to Case
 * Demonstrates case collaboration features
 */
async function addCaseCollaborator(caseId, collaboratorUserId) {
  try {
    console.log(`👥 Adding collaborator to case ${caseId}...`);
    
    const collaboratorData = {
      userId: collaboratorUserId,
      role: 'editor',
      permissions: ['read', 'write']
    };
    
    const response = await apiClient.post(`/educator/cases/${caseId}/collaborators`, collaboratorData);
    
    console.log('✅ Collaborator added successfully:');
    console.log(`   Case: ${response.data.data.case_metadata.title}`);
    console.log(`   Collaborators: ${response.data.data.collaborators.length}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error adding collaborator:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main demonstration function
 * Runs through various educator dashboard features
 */
async function demonstrateEducatorDashboard() {
  console.log('🎓 Educator Dashboard API Demonstration\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Get dashboard overview
    await getEducatorDashboard();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // 2. Get assigned students
    await getAssignedStudents({
      page: 1,
      limit: 5,
      status: 'active'
    });
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // 3. Get case management data
    await getCaseManagementData({
      status: 'published',
      limit: 3
    });
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // 4. Get comprehensive analytics
    await getComprehensiveAnalytics();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    console.log('✅ Educator Dashboard demonstration completed successfully!');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
  }
}

// Export functions for use in other modules
export {
  getEducatorDashboard,
  getAssignedStudents,
  getStudentProgress,
  getCaseManagementData,
  createNewCase,
  getCaseAnalytics,
  createClass,
  getComprehensiveAnalytics,
  submitCaseForReview,
  addCaseCollaborator,
  demonstrateEducatorDashboard
};

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateEducatorDashboard();
}