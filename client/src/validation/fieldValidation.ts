/**
 * Frontend Validation Utilities
 * 
 * Provides client-side validation with detailed error messages
 * that match the server-side validation requirements.
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationError {
  field: string;
  message: string;
  requirements: string;
  type: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  summary?: string;
  help?: string;
}

/**
 * Field validation rules that match server-side requirements
 */
export const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    requirements: 'Required. Must be 2-100 characters long.'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    requirements: 'Required. Must be a valid email format (user@example.com).'
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
    requirements: 'Required. Must be at least 6 characters long.'
  },
  phone: {
    required: true,
    pattern: /^[\+]?[\d\s\-\(\)]+$/,
    custom: (value: string) => {
      if (!value) return 'Phone number is required';
      const cleaned = value.replace(/[^\d+]/g, '');
      const digitsOnly = cleaned.replace(/^\+/, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return 'Phone number must be between 7 and 15 digits';
      }
      return null;
    },
    requirements: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567'
  },
  mobileNumber: {
    required: false,
    pattern: /^[\+]?[\d\s\-\(\)]+$/,
    custom: (value: string) => {
      if (!value) return null; // Optional field
      const cleaned = value.replace(/[^\d+]/g, '');
      const digitsOnly = cleaned.replace(/^\+/, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return 'Phone number must be between 7 and 15 digits';
      }
      return null;
    },
    requirements: 'Optional. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567'
  },
  address: {
    required: false,
    maxLength: 500,
    requirements: 'Optional. Maximum 500 characters.'
  },
  organizationId: {
    required: true,
    requirements: 'Required. Must select a valid organization.'
  },
  role: {
    required: true,
    pattern: /^(admin|inspector|approver|custom)$/,
    requirements: 'Required. Must be one of: admin, inspector, approver, custom'
  },
  customRole: {
    required: false, // Conditionally required based on role
    minLength: 2,
    maxLength: 50,
    requirements: 'Required when role is custom. Must be 2-50 characters long.'
  },
  orgName: {
    required: true,
    minLength: 2,
    maxLength: 200,
    requirements: 'Required. Must be 2-200 characters long.'
  },
  orgAddress: {
    required: true,
    minLength: 5,
    maxLength: 500,
    requirements: 'Required. Must be 5-500 characters long.'
  },
  orgPhone: {
    required: true,
    pattern: /^[\+]?[\d\s\-\(\)]+$/,
    custom: (value: string) => {
      if (!value) return 'Organization phone number is required';
      const cleaned = value.replace(/[^\d+]/g, '');
      const digitsOnly = cleaned.replace(/^\+/, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return 'Phone number must be between 7 and 15 digits';
      }
      return null;
    },
    requirements: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567'
  },
  orgEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    requirements: 'Required. Must be a valid email format (contact@company.com).'
  },
  orgSize: {
    required: false,
    pattern: /^(small|medium|large|enterprise)$/,
    requirements: 'Optional. Must be one of: small, medium, large, enterprise'
  },
  industry: {
    required: false,
    maxLength: 100,
    requirements: 'Optional. Maximum 100 characters.'
  }
};

/**
 * Validate a single field
 */
export function validateField(fieldName: string, value: any, additionalContext?: any): ValidationError | null {
  const rule = validationRules[fieldName as keyof typeof validationRules];
  if (!rule) return null;

  // Handle conditional requirements (e.g., customRole when role is 'custom')
  let isRequired = rule.required;
  if (fieldName === 'customRole' && additionalContext?.role === 'custom') {
    isRequired = true;
  }

  // Required validation
  if (isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      requirements: rule.requirements,
      type: 'required'
    };
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  const stringValue = String(value).trim();

  // Length validations
  if (rule.minLength && stringValue.length < rule.minLength) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.minLength} characters long`,
      requirements: rule.requirements,
      type: 'minLength'
    };
  }

  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${rule.maxLength} characters`,
      requirements: rule.requirements,
      type: 'maxLength'
    };
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    let message = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`;
    
    // Specific messages for common patterns
    if (fieldName.includes('email') || fieldName.includes('Email')) {
      message = 'Must be a valid email address (e.g., user@example.com)';
    } else if (fieldName.includes('phone') || fieldName.includes('Phone')) {
      message = 'Phone number format is invalid. Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567';
    } else if (fieldName === 'role') {
      message = 'Role must be one of: admin, inspector, approver, custom';
    } else if (fieldName === 'orgSize') {
      message = 'Organization size must be one of: small, medium, large, enterprise';
    }

    return {
      field: fieldName,
      message,
      requirements: rule.requirements,
      type: 'pattern'
    };
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(stringValue);
    if (customError) {
      return {
        field: fieldName,
        message: customError,
        requirements: rule.requirements,
        type: 'custom'
      };
    }
  }

  return null;
}

/**
 * Validate multiple fields
 */
export function validateForm(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each field that has rules
  Object.keys(data).forEach(fieldName => {
    const error = validateField(fieldName, data[fieldName], data);
    if (error) {
      errors.push(error);
    }
  });

  // Special validation for password confirmation
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match',
      requirements: 'Must match the password field',
      type: 'match'
    });
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    summary: isValid ? undefined : `${errors.length} validation error(s) found. Please check the requirements below.`,
    help: isValid ? undefined : 'Review the requirements for each field and ensure all required fields are provided with valid values.'
  };
}

/**
 * Get requirements for a specific field
 */
export function getFieldRequirements(fieldName: string): string {
  const rule = validationRules[fieldName as keyof typeof validationRules];
  return rule?.requirements || 'Please provide a valid value for this field.';
}

/**
 * React Hook Form validation rules generator
 */
export function getReactHookFormRules(fieldName: string, additionalContext?: any) {
  const rule = validationRules[fieldName as keyof typeof validationRules];
  if (!rule) return {};

  const rules: any = {};

  // Handle conditional requirements
  let isRequired = rule.required;
  if (fieldName === 'customRole' && additionalContext?.role === 'custom') {
    isRequired = true;
  }

  if (isRequired) {
    rules.required = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
  }

  if (rule.minLength) {
    rules.minLength = {
      value: rule.minLength,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.minLength} characters long`
    };
  }

  if (rule.maxLength) {
    rules.maxLength = {
      value: rule.maxLength,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${rule.maxLength} characters`
    };
  }

  if (rule.pattern) {
    let message = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`;
    
    if (fieldName.includes('email') || fieldName.includes('Email')) {
      message = 'Must be a valid email address (e.g., user@example.com)';
    } else if (fieldName.includes('phone') || fieldName.includes('Phone')) {
      message = 'Phone number format is invalid. Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567';
    }

    rules.pattern = {
      value: rule.pattern,
      message
    };
  }

  if (rule.custom) {
    rules.validate = (value: any) => rule.custom!(value) || true;
  }

  return rules;
}
