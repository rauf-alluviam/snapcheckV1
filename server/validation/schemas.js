import Joi from 'joi';
import mongoose from 'mongoose';

// Custom validators
const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Custom date validator that accepts both YYYY-MM-DD and ISO datetime formats
const dateValidator = (value, helpers) => {
  // Check if it's a YYYY-MM-DD format
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(value + 'T00:00:00.000Z');
    if (!isNaN(date.getTime())) {
      return value;
    }
  }
  
  // Check if it's an ISO datetime format
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return value;
  }
  
  return helpers.error('any.invalid');
};

// Custom phone number validator that accepts common formats
const phoneValidator = (value, helpers) => {
  // Remove all non-digit characters except + at the beginning
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // Check if it starts with + (international format)
  const hasCountryCode = cleaned.startsWith('+');
  
  // Remove + for further validation
  const digitsOnly = cleaned.replace(/^\+/, '');
  
  // Validate length: 7-15 digits (E.164 standard allows 1-15 digits after country code)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return helpers.error('phone.length');
  }
  
  // If no country code, should not start with 0 for US numbers
  // But allow it for international numbers with country codes
  if (!hasCountryCode && digitsOnly.startsWith('0')) {
    return helpers.error('phone.format');
  }
  
  // Return cleaned version for storage
  return hasCountryCode ? '+' + digitsOnly : digitsOnly;
};

// Common validation patterns
const commonValidations = {
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Must be a valid email address (e.g., user@example.com)',
    'any.required': 'Email address is required',
    'string.empty': 'Email address cannot be empty'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty'
  }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
    'string.empty': 'Name cannot be empty'
  }),
  phoneNumber: Joi.string().custom(phoneValidator, 'Phone number validation').required().messages({
    'phone.length': 'Phone number must be between 7 and 15 digits',
    'phone.format': 'Phone number format is invalid. Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567',
    'any.required': 'Phone number is required',
    'string.empty': 'Phone number cannot be empty'
  }),
  phoneNumberOptional: Joi.string().custom(phoneValidator, 'Phone number validation').optional().messages({
    'phone.length': 'Phone number must be between 7 and 15 digits',
    'phone.format': 'Phone number format is invalid. Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567'
  }),
  objectId: Joi.string().custom(objectIdValidator, 'ObjectId validation').messages({
    'any.invalid': 'Must be a valid ID',
    'string.empty': 'ID cannot be empty'
  }),
  url: Joi.string().uri().messages({
    'string.uri': 'Must be a valid URL (e.g., https://example.com)'
  }),
  date: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().custom(dateValidator, 'Date validation')
  ).messages({
    'any.invalid': 'Must be a valid date in YYYY-MM-DD format or ISO datetime format',
    'date.base': 'Must be a valid date'
  }),
  positiveNumber: Joi.number().positive().messages({
    'number.positive': 'Must be a positive number',
    'number.base': 'Must be a valid number'
  }),
  nonNegativeNumber: Joi.number().min(0).messages({
    'number.min': 'Must be zero or greater',
    'number.base': 'Must be a valid number'
  })
};

// User validation schemas
export const userValidation = {
  register: Joi.object({
    name: commonValidations.name,
    email: commonValidations.email,
    password: commonValidations.password,
    organizationId: commonValidations.objectId.required().messages({
      'any.required': 'Organization selection is required',
      'any.invalid': 'Must select a valid organization'
    }),
    role: Joi.string().valid('admin', 'inspector', 'approver', 'custom').required().messages({
      'any.only': 'Role must be one of: admin, inspector, approver, or custom',
      'any.required': 'Role selection is required'
    }),
    customRole: Joi.string().when('role', {
      is: 'custom',
      then: Joi.string().required().messages({
        'any.required': 'Custom role name is required when role is set to custom',
        'string.empty': 'Custom role name cannot be empty'
      }),
      otherwise: Joi.string().optional()
    }).messages({
      'any.required': 'Custom role name is required when role is set to custom'
    }),
    mobileNumber: commonValidations.phoneNumberOptional,
    address: Joi.string().max(500).optional()
  }),

  login: Joi.object({
    email: commonValidations.email,
    password: Joi.string().required()
  }),
  updateProfile: Joi.object({
    name: commonValidations.name,
    email: commonValidations.email,
    mobileNumber: commonValidations.phoneNumberOptional,
    address: Joi.string().max(500).optional(),
    currentPassword: Joi.string().when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    newPassword: Joi.string().min(6).max(128).optional()
  }),

  updateUser: Joi.object({
    name: commonValidations.name,
    email: commonValidations.email,
    role: Joi.string().valid('admin', 'inspector', 'approver', 'custom').required(),
    password: Joi.string().min(6).max(128).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonValidations.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  }),

  forgotPassword: Joi.object({
    email: commonValidations.email
  }),

  resetPassword: Joi.object({
    password: commonValidations.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  })
};

