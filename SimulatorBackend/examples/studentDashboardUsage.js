/**
 * Student Dashboard Usage Examples
 * 
 * This file demonstrates how to use the Student Dashboard API endpoints
 * for accessing personalized learning content, progress tracking, and guidance
 * in the healthcare education platform.
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:3000/api';
const studentToken = 'your-student-jwt-token-here';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example 1: Get Student Dashboard Overview
 * Retrieves comprehensive dashboard data including progress, recommendations, and achievements
 */
async function getStudentDashboard() {
  try {
    console.log('🎓 Getting student dashboard overview...');
    
    const response = await apiClient.get('/student/dashboard');
    
    const data = response.data.data;
    
    console.log('✅ Dashboard Overview:');
    console.log(`   Student: ${data.student.name}`);
    console.log(`   Discipline: ${data.student.disciplineConfig.name}`);
    console.log(`   Year of Study: ${data.student.yearOfStudy}`);
    console.log(`   Institution: ${data.student.institution}`);
    
    console.log('\n📊 Progress Summary:');
    console.log(`   Total Attempts: ${data.progressSummary.totalAttempts}`);
    console.log(`   Completed Cases: ${data.progressSummary.completedCases}`);
    console.log(`   Average Score: ${data.progressSummary.averageScore}%`);
    console.log(`   Overall Progress: ${data.progressSummary.overallProgress}%`);
    console.log(`   Recent Trend: ${data.progressSummary.recentTrend}`);
    console.log(`   Study Streak: ${data.progressSummary.studyStreak} days`);
    
    console.log('\n🎯 Competency Scores:');
    Object.entries(data.progressSummary.competencyScores).forEach(([competency, score]) => {
      console.log(`   ${competency}: ${score}%`);
    });
    
    console.log('\n📚 Recommended Cases:');
    data.recommendedCases.forEach((caseItem, index) => {
      console.log(`   ${index + 1}. ${caseItem.title}`);
      console.log(`      Difficulty: ${caseItem.difficulty}`);
      console.log(`      Duration: ${caseItem.estimatedDuration} minutes`);
      console.log(`      Reason: ${caseItem.recommendationReason}`);
      console.log('');
    });
    
    console.log('🏆 Recent Achievements:');
    data.achievements.badges.forEach(badge => {
      console.log(`   🏅 ${badge.name}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error getting dashboard:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Browse Available Cases
 * Retrieves available cases with filtering and search options
 */
async function browseAvailableCases(options = {}) {
  try {
    console.log('📚 Browsing available cases...');
    
    const params = {
      page: options.page || 1,
      limit: options.limit || 12,
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc',
      search: options.search || '',
      difficulty: options.difficulty ? options.difficulty.join(',') : undefined
    };
    
    const response = await apiClient.get('/student/cases', { params });
    
    const data = response.data.data;
    
    console.log(`✅ Found ${data.cases.length} cases:`);
    data.cases.forEach((caseItem, index) => {
      console.log(`   ${index + 1}. ${caseItem.title}`);
      console.log(`      Difficulty: ${caseItem.difficulty}`);
      console.log(`      Specialty: ${caseItem.specialty}`);
      console.log(`      Duration: ${caseItem.estimatedDuration} minutes`);
      console.log(`      Patient: ${caseItem.patientAge}yo ${caseItem.patientGender}`);
      console.log(`      Chief Complaint: ${caseItem.chiefComplaint}`);
      
      if (caseItem.studentProgress) {
        console.log(`      Your Progress: ${caseItem.studentProgress.status} (${caseItem.studentProgress.attempts} attempts)`);
        if (caseItem.studentProgress.score) {
          console.log(`      Best Score: ${caseItem.studentProgress.score}%`);
        }
      } else {
        console.log(`      Status: Not attempted`);
      }
      console.log('');
    });
    
    console.log(`📄 Pagination: Page ${data.pagination.page} of ${data.pagination.totalPages}`);
    console.log(`   Total Cases: ${data.pagination.total}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error browsing cases:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Get Personalized Recommendations
 * Retrieves AI-powered case recommendations based on student progress
 */
async function getPersonalizedRecommendations(limit = 6) {
  try {
    console.log('🤖 Getting personalized recommendations...');
    
    const response = await apiClient.get('/student/recommendations', {
      params: { limit }
    });
    
    const recommendations = response.data.data;
    
    console.log(`✅ Top ${recommendations.length} Recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title}`);
      console.log(`      Relevance Score: ${rec.relevanceScore}/100`);
      console.log(`      Difficulty: ${rec.difficulty}`);
      console.log(`      Duration: ${rec.estimatedDuration} minutes`);
      console.log(`      Why recommended: ${rec.recommendationReason}`);
      console.log(`      Patient: ${rec.patientAge}yo ${rec.patientGender} with ${rec.chiefComplaint}`);
      console.log('');
    });
    
    return recommendations;
  } catch (error) {
    console.error('❌ Error getting recommendations:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 4: Track Detailed Progress
 * Retrieves comprehensive progress analytics and competency tracking
 */
async function trackDetailedProgress() {
  try {
    console.log('📈 Getting detailed progress information...');
    
    const response = await apiClient.get('/student/progress');
    
    const progress = response.data.data;
    
    console.log('✅ Detailed Progress Report:');
    console.log(`   📊 Overall Progress: ${progress.overallProgress}%`);
    console.log(`   📝 Total Attempts: ${progress.totalAttempts}`);
    console.log(`   ✅ Completed Cases: ${progress.completedCases}`);
    console.log(`   📊 Average Score: ${progress.averageScore}%`);
    console.log(`   📈 Recent Trend: ${progress.recentTrend}`);
    console.log(`   🔥 Study Streak: ${progress.studyStreak} days`);
    
    if (progress.nextMilestone) {
      console.log(`   🎯 Next Milestone: ${progress.nextMilestone.name}`);
      console.log(`      Description: ${progress.nextMilestone.description}`);
    }
    
    console.log('\n🎯 Competency Breakdown:');
    Object.entries(progress.competencyScores).forEach(([competency, score]) => {
      const status = score >= 85 ? '🟢' : score >= 70 ? '🟡' : '🔴';
      console.log(`   ${status} ${competency}: ${score}%`);
    });
    
    if (progress.lastActivity) {
      console.log(`\n⏰ Last Activity: ${new Date(progress.lastActivity).toLocaleDateString()}`);
    }
    
    return progress;
  } catch (error) {
    console.error('❌ Error getting progress:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 5: View Achievements and Badges
 * Retrieves student achievements, badges, and milestone progress
 */
async function viewAchievements() {
  try {
    console.log('🏆 Getting achievements and badges...');
    
    const response = await apiClient.get('/student/achievements');
    
    const achievements = response.data.data;
    
    console.log('✅ Achievement Summary:');
    console.log(`   🎖️ Total Points: ${achievements.totalPoints}`);
    console.log(`   🏅 Badges Earned: ${achievements.badges.length}`);
    
    console.log('\n🏅 Earned Badges:');
    achievements.badges.forEach(badge => {
      console.log(`   ${badge.icon} ${badge.name}`);
      console.log(`      Earned: ${new Date(badge.earnedAt).toLocaleDateString()}`);
    });
    
    console.log('\n🎯 Milestone Progress:');
    achievements.milestones.forEach(milestone => {
      const progress = Math.min((milestone.current / milestone.target) * 100, 100);
      const status = milestone.completed ? '✅' : '⏳';
      console.log(`   ${status} ${milestone.name}`);
      console.log(`      Progress: ${milestone.current}/${milestone.target} (${progress.toFixed(1)}%)`);
    });
    
    return achievements;
  } catch (error) {
    console.error('❌ Error getting achievements:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Get Learning Path Guidance
 * Retrieves personalized learning path with focus areas and recommendations
 */
async function getLearningPathGuidance() {
  try {
    console.log('🛤️ Getting learning path guidance...');
    
    const response = await apiClient.get('/student/learning-path');
    
    const learningPath = response.data.data;
    
    console.log('✅ Learning Path Analysis:');
    console.log(`   📊 Current Level: ${learningPath.currentLevel}/5`);
    
    if (learningPath.nextLevel) {
      console.log(`   🎯 Next Level: ${learningPath.nextLevel}`);
      
      if (learningPath.estimatedTimeToNext) {
        console.log(`   ⏱️ Estimated Time to Next Level:`);
        console.log(`      Cases needed: ${learningPath.estimatedTimeToNext.casesNeeded}`);
        console.log(`      Hours needed: ${learningPath.estimatedTimeToNext.hoursNeeded}`);
        console.log(`      Weeks needed: ${learningPath.estimatedTimeToNext.weeksNeeded}`);
      }
    }
    
    console.log('\n🎯 Focus Areas for Improvement:');
    learningPath.focusAreas.forEach((area, index) => {
      const priorityIcon = area.priority === 'high' ? '🔴' : area.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${priorityIcon} ${area.competency}`);
      console.log(`      Current: ${area.currentScore}% → Target: ${area.targetScore}%`);
      console.log(`      Priority: ${area.priority}`);
    });
    
    return learningPath;
  } catch (error) {
    console.error('❌ Error getting learning path:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 7: Get Recent Activity History
 * Retrieves recent learning activity and case attempts
 */
async function getRecentActivity(limit = 10) {
  try {
    console.log('📋 Getting recent activity history...');
    
    const response = await apiClient.get('/student/activity', {
      params: { limit }
    });
    
    const activities = response.data.data;
    
    console.log(`✅ Recent Activity (Last ${activities.length} items):`);
    activities.forEach((activity, index) => {
      const date = new Date(activity.startTime).toLocaleDateString();
      const time = new Date(activity.startTime).toLocaleTimeString();
      
      console.log(`   ${index + 1}. ${activity.title}`);
      console.log(`      Date: ${date} at ${time}`);
      console.log(`      Status: ${activity.status}`);
      
      if (activity.score) {
        console.log(`      Score: ${activity.score}%`);
      }
      
      if (activity.duration) {
        const minutes = Math.round(activity.duration / 60);
        console.log(`      Duration: ${minutes} minutes`);
      }
      console.log('');
    });
    
    return activities;
  } catch (error) {
    console.error('❌ Error getting activity:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 8: Get Contextual Help
 * Retrieves contextual help and guidance based on current page/context
 */
async function getContextualHelp(context = {}) {
  try {
    console.log('❓ Getting contextual help...');
    
    const params = {
      page: context.page || 'dashboard',
      caseId: context.caseId,
      difficulty: context.difficulty
    };
    
    const response = await apiClient.get('/student/help/contextual', { params });
    
    const helpData = response.data.data;
    
    console.log(`✅ Contextual Help for ${params.page}:`);
    
    if (helpData.contextualHelp.length > 0) {
      console.log('\n💡 Help Items:');
      helpData.contextualHelp.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.type})`);
        console.log(`      ${item.content}`);
      });
    }
    
    if (helpData.quickTips.length > 0) {
      console.log('\n⚡ Quick Tips:');
      helpData.quickTips.forEach((tip, index) => {
        console.log(`   ${index + 1}. ${tip}`);
      });
    }
    
    if (helpData.relatedTutorials.length > 0) {
      console.log('\n📖 Related Tutorials:');
      helpData.relatedTutorials.forEach((tutorial, index) => {
        console.log(`   ${index + 1}. ${tutorial.title} (${tutorial.duration} min)`);
        console.log(`      Category: ${tutorial.category}`);
      });
    }
    
    return helpData;
  } catch (error) {
    console.error('❌ Error getting contextual help:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 9: Search Help Content
 * Searches through help articles, FAQs, and tutorials
 */
async function searchHelpContent(query) {
  try {
    console.log(`🔍 Searching help content for: "${query}"...`);
    
    const response = await apiClient.get('/student/help/search', {
      params: { q: query }
    });
    
    const searchResults = response.data.data;
    
    console.log(`✅ Found ${searchResults.totalResults} results:`);
    
    if (searchResults.results.faq.length > 0) {
      console.log('\n❓ FAQ Results:');
      searchResults.results.faq.forEach((faq, index) => {
        console.log(`   ${index + 1}. ${faq.question}`);
        console.log(`      ${faq.answer}`);
        console.log(`      Tags: ${faq.tags.join(', ')}`);
        console.log('');
      });
    }
    
    if (searchResults.results.tutorials.length > 0) {
      console.log('\n📖 Tutorial Results:');
      searchResults.results.tutorials.forEach((tutorial, index) => {
        console.log(`   ${index + 1}. ${tutorial.title} (${tutorial.duration} min)`);
        console.log(`      Category: ${tutorial.category}`);
        console.log(`      Steps: ${tutorial.steps.length}`);
      });
    }
    
    return searchResults;
  } catch (error) {
    console.error('❌ Error searching help:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 10: Get Personalized Guidance
 * Retrieves AI-powered personalized guidance based on student progress
 */
async function getPersonalizedGuidance() {
  try {
    console.log('🤖 Getting personalized guidance...');
    
    const response = await apiClient.get('/student/guidance');
    
    const guidance = response.data.data;
    
    console.log('✅ Personalized Guidance:');
    
    console.log('\n💡 Recommendations:');
    guidance.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n📚 Study Tips:');
    guidance.studyTips.forEach((tip, index) => {
      console.log(`   ${index + 1}. ${tip}`);
    });
    
    console.log('\n🎯 Next Steps:');
    guidance.nextSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
    
    console.log(`\n💬 Motivational Message:`);
    console.log(`   "${guidance.motivationalMessage}"`);
    
    return guidance;
  } catch (error) {
    console.error('❌ Error getting guidance:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main demonstration function
 * Runs through various student dashboard features
 */
async function demonstrateStudentDashboard() {
  console.log('🎓 Student Dashboard API Demonstration\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get dashboard overview
    await getStudentDashboard();
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // 2. Browse available cases
    await browseAvailableCases({
      difficulty: ['intermediate'],
      limit: 3
    });
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // 3. Get personalized recommendations
    await getPersonalizedRecommendations(3);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // 4. Track detailed progress
    await trackDetailedProgress();
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // 5. View achievements
    await viewAchievements();
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // 6. Get learning path guidance
    await getLearningPathGuidance();
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // 7. Get personalized guidance
    await getPersonalizedGuidance();
    console.log('\n' + '-'.repeat(60) + '\n');
    
    console.log('✅ Student Dashboard demonstration completed successfully!');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
  }
}

// Export functions for use in other modules
export {
  getStudentDashboard,
  browseAvailableCases,
  getPersonalizedRecommendations,
  trackDetailedProgress,
  viewAchievements,
  getLearningPathGuidance,
  getRecentActivity,
  getContextualHelp,
  searchHelpContent,
  getPersonalizedGuidance,
  demonstrateStudentDashboard
};

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateStudentDashboard();
}