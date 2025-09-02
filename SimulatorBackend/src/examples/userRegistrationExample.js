import userRegistrationService from '../services/UserRegistrationService.js';
import { UserRole, HealthcareDiscipline } from '../models/UserModel.js';

/**
 * Example usage of the User Registration Service
 * This file demonstrates how to use the registration system
 */

// Example 1: Register a new student
async function registerStudent() {
  try {
    const studentData = {
      username: 'johnsmith',
      email: 'john.smith@university.edu',
      password: 'securePassword123',
      primaryRole: UserRole.STUDENT,
      discipline: HealthcareDiscipline.MEDICINE,
      firstName: 'John',
      lastName: 'Smith',
      institution: 'Medical University',
      yearOfStudy: 3,
      specialization: 'Internal Medicine'
    };

    const result = await userRegistrationService.registerUser(studentData);
    
    console.log('Student registered successfully:', {
      userId: result.user._id,
      username: result.user.username,
      token: result.token,
      profileComplete: result.profileComplete
    });

    return result;
  } catch (error) {
    console.error('Student registration failed:', error.message);
    throw error;
  }
}

// Example 2: Register a new educator
async function registerEducator() {
  try {
    const educatorData = {
      username: 'drjohnson',
      email: 'dr.johnson@university.edu',
      password: 'educatorPassword456',
      primaryRole: UserRole.EDUCATOR,
      discipline: HealthcareDiscipline.NURSING,
      firstName: 'Sarah',
      lastName: 'Johnson',
      institution: 'Nursing College',
      specialization: 'Critical Care Nursing',
      licenseNumber: 'RN123456'
    };

    const result = await userRegistrationService.registerUser(educatorData);
    
    console.log('Educator registered successfully:', {
      userId: result.user._id,
      username: result.user.username,
      discipline: result.user.discipline,
      profileComplete: result.profileComplete
    });

    return result;
  } catch (error) {
    console.error('Educator registration failed:', error.message);
    throw error;
  }
}

// Example 3: Complete user profile
async function completeUserProfile(userId) {
  try {
    const profileData = {
      specialization: 'Cardiology',
      yearOfStudy: 4,
      competencyLevel: 'competent',
      preferences: {
        learningStyle: 'visual',
        difficultyPreference: 'intermediate',
        notifications: {
          email: true,
          push: true,
          caseReminders: true,
          progressUpdates: false
        }
      },
      competencies: [
        {
          competencyId: 'CUSTOM001',
          competencyName: 'Advanced Cardiac Assessment',
          targetLevel: 4
        }
      ]
    };

    const result = await userRegistrationService.completeProfile(userId, profileData);
    
    console.log('Profile completed successfully:', {
      userId: result.user._id,
      profileComplete: result.profileComplete,
      competencies: result.user.competencies.length
    });

    return result;
  } catch (error) {
    console.error('Profile completion failed:', error.message);
    throw error;
  }
}

// Example 4: Update user preferences
async function updateUserPreferences(userId) {
  try {
    const newPreferences = {
      learningStyle: 'kinesthetic',
      difficultyPreference: 'advanced',
      language: 'es',
      timezone: 'America/New_York',
      notifications: {
        email: false,
        push: true,
        caseReminders: true,
        progressUpdates: true
      }
    };

    const result = await userRegistrationService.updatePreferences(userId, newPreferences);
    
    console.log('Preferences updated successfully:', {
      userId: userId,
      preferences: result.preferences
    });

    return result;
  } catch (error) {
    console.error('Preferences update failed:', error.message);
    throw error;
  }
}

// Example 5: Update user profile
async function updateUserProfile(userId) {
  try {
    const updateData = {
      email: 'newemail@university.edu',
      firstName: 'John',
      lastName: 'Smith-Johnson',
      specialization: 'Emergency Medicine',
      yearOfStudy: 4,
      competencyLevel: 'proficient',
      preferences: {
        learningStyle: 'auditory'
      }
    };

    const result = await userRegistrationService.updateProfile(userId, updateData);
    
    console.log('Profile updated successfully:', {
      userId: result.user._id,
      email: result.user.email,
      fullName: `${result.user.profile.firstName} ${result.user.profile.lastName}`,
      specialization: result.user.profile.specialization
    });

    return result;
  } catch (error) {
    console.error('Profile update failed:', error.message);
    throw error;
  }
}

