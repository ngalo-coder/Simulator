// Common user type definitions used across services
const UserRoles = {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
  };
  
  const UserStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  };
  
  const UserType = {
    roles: UserRoles,
    status: UserStatus,
    
    // Common user interface
    schema: {
      id: String,
      email: String,
      role: String,
      institution: String,
      profile: {
        firstName: String,
        lastName: String,
        specialization: String
      },
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }
  };
  
  module.exports = UserType;