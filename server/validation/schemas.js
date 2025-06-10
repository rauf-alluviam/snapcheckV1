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

// Common validation patterns
const commonValidations = {
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().trim().min(2).max(100).required(),
  phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  objectId: Joi.string().custom(objectIdValidator, 'ObjectId validation'),
  url: Joi.string().uri(),
  date: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().custom(dateValidator, 'Date validation')
  ),
  positiveNumber: Joi.number().positive(),
  nonNegativeNumber: Joi.number().min(0)
};

// User validation schemas
export const userValidation = {
  register: Joi.object({
    name: commonValidations.name,
    email: commonValidations.email,
    password: commonValidations.password,
    organizationId: commonValidations.objectId.required(),
    role: Joi.string().valid('admin', 'inspector', 'approver', 'custom').required(),
    customRole: Joi.string().when('role', {
      is: 'custom',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    mobileNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    address: Joi.string().max(500).optional()
  }),

  login: Joi.object({
    email: commonValidations.email,
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: commonValidations.name,
    email: commonValidations.email,
    mobileNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
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
    name: Joi.string().trim().min(2).max(200).required(),
    address: Joi.string().trim().min(5).max(500).required(),
    phone: commonValidations.phoneNumber,
    email: commonValidations.email,
    industry: Joi.string().max(100).optional(),
    size: Joi.string().valid('small', 'medium', 'large', 'enterprise').optional(),
    settings: Joi.object({
      allowUserInvites: Joi.boolean().optional(),
      requireApproverReview: Joi.boolean().optional()
    }).optional()
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    address: Joi.string().trim().min(5).max(500).required(),
    phone: commonValidations.phoneNumber,
    email: commonValidations.email
  }),

  addRole: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
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