// Example 6: Change user password
async function changeUserPassword(userId) {
  try {
    const result = await userRegistrationService.changePassword(
      userId,
      'currentPassword123',
      'newSecurePassword456'
    );
    
    console.log('Password changed successfully:', {
      userId: userId,
      message: result.message
    });

    return result;
  } catch (error) {
    console.error('Password change failed:', error.message);
    throw error;
  }
}

// Example 7: Get user profile
async function getUserProfile(userId) {
  try {
    const result = await userRegistrationService.getProfile(userId);
    
    console.log('Profile retrieved successfully:', {
      userId: result.user._id,
      username: result.user.username,
      fullName: `${result.user.profile.firstName} ${result.user.profile.lastName}`,
      discipline: result.user.discipline,
      role: result.user.primaryRole,
      profileComplete: result.profileComplete,
      competenciesCount: result.user.competencies?.length || 0
    });

    return result;
  } catch (error) {
    console.error('Profile retrieval failed:', error.message);
    throw error;
  }
}

// Example 8: Registration with validation errors
async function demonstrateValidationErrors() {
  console.log('\n--- Demonstrating Validation Errors ---');
  
  // Missing required fields
  try {
    await userRegistrationService.registerUser({
      username: 'incomplete'
      // Missing email, password, etc.
    });
  } catch (error) {
    console.log('Expected validation error:', error.message);
  }

  // Invalid email format
  try {
    await userRegistrationService.registerUser({
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123',
      discipline: HealthcareDiscipline.MEDICINE,
      firstName: 'Test',
      lastName: 'User',
      institution: 'Test University'
    });
  } catch (error) {
    console.log('Expected email validation error:', error.message);
  }

  // Weak password
  try {
    await userRegistrationService.registerUser({
      username: 'testuser2',
      email: 'test@example.com',
      password: '123',
      discipline: HealthcareDiscipline.MEDICINE,
      firstName: 'Test',
      lastName: 'User',
      institution: 'Test University'
    });
  } catch (error) {
    console.log('Expected password validation error:', error.message);
  }

  // Invalid discipline
  try {
    await userRegistrationService.registerUser({
      username: 'testuser3',
      email: 'test3@example.com',
      password: 'password123',
      discipline: 'invalid-discipline',
      firstName: 'Test',
      lastName: 'User',
      institution: 'Test University'
    });
  } catch (error) {
    console.log('Expected discipline validation error:', error.message);
  }
}

// Example 9: Complete registration workflow
async function completeRegistrationWorkflow() {
  console.log('\n--- Complete Registration Workflow ---');
  
  try {
    // Step 1: Register user
    console.log('Step 1: Registering new user...');
    const registration = await registerStudent();
    const userId = registration.user._id;
    
    // Step 2: Complete profile
    console.log('Step 2: Completing profile...');
    await completeUserProfile(userId);
    
    // Step 3: Update preferences
    console.log('Step 3: Updating preferences...');
    await updateUserPreferences(userId);
    
    // Step 4: Get final profile
    console.log('Step 4: Retrieving final profile...');
    const finalProfile = await getUserProfile(userId);
    
    console.log('\nWorkflow completed successfully!');
    console.log('Final profile status:', {
      profileComplete: finalProfile.profileComplete,
      competencies: finalProfile.user.competencies?.length || 0,
      preferences: finalProfile.user.profile.preferences
    });
    
  } catch (error) {
    console.error('Workflow failed:', error.message);
  }
}

// Example 10: Get registration statistics
async function getRegistrationStatistics() {
  try {
    const stats = await userRegistrationService.getRegistrationStats();
    
    console.log('Registration Statistics:', {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      verifiedUsers: stats.verifiedUsers,
      usersByRole: stats.usersByRole,
      usersByDiscipline: stats.usersByDiscipline
    });

    return stats;
  } catch (error) {
    console.error('Failed to get statistics:', error.message);
    throw error;
  }
}

// Export examples for use in other files
export {
  registerStudent,
  registerEducator,
  completeUserProfile,
  updateUserPreferences,
  updateUserProfile,
  changeUserPassword,
  getUserProfile,
  demonstrateValidationErrors,
  completeRegistrationWorkflow,
  getRegistrationStatistics
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running User Registration Service Examples...\n');
  
  // Run validation error examples
  await demonstrateValidationErrors();
  
  // Note: Complete workflow would require a database connection
  // await completeRegistrationWorkflow();
  
  console.log('\nExamples completed. Check the console output above.');
}