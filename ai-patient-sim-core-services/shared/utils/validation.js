// Common validation functions used by all services
const validator = require('validator');

const ValidationUtils = {
  // Email validation
  isValidEmail(email) {
    return validator.isEmail(email);
  },

  // Password strength validation
  isStrongPassword(password) {
    return password && 
           password.length >= 6 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  },

  // Institution name validation
  isValidInstitution(name) {
    return name && 
           name.trim().length >= 2 && 
           name.trim().length <= 100;
  },

  // Sanitize user input
  sanitizeString(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
  },

  // Validate MongoDB ObjectId
  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Common error messages
  errors: {
    INVALID_EMAIL: 'Please provide a valid email address',
    WEAK_PASSWORD: 'Password must be at least 6 characters with uppercase, lowercase, and number',
    INVALID_ID: 'Invalid ID format',
    REQUIRED_FIELD: 'This field is required'
  }
};

module.exports = ValidationUtils;