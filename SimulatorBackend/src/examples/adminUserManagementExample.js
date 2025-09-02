import adminUserManagementService from '../services/AdminUserManagementService.js';
import { UserRole, HealthcareDiscipline } from '../models/UserModel.js';

/**
 * Admin User Management Examples
 * This file demonstrates how to use the admin user management system
 */

// Mock admin user for examples
const mockAdminUser = {
  _id: 'admin-123',
  username: 'admin',
  primaryRole: UserRole.ADMIN
};

// Example 1: Get paginated list of users with filtering
async function getUsersWithFiltering() {
  try {
    console.log('--- Getting Users with Filtering ---');
    
    // Basic pagination
    const basicResult = await adminUserManagementService.getUsers();
    console.log('Basic pagination:', {
      totalUsers: basicResult.pagination.total,
      currentPage: basicResult.pagination.page,
      usersOnPage: basicResult.users.length
    });

    // Filter by role
    const studentFilter = { role: UserRole.STUDENT };
    const studentResult = await adminUserManagementService.getUsers(studentFilter);
    console.log('Students only:', {
      count: studentResult.users.length,
      totalStudents: studentResult.pagination.total
    });

    // Filter by discipline
    const medicineFilter = { discipline: HealthcareDiscipline.MEDICINE };
    const medicineResult = await adminUserManagementService.getUsers(medicineFilter);
    console.log('Medicine discipline only:', {
      count: medicineResult.users.length
    });

    // Multiple filters
    const complexFilter = {
      role: [UserRole.STUDENT, UserRole.EDUCATOR],
      discipline: HealthcareDiscipline.NURSING,
      isActive: true
    };
    const complexResult = await adminUserManagementService.getUsers(complexFilter);
    console.log('Complex filter (active nursing students/educators):', {
      count: complexResult.users.length
    });

    // Search functionality
    const searchOptions = { search: 'john' };
    const searchResult = await adminUserManagementService.getUsers({}, searchOptions);
    console.log('Search for "john":', {
      count: searchResult.users.length
    });

    // Custom pagination and sorting
    const customOptions = {
      page: 2,
      limit: 10,
      sortBy: 'profile.lastName',
      sortOrder: 'asc'
    };
    const customResult = await adminUserManagementService.getUsers({}, customOptions);
    console.log('Custom pagination and sorting:', {
      page: customResult.pagination.page,
      hasNext: customResult.pagination.hasNext,
      hasPrev: customResult.pagination.hasPrev
    });

  } catch (error) {
    console.error('Get users error:', error.message);
  }
}

// Example 2: Create new users
async function createNewUsers() {
  try {
    console.log('\n--- Creating New Users ---');

    // Create a student
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
      specialization: 'Internal Medicine',
      competencyLevel: 'competent'
    };

    const newStudent = await adminUserManagementService.createUser(studentData, mockAdminUser);
    console.log('Created student:', {
      id: newStudent._id,
      username: newStudent.username,
      role: newStudent.primaryRole,
      discipline: newStudent.discipline
    });

    // Create an educator with secondary role
    const educatorData = {
      username: 'drjohnson',
      email: 'dr.johnson@university.edu',
      password: 'educatorPassword456',
      primaryRole: UserRole.EDUCATOR,
      secondaryRoles: [UserRole.STUDENT], // Can also be a student
      discipline: HealthcareDiscipline.NURSING,
      firstName: 'Sarah',
      lastName: 'Johnson',
      institution: 'Nursing College',
      specialization: 'Critical Care Nursing',
      licenseNumber: 'RN123456',
      competencyLevel: 'expert',
      emailVerified: true
    };

    const newEducator = await adminUserManagementService.createUser(educatorData, mockAdminUser);
    console.log('Created educator:', {
      id: newEducator._id,
      username: newEducator.username,
      primaryRole: newEducator.primaryRole,
      secondaryRoles: newEducator.secondaryRoles
    });

    // Create user with custom permissions
    const specialUserData = {
      username: 'specialuser',
      email: 'special@university.edu',
      password: 'specialPassword789',
      primaryRole: UserRole.STUDENT,
      discipline: HealthcareDiscipline.PHARMACY,
      firstName: 'Special',
      lastName: 'User',
      institution: 'Pharmacy School',
      permissions: [
        {
          resource: 'advanced-simulations',
          action: 'access',
          conditions: { disciplineMatch: true }
        }
      ]
    };

    const specialUser = await adminUserManagementService.createUser(specialUserData, mockAdminUser);
    console.log('Created special user with custom permissions:', {
      id: specialUser._id,
      permissions: specialUser.permissions?.length || 0
    });

  } catch (error) {
    console.error('Create user error:', error.message);
  }
}