// Organization validation schemas
export const organizationValidation = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(200).required().messages({
      'string.min': 'Organization name must be at least 2 characters long',
      'string.max': 'Organization name must not exceed 200 characters',
      'any.required': 'Organization name is required',
      'string.empty': 'Organization name cannot be empty'
    }),
    address: Joi.string().trim().min(5).max(500).required().messages({
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address must not exceed 500 characters',
      'any.required': 'Organization address is required',
      'string.empty': 'Organization address cannot be empty'
    }),
    phone: commonValidations.phoneNumber,
    email: commonValidations.email,
    industry: Joi.string().max(100).optional().messages({
      'string.max': 'Industry must not exceed 100 characters'
    }),
    size: Joi.string().valid('small', 'medium', 'large', 'enterprise').optional().messages({
      'any.only': 'Organization size must be one of: small, medium, large, enterprise'
    }),
    settings: Joi.object({
      allowUserInvites: Joi.boolean().optional(),
      requireApproverReview: Joi.boolean().optional()
    }).optional()
  }).messages({
    'object.base': 'Organization data must be a valid object'
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(200).required().messages({
      'string.min': 'Organization name must be at least 2 characters long',
      'string.max': 'Organization name must not exceed 200 characters',
      'any.required': 'Organization name is required',
      'string.empty': 'Organization name cannot be empty'
    }),
    address: Joi.string().trim().min(5).max(500).required().messages({
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address must not exceed 500 characters',
      'any.required': 'Organization address is required',
      'string.empty': 'Organization address cannot be empty'
    }),
    phone: commonValidations.phoneNumber,
    email: commonValidations.email
  }),

  addRole: Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
      'string.min': 'Role name must be at least 2 characters long',
      'string.max': 'Role name must not exceed 50 characters',
      'any.required': 'Role name is required',
      'string.empty': 'Role name cannot be empty'
    }),
    permissions: Joi.array().items(Joi.string()).min(1).required()
  })
};

// Workflow validation schemas
export const workflowValidation = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    category: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().min(10).max(1000).required(),
    steps: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().min(2).max(200).required(),
        instructions: Joi.string().trim().min(5).max(1000).required(),
        mediaRequired: Joi.boolean().optional()
      })
    ).min(1).required(),
    isRoutineInspection: Joi.boolean().optional(),
    autoApprovalEnabled: Joi.boolean().optional(),
    autoApprovalRules: Joi.object({
      timeRangeStart: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timeRangeEnd: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      maxValue: Joi.number().optional(),
      minValue: Joi.number().optional(),
      valueField: Joi.string().optional(),
      requirePhoto: Joi.boolean().optional(),
      frequencyLimit: Joi.number().positive().optional(),
      frequencyPeriod: Joi.string().valid('hour', 'day', 'week').optional()
    }).optional(),
    bulkApprovalEnabled: Joi.boolean().optional(),
    notificationFrequency: Joi.object({
      value: Joi.number().positive().optional(),
      unit: Joi.string().valid('minute', 'hour', 'day').optional()
    }).optional()
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(200).optional(),
    category: Joi.string().trim().min(2).max(100).optional(),
    description: Joi.string().trim().min(10).max(1000).optional(),
    steps: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().min(2).max(200).required(),
        instructions: Joi.string().trim().min(5).max(1000).required(),
        mediaRequired: Joi.boolean().optional()
      })
    ).min(1).optional(),
    isRoutineInspection: Joi.boolean().optional(),
    autoApprovalEnabled: Joi.boolean().optional(),
    autoApprovalRules: Joi.object({
      timeRangeStart: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timeRangeEnd: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      maxValue: Joi.number().optional(),
      minValue: Joi.number().optional(),
      valueField: Joi.string().optional(),
      requirePhoto: Joi.boolean().optional(),
      frequencyLimit: Joi.number().positive().optional(),
      frequencyPeriod: Joi.string().valid('hour', 'day', 'week').optional()
    }).optional(),
    bulkApprovalEnabled: Joi.boolean().optional()
  })
};

