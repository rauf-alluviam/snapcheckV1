/**
 * Frontend Field Validation Utilities
 * 
 * Provides validation rules and helper functions for React Hook Form
 * and client-side validation.
 */

/**
 * Get React Hook Form validation rules for specific fields
 */
export function getReactHookFormRules(field) {
  const rules = {
    name: {
      required: 'Name is required',
      minLength: {
        value: 2,
        message: 'Name must be at least 2 characters long'
      },
      maxLength: {
        value: 100,
        message: 'Name must not exceed 100 characters'
      }
    },
    email: {
      required: 'Email address is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Must be a valid email address (e.g., user@example.com)'
      }
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters long'
      },
      maxLength: {
        value: 128,
        message: 'Password must not exceed 128 characters'
      }
    },
    confirmPassword: {
      required: 'Please confirm your password',
      validate: (value, { password }) => {
        return value === password || 'Passwords do not match';
      }
    },
    phone: {
      required: 'Phone number is required',
      pattern: {
        value: /^[\+]?[\d\s\(\)\-\.]{7,20}$/,
        message: 'Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567'
      }
    },
    mobileNumber: {
      pattern: {
        value: /^[\+]?[\d\s\(\)\-\.]{7,20}$/,
        message: 'Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567'
      }
    },
    address: {
      maxLength: {
        value: 500,
        message: 'Address must not exceed 500 characters'
      }
    },
    organizationId: {
      required: 'Organization selection is required'
    },
    role: {
      required: 'Role selection is required'
    },
    customRole: {
      required: 'Custom role name is required when role is set to custom',
      minLength: {
        value: 2,
        message: 'Custom role name must be at least 2 characters long'
      },
      maxLength: {
        value: 50,
        message: 'Custom role name must not exceed 50 characters'
      }
    },
    orgName: {
      required: 'Organization name is required',
      minLength: {
        value: 2,
        message: 'Organization name must be at least 2 characters long'
      },
      maxLength: {
        value: 200,
        message: 'Organization name must not exceed 200 characters'
      }
    },
    orgAddress: {
      required: 'Organization address is required',
      minLength: {
        value: 5,
        message: 'Address must be at least 5 characters long'
      },
      maxLength: {
        value: 500,
        message: 'Address must not exceed 500 characters'
      }
    },
    orgPhone: {
      required: 'Organization phone number is required',
      pattern: {
        value: /^[\+]?[\d\s\(\)\-\.]{7,20}$/,
        message: 'Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567'
      }
    },
    orgEmail: {
      required: 'Organization email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Must be a valid email address (e.g., contact@company.com)'
      }
    },
    industry: {
      maxLength: {
        value: 100,
        message: 'Industry must not exceed 100 characters'
      }
    },
    size: {
      // No specific validation needed for select field
    }
  };

  return rules[field] || {};
}

/**
 * Validate entire form data (client-side validation)
 */
export function validateForm(data) {
  const errors = [];

  // Basic field validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be at least 2 characters long',
      requirements: 'Required. Must be 2-100 characters long.'
    });
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Email address is required and must be valid',
      requirements: 'Required. Must be a valid email format (user@example.com).'
    });
  }

  if (!data.password || data.password.length < 6) {
    errors.push({
      field: 'password',
      message: 'Password is required and must be at least 6 characters long',
      requirements: 'Required. Must be at least 6 characters long.'
    });
  }

  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match',
      requirements: 'Must match the password field.'
    });
  }

  // Organization-specific validation
  if (data.createNewOrg) {
    if (!data.orgName || data.orgName.trim().length < 2) {
      errors.push({
        field: 'orgName',
        message: 'Organization name is required and must be at least 2 characters long',
        requirements: 'Required. Must be 2-200 characters long.'
      });
    }

    if (!data.orgAddress || data.orgAddress.trim().length < 5) {
      errors.push({
        field: 'orgAddress',
        message: 'Organization address is required and must be at least 5 characters long',
        requirements: 'Required. Must be 5-500 characters long.'
      });
    }

    if (!data.orgPhone || !isValidPhone(data.orgPhone)) {
      errors.push({
        field: 'orgPhone',
        message: 'Organization phone number is required and must be valid',
        requirements: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567'
      });
    }

    if (!data.orgEmail || !isValidEmail(data.orgEmail)) {
      errors.push({
        field: 'orgEmail',
        message: 'Organization email is required and must be valid',
        requirements: 'Required. Must be a valid email format (contact@company.com).'
      });
    }
  } else {
    if (!data.organizationId) {
      errors.push({
        field: 'organizationId',
        message: 'Organization selection is required',
        requirements: 'Required. Must select a valid organization.'
      });
    }
  }

  if (!data.role) {
    errors.push({
      field: 'role',
      message: 'Role selection is required',
      requirements: 'Required. Must be one of: admin, inspector, approver, custom'
    });
  }

  if (data.role === 'custom' && (!data.customRole || data.customRole.trim().length < 2)) {
    errors.push({
      field: 'customRole',
      message: 'Custom role name is required when role is set to custom',
      requirements: 'Required when role is custom. Must be 2-50 characters long.'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? 'Validation failed' : undefined,
    summary: errors.length > 0 ? `${errors.length} validation error(s) found. Please check the requirements below.` : undefined,
    help: errors.length > 0 ? 'Review the requirements for each field and ensure all required fields are provided with valid values.' : undefined
  };
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

/**
 * Phone validation helper
 */
function isValidPhone(phone) {
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it starts with + (international format)
  const hasCountryCode = cleaned.startsWith('+');
  
  // Remove + for further validation
  const digitsOnly = cleaned.replace(/^\+/, '');
  
  // Validate length: 7-15 digits
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }
  
  // If no country code, should not start with 0 for US numbers
  if (!hasCountryCode && digitsOnly.startsWith('0')) {
    return false;
  }
  
  return true;
}

/**
 * Get field requirements for display
 */
export function getFieldRequirements(field) {
  const requirements = {
    name: 'Required. Must be 2-100 characters long.',
    email: 'Required. Must be a valid email format (user@example.com).',
    password: 'Required. Must be at least 6 characters long.',
    confirmPassword: 'Required. Must match the password field.',
    phone: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567',
    mobileNumber: 'Optional. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567',
    address: 'Optional. Maximum 500 characters.',
    organizationId: 'Required. Must select a valid organization.',
    role: 'Required. Must be one of: admin, inspector, approver, custom',
    customRole: 'Required when role is custom. Must be 2-50 characters long.',
    orgName: 'Required. Must be 2-200 characters long.',
    orgAddress: 'Required. Must be 5-500 characters long.',
    orgPhone: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567',
    orgEmail: 'Required. Must be a valid email format (contact@company.com).',
    industry: 'Optional. Describe your organization\'s industry.',
    size: 'Optional. Must be one of: small, medium, large, enterprise'
  };
  
  return requirements[field] || 'Please provide a valid value for this field.';
}