// Example 3: Update existing users
async function updateExistingUsers() {
  try {
    console.log('\n--- Updating Existing Users ---');

    // Update basic user information
    const basicUpdate = {
      profile: {
        firstName: 'John',
        lastName: 'Smith-Updated',
        specialization: 'Emergency Medicine',
        yearOfStudy: 4
      },
      emailVerified: true
    };

    const updatedUser = await adminUserManagementService.updateUser(
      'user-id-123',
      basicUpdate,
      mockAdminUser
    );
    console.log('Updated user profile:', {
      name: `${updatedUser.profile.firstName} ${updatedUser.profile.lastName}`,
      specialization: updatedUser.profile.specialization,
      verified: updatedUser.emailVerified
    });

    // Update user roles
    const roleUpdate = {
      primaryRole: UserRole.EDUCATOR,
      secondaryRoles: [UserRole.STUDENT, UserRole.ADMIN]
    };

    await adminUserManagementService.updateUser('user-id-123', roleUpdate, mockAdminUser);
    console.log('Updated user roles to educator with secondary roles');

    // Update user permissions
    const permissionUpdate = {
      permissions: [
        {
          resource: 'cases',
          action: 'create',
          conditions: { disciplineMatch: true }
        },
        {
          resource: 'analytics',
          action: 'read',
          conditions: { ownClasses: true }
        }
      ]
    };

    await adminUserManagementService.updateUser('user-id-123', permissionUpdate, mockAdminUser);
    console.log('Updated user permissions');

    // Deactivate user
    const deactivateUpdate = { isActive: false };
    await adminUserManagementService.updateUser('user-id-123', deactivateUpdate, mockAdminUser);
    console.log('Deactivated user');

  } catch (error) {
    console.error('Update user error:', error.message);
  }
}

// Example 4: Bulk operations
async function performBulkOperations() {
  try {
    console.log('\n--- Performing Bulk Operations ---');

    const userIds = ['user-1', 'user-2', 'user-3', 'user-4'];

    // Bulk activate users
    const activateResult = await adminUserManagementService.bulkUpdateActiveStatus(
      userIds,
      true,
      mockAdminUser
    );
    console.log('Bulk activation result:', {
      modifiedCount: activateResult.modifiedCount,
      message: activateResult.message
    });

    // Bulk deactivate users
    const deactivateResult = await adminUserManagementService.bulkUpdateActiveStatus(
      userIds.slice(0, 2), // Only first 2 users
      false,
      mockAdminUser
    );
    console.log('Bulk deactivation result:', {
      modifiedCount: deactivateResult.modifiedCount,
      message: deactivateResult.message
    });

    // Bulk add educator role
    const addRoleResult = await adminUserManagementService.bulkRoleAssignment(
      userIds,
      UserRole.EDUCATOR,
      'add',
      mockAdminUser
    );
    console.log('Bulk role addition result:', {
      modifiedCount: addRoleResult.modifiedCount,
      message: addRoleResult.message
    });

    // Bulk remove educator role
    const removeRoleResult = await adminUserManagementService.bulkRoleAssignment(
      userIds.slice(2), // Last 2 users
      UserRole.EDUCATOR,
      'remove',
      mockAdminUser
    );
    console.log('Bulk role removal result:', {
      modifiedCount: removeRoleResult.modifiedCount,
      message: removeRoleResult.message
    });

  } catch (error) {
    console.error('Bulk operations error:', error.message);
  }
}

// Example 5: User statistics and analytics
async function getUserStatistics() {
  try {
    console.log('\n--- Getting User Statistics ---');

    const stats = await adminUserManagementService.getUserStatistics();
    
    console.log('Overall Statistics:', {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      inactiveUsers: stats.inactiveUsers,
      verifiedUsers: stats.verifiedUsers,
      unverifiedUsers: stats.unverifiedUsers,
      recentUsers: stats.recentUsers
    });

    console.log('Users by Role:', stats.usersByRole);
    console.log('Users by Discipline:', stats.usersByDiscipline);

    // Calculate percentages
    const activePercentage = ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1);
    const verifiedPercentage = ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1);
    
    console.log('Percentages:', {
      activeUsers: `${activePercentage}%`,
      verifiedUsers: `${verifiedPercentage}%`
    });

  } catch (error) {
    console.error('Get statistics error:', error.message);
  }
}

