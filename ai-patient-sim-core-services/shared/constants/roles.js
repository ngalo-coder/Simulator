// User roles used across all services
const ROLES = {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
  };
  
  const PERMISSIONS = {
    [ROLES.STUDENT]: [
      'view_cases',
      'start_simulation',
      'view_own_progress'
    ],
    [ROLES.INSTRUCTOR]: [
      'view_cases',
      'create_cases',
      'edit_cases',
      'view_student_progress',
      'assign_cases'
    ],
    [ROLES.ADMIN]: [
      'manage_users',
      'manage_institutions',
      'view_system_analytics',
      'manage_all_cases'
    ]
  };
  
  const hasPermission = (userRole, permission) => {
    return PERMISSIONS[userRole]?.includes(permission) || false;
  };
  
  module.exports = {
    ROLES,
    PERMISSIONS,
    hasPermission
  };