// Inspection validation schemas
export const inspectionValidation = {
  create: Joi.object({
    workflowId: commonValidations.objectId.required(),
    approverId: commonValidations.objectId.required(),
    approverIds: Joi.array().items(commonValidations.objectId).optional(),
    inspectionDate: commonValidations.date.required(),
    filledSteps: Joi.array().items(
      Joi.object({
        stepId: commonValidations.objectId.required(),
        stepTitle: Joi.string().required(),
        responseText: Joi.string().trim().required(),
        mediaUrls: Joi.array().items(commonValidations.url).optional(),
        timestamp: commonValidations.date.optional()
      })
    ).min(1).required(),
    meterReading: commonValidations.nonNegativeNumber.optional(),
    readingDate: commonValidations.date.optional(),
    autoApprove: Joi.boolean().optional()
  }),
  update: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected', 'auto-approved').optional(),
    remarks: Joi.string().max(1000).optional(),
    meterReading: commonValidations.nonNegativeNumber.optional(),
    readingDate: commonValidations.date.optional()
  }),

  approve: Joi.object({
    remarks: Joi.string().max(1000).optional()
  }),
  reject: Joi.object({
    remarks: Joi.string().trim().min(1).max(1000).required()
  })
};

// Report validation schemas
export const reportValidation = {
  analytics: Joi.object({
    startDate: commonValidations.date.required(),
    endDate: commonValidations.date.required(),
    category: Joi.string().optional(),
    inspector: commonValidations.objectId.optional(),
    format: Joi.string().valid('pdf', 'csv', 'excel').optional()
  }),

  inspectionSummary: Joi.object({
    startDate: commonValidations.date.required(),
    endDate: commonValidations.date.required(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'auto-approved').optional(),
    assignedTo: commonValidations.objectId.optional(),
    category: Joi.string().optional(),
    format: Joi.string().valid('pdf', 'csv', 'excel').optional()
  }),

  inspectorPerformance: Joi.object({
    startDate: commonValidations.date.required(),
    endDate: commonValidations.date.required(),
    inspectorId: commonValidations.objectId.optional(),
    format: Joi.string().valid('pdf', 'csv', 'excel').optional()
  })
};

// Query parameter validation schemas
export const queryValidation = {
  inspectionFilters: Joi.object({
    startDate: commonValidations.date.optional(),
    endDate: commonValidations.date.optional(),    category: Joi.string().optional(),
    inspectionType: Joi.string().optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'auto-approved').optional(),
    assignedTo: commonValidations.objectId.optional(),
    approverId: commonValidations.objectId.optional(),
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional()
  }),

  userFilters: Joi.object({
    role: Joi.string().valid('all', 'admin', 'inspector', 'approver', 'custom').optional(),
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional()
  }),

  workflowFilters: Joi.object({
    category: Joi.string().optional(),
    isRoutineInspection: Joi.boolean().optional(),
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional()
  })
};

// Media upload validation
export const mediaValidation = {
  upload: Joi.object({
    files: Joi.array().items(
      Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        mimetype: Joi.string().valid(
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'application/pdf'
        ).required(),
        size: Joi.number().max(10 * 1024 * 1024).required() // 10MB max
      })
    ).max(5).required()
  })
};

// Export all validations
export const validationSchemas = {
  user: userValidation,
  organization: organizationValidation,
  workflow: workflowValidation,
  inspection: inspectionValidation,
  report: reportValidation,
  query: queryValidation,
  media: mediaValidation
};