// Example 6: Password management
async function manageUserPasswords() {
  try {
    console.log('\n--- Managing User Passwords ---');

    // Reset user password
    const resetResult = await adminUserManagementService.resetUserPassword(
      'user-id-123',
      'newSecurePassword456',
      mockAdminUser
    );
    
    console.log('Password reset result:', resetResult);

    // Bulk password reset (custom implementation)
    const userIds = ['user-1', 'user-2', 'user-3'];
    const defaultPassword = 'temporaryPassword123';
    
    let resetCount = 0;
    for (const userId of userIds) {
      try {
        await adminUserManagementService.resetUserPassword(userId, defaultPassword, mockAdminUser);
        resetCount++;
      } catch (error) {
        console.error(`Failed to reset password for user ${userId}:`, error.message);
      }
    }
    
    console.log(`Bulk password reset completed: ${resetCount}/${userIds.length} users`);

  } catch (error) {
    console.error('Password management error:', error.message);
  }
}

// Example 7: Import/Export operations
async function importExportOperations() {
  try {
    console.log('\n--- Import/Export Operations ---');

    // Export users to CSV
    const exportFilters = {
      discipline: HealthcareDiscipline.MEDICINE,
      isActive: true
    };
    
    const csvData = await adminUserManagementService.exportUsers(exportFilters, mockAdminUser);
    console.log('Export completed:', {
      dataLength: csvData.length,
      linesCount: csvData.split('\n').length - 1, // Subtract header
      preview: csvData.substring(0, 200) + '...'
    });

    // Example CSV data for import
    const sampleCSV = `username,email,password,primaryRole,discipline,firstName,lastName,institution
newuser1,user1@example.com,password123,student,medicine,New,User1,Test University
newuser2,user2@example.com,password456,educator,nursing,New,User2,Nursing College`;

    const csvBuffer = Buffer.from(sampleCSV);
    const importResult = await adminUserManagementService.importUsers(csvBuffer, mockAdminUser);
    
    console.log('Import completed:', {
      total: importResult.total,
      created: importResult.created,
      updated: importResult.updated,
      errors: importResult.errors.length
    });

    if (importResult.errors.length > 0) {
      console.log('Import errors:', importResult.errors);
    }

  } catch (error) {
    console.error('Import/Export error:', error.message);
  }
}

// Example 8: Advanced filtering and search
async function advancedFilteringExamples() {
  try {
    console.log('\n--- Advanced Filtering Examples ---');

    // Date range filtering
    const dateRangeFilter = {
      createdAfter: '2023-01-01',
      createdBefore: '2023-12-31'
    };
    const dateResult = await adminUserManagementService.getUsers(dateRangeFilter);
    console.log('Users created in 2023:', dateResult.pagination.total);

    // Multiple role filtering
    const multiRoleFilter = {
      role: [UserRole.STUDENT, UserRole.EDUCATOR]
    };
    const multiRoleResult = await adminUserManagementService.getUsers(multiRoleFilter);
    console.log('Students and Educators:', multiRoleResult.pagination.total);

    // Multiple discipline filtering
    const multiDisciplineFilter = {
      discipline: [HealthcareDiscipline.MEDICINE, HealthcareDiscipline.NURSING]
    };
    const multiDisciplineResult = await adminUserManagementService.getUsers(multiDisciplineFilter);
    console.log('Medicine and Nursing users:', multiDisciplineResult.pagination.total);

    // Combined complex filtering
    const complexFilter = {
      role: UserRole.STUDENT,
      discipline: [HealthcareDiscipline.MEDICINE, HealthcareDiscipline.PHARMACY],
      isActive: true,
      emailVerified: false,
      createdAfter: '2023-06-01'
    };
    const complexResult = await adminUserManagementService.getUsers(complexFilter);
    console.log('Complex filter result:', {
      count: complexResult.pagination.total,
      description: 'Active, unverified students in Medicine/Pharmacy created after June 2023'
    });

  } catch (error) {
    console.error('Advanced filtering error:', error.message);
  }
}

