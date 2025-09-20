/**
 * API request and response validation utilities
 */

import { PatientCase, User } from '../types';

// Validation schemas using simple JSON Schema-like structure
export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: boolean;
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  format?: 'email' | 'date' | 'uri';
}

// Common validation schemas
export const schemas = {
  user: {
    type: 'object',
    required: true,
    properties: {
      id: { type: 'string', required: true },
      username: { type: 'string', required: true, minLength: 3, maxLength: 50 },
      email: { type: 'string', required: true, format: 'email' },
      primaryRole: { type: 'string', required: true, enum: ['student', 'educator', 'admin'] },
      discipline: { type: 'string', required: true, enum: ['medicine', 'nursing', 'laboratory', 'radiology', 'pharmacy'] },
      profile: {
        type: 'object',
        required: true,
        properties: {
          firstName: { type: 'string', required: true, minLength: 1, maxLength: 100 },
          lastName: { type: 'string', required: true, minLength: 1, maxLength: 100 },
          institution: { type: 'string', required: true, minLength: 1, maxLength: 200 }
        }
      },
      isActive: { type: 'boolean', required: true },
      emailVerified: { type: 'boolean', required: true },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' }
    }
  } as ValidationSchema,

  patientCase: {
    type: 'object',
    required: true,
    properties: {
      id: { type: 'string', required: true },
      version: { type: 'number', required: true, minimum: 1 },
      description: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
      case_metadata: {
        type: 'object',
        required: true,
        properties: {
          case_id: { type: 'string', required: true, minLength: 1, maxLength: 50 },
          title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
          specialty: { type: 'string', required: true, minLength: 1, maxLength: 100 },
          program_area: { type: 'string', required: true, enum: ['Basic Program', 'Specialty Program'] },
          difficulty: { type: 'string', required: true, enum: ['Easy', 'Intermediate', 'Hard'] },
          tags: { type: 'array', items: { type: 'string' } },
          location: { type: 'string', required: true, minLength: 1, maxLength: 100 }
        }
      },
      patient_persona: {
        type: 'object',
        required: true,
        properties: {
          name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
          age: { type: 'number', required: true, minimum: 0, maximum: 150 },
          gender: { type: 'string', required: true, minLength: 1, maxLength: 50 },
          chief_complaint: { type: 'string', required: true, minLength: 1, maxLength: 500 }
        }
      },
      initial_prompt: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
      status: { type: 'string', required: true, enum: ['draft', 'pending_review', 'approved', 'published', 'archived', 'rejected'] },
      createdBy: { type: 'string', required: true },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' }
    }
  } as ValidationSchema,

  apiResponse: {
    type: 'object',
    required: true,
    properties: {
      data: { type: 'object', required: true },
      message: { type: 'string' }
    }
  } as ValidationSchema,

  errorResponse: {
    type: 'object',
    required: true,
    properties: {
      message: { type: 'string', required: true },
      error: { type: 'boolean' },
      status: { type: 'number' },
      code: { type: 'string' }
    }
  } as ValidationSchema
};

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  value: any;
  expected: any;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Main validation function
export function validate(data: any, schema: ValidationSchema, fieldPath: string = ''): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check if required field is missing
  if (schema.required && (data === undefined || data === null)) {
    errors.push({
      field: fieldPath,
      message: 'Field is required',
      value: data,
      expected: 'non-null value'
    });
    return { isValid: false, errors, warnings };
  }

  // If data is null/undefined and not required, skip further validation
  if (data === undefined || data === null) {
    return { isValid: true, errors, warnings };
  }

  // Type validation
  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      errors.push({
        field: fieldPath,
        message: `Expected type ${schema.type}, got ${actualType}`,
        value: data,
        expected: schema.type
      });
    }
  }

  // String validations
  if (schema.type === 'string' && typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) {
      errors.push({
        field: fieldPath,
        message: `String length must be at least ${schema.minLength}`,
        value: data,
        expected: `length >= ${schema.minLength}`
      });
    }

    if (schema.maxLength && data.length > schema.maxLength) {
      errors.push({
        field: fieldPath,
        message: `String length must be at most ${schema.maxLength}`,
        value: data,
        expected: `length <= ${schema.maxLength}`
      });
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push({
        field: fieldPath,
        message: 'String does not match required pattern',
        value: data,
        expected: `pattern ${schema.pattern}`
      });
    }

    if (schema.format === 'email' && !isValidEmail(data)) {
      errors.push({
        field: fieldPath,
        message: 'Invalid email format',
        value: data,
        expected: 'valid email address'
      });
    }

    if (schema.format === 'date' && !isValidDate(data)) {
      errors.push({
        field: fieldPath,
        message: 'Invalid date format',
        value: data,
        expected: 'valid date'
      });
    }

    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        field: fieldPath,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value: data,
        expected: `one of [${schema.enum.join(', ')}]`
      });
    }
  }

  // Number validations
  if (schema.type === 'number' && typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        field: fieldPath,
        message: `Number must be at least ${schema.minimum}`,
        value: data,
        expected: `>= ${schema.minimum}`
      });
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        field: fieldPath,
        message: `Number must be at most ${schema.maximum}`,
        value: data,
        expected: `<= ${schema.maximum}`
      });
    }
  }

  // Object validations
  if (schema.type === 'object' && typeof data === 'object' && !Array.isArray(data)) {
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const result = validate(data[key], propSchema, fieldPath ? `${fieldPath}.${key}` : key);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }
  }

  // Array validations
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      data.forEach((item, index) => {
        const result = validate(item, schema.items!, fieldPath ? `${fieldPath}[${index}]` : `[${index}]`);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Utility validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(date: string): boolean {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

// API response validation
export function validateApiResponse<T>(response: any, schema: ValidationSchema): { isValid: boolean; data?: T; errors: ValidationError[] } {
  const result = validate(response, schema);

  if (result.isValid) {
    return {
      isValid: true,
      data: response as T,
      errors: []
    };
  }

  return {
    isValid: false,
    errors: result.errors
  };
}

// Request validation before sending to API
export function validateApiRequest(data: any, schema: ValidationSchema): { isValid: boolean; errors: ValidationError[] } {
  const result = validate(data, schema);
  return {
    isValid: result.isValid,
    errors: result.errors
  };
}

// Sanitize data to prevent XSS and other security issues
export function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
}

// Validate and sanitize API request data
export function validateAndSanitizeRequest<T>(data: any, schema: ValidationSchema): { isValid: boolean; data?: T; errors: ValidationError[] } {
  const validation = validate(data, schema);

  if (!validation.isValid) {
    return {
      isValid: false,
      errors: validation.errors
    };
  }

  const sanitizedData = sanitizeData(data) as T;

  return {
    isValid: true,
    data: sanitizedData,
    errors: []
  };
}

// Common validation helpers
export const validators = {
  isRequired: (value: any): boolean => value !== undefined && value !== null && value !== '',
  isEmail: (email: string): boolean => isValidEmail(email),
  isDate: (date: string): boolean => isValidDate(date),
  isInRange: (value: number, min: number, max: number): boolean => value >= min && value <= max,
  isLength: (str: string, min: number, max: number): boolean => str.length >= min && str.length <= max,
  isOneOf: <T>(value: T, options: T[]): boolean => options.includes(value)
};

// Export default validation function for easy use
export default function validateData(data: any, schema: ValidationSchema): ValidationResult {
  return validate(data, schema);
}