// Example 9: User deletion with safety checks
async function safeUserDeletion() {
  try {
    console.log('\n--- Safe User Deletion ---');

    // Delete regular user
    const deleteResult = await adminUserManagementService.deleteUser('user-id-123', mockAdminUser);
    console.log('User deletion result:', deleteResult);

    // Attempt to delete last admin (should fail)
    try {
      await adminUserManagementService.deleteUser('last-admin-id', mockAdminUser);
    } catch (error) {
      console.log('Expected error when deleting last admin:', error.message);
    }

    // Bulk deletion simulation
    const usersToDelete = ['user-1', 'user-2', 'user-3'];
    let deletedCount = 0;
    const deletionErrors = [];

    for (const userId of usersToDelete) {
      try {
        await adminUserManagementService.deleteUser(userId, mockAdminUser);
        deletedCount++;
      } catch (error) {
        deletionErrors.push({ userId, error: error.message });
      }
    }

    console.log('Bulk deletion completed:', {
      deleted: deletedCount,
      errors: deletionErrors.length,
      errorDetails: deletionErrors
    });

  } catch (error) {
    console.error('User deletion error:', error.message);
  }
}

// Example 10: Complete admin workflow
async function completeAdminWorkflow() {
  try {
    console.log('\n--- Complete Admin Workflow ---');

    // 1. Get current statistics
    const initialStats = await adminUserManagementService.getUserStatistics();
    console.log('Initial statistics:', {
      total: initialStats.totalUsers,
      active: initialStats.activeUsers
    });

    // 2. Create new users
    const newUsers = [
      {
        username: 'workflow1',
        email: 'workflow1@example.com',
        password: 'password123',
        primaryRole: UserRole.STUDENT,
        discipline: HealthcareDiscipline.MEDICINE,
        firstName: 'Workflow',
        lastName: 'User1',
        institution: 'Test University'
      },
      {
        username: 'workflow2',
        email: 'workflow2@example.com',
        password: 'password456',
        primaryRole: UserRole.EDUCATOR,
        discipline: HealthcareDiscipline.NURSING,
        firstName: 'Workflow',
        lastName: 'User2',
        institution: 'Nursing College'
      }
    ];

    const createdUsers = [];
    for (const userData of newUsers) {
      try {
        const user = await adminUserManagementService.createUser(userData, mockAdminUser);
        createdUsers.push(user);
      } catch (error) {
        console.error(`Failed to create user ${userData.username}:`, error.message);
      }
    }

    console.log(`Created ${createdUsers.length} new users`);

    // 3. Update user roles
    if (createdUsers.length > 0) {
      const userIds = createdUsers.map(user => user._id);
      await adminUserManagementService.bulkRoleAssignment(
        userIds,
        UserRole.EDUCATOR,
        'add',
        mockAdminUser
      );
      console.log('Added educator role to all new users');
    }

    // 4. Export updated user list
    const exportData = await adminUserManagementService.exportUsers({}, mockAdminUser);
    console.log('Exported user data:', {
      size: exportData.length,
      users: exportData.split('\n').length - 1
    });

    // 5. Get final statistics
    const finalStats = await adminUserManagementService.getUserStatistics();
    console.log('Final statistics:', {
      total: finalStats.totalUsers,
      active: finalStats.activeUsers,
      change: finalStats.totalUsers - initialStats.totalUsers
    });

  } catch (error) {
    console.error('Complete workflow error:', error.message);
  }
}

// Export all examples
export {
  getUsersWithFiltering,
  createNewUsers,
  updateExistingUsers,
  performBulkOperations,
  getUserStatistics,
  manageUserPasswords,
  importExportOperations,
  advancedFilteringExamples,
  safeUserDeletion,
  completeAdminWorkflow
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Admin User Management Examples...\n');
  
  // Note: These examples would require a database connection in a real environment
  console.log('Examples available:');
  console.log('- getUsersWithFiltering()');
  console.log('- createNewUsers()');
  console.log('- updateExistingUsers()');
  console.log('- performBulkOperations()');
  console.log('- getUserStatistics()');
  console.log('- manageUserPasswords()');
  console.log('- importExportOperations()');
  console.log('- advancedFilteringExamples()');
  console.log('- safeUserDeletion()');
  console.log('- completeAdminWorkflow()');
  
  console.log('\nTo run these examples, call them individually in a connected environment.');
}