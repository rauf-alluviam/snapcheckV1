import { validationSchemas } from './schemas.js';

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Get all validation errors
      stripUnknown: true, // Remove unknown fields
      allowUnknown: false // Don't allow unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors,
        details: `${errors.length} validation error(s) found`
      });
    }

    // Replace original data with validated and cleaned data
    req[source] = value;
    next();
  };
};

// Specific validation middleware for common use cases
export const validateUser = {
  register: validate(validationSchemas.user.register),
  createUser: validate(validationSchemas.user.register), // Admin creating a user uses same validation as register
  login: validate(validationSchemas.user.login),
  updateProfile: validate(validationSchemas.user.updateProfile),
  updateUser: validate(validationSchemas.user.updateUser),
  changePassword: validate(validationSchemas.user.changePassword),
  forgotPassword: validate(validationSchemas.user.forgotPassword),
  resetPassword: validate(validationSchemas.user.resetPassword)
};

export const validateOrganization = {
  create: validate(validationSchemas.organization.create),
  update: validate(validationSchemas.organization.update),
  addRole: validate(validationSchemas.organization.addRole)
};

export const validateWorkflow = {
  create: validate(validationSchemas.workflow.create),
  update: validate(validationSchemas.workflow.update)
};

export const validateInspection = {
  create: validate(validationSchemas.inspection.create),
  update: validate(validationSchemas.inspection.update),
  approve: validate(validationSchemas.inspection.approve),
  reject: validate(validationSchemas.inspection.reject)
};

export const validateReport = {
  analytics: validate(validationSchemas.report.analytics),
  inspectionSummary: validate(validationSchemas.report.inspectionSummary),
  inspectorPerformance: validate(validationSchemas.report.inspectorPerformance)
};

export const validateQuery = {
  inspectionFilters: validate(validationSchemas.query.inspectionFilters, 'query'),
  userFilters: validate(validationSchemas.query.userFilters, 'query'),
  workflowFilters: validate(validationSchemas.query.workflowFilters, 'query')
};

export const validateMedia = {
  upload: validate(validationSchemas.media.upload)
};

// Validation middleware for ObjectId parameters
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{
          field: paramName,
          message: `${paramName} parameter is required`
        }]
      });
    }

    const { error } = validationSchemas.user.register.extract(['organizationId']).validate(id);
    
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{
          field: paramName,
          message: `Invalid ${paramName} format`
        }]
      });
    }

    next();
  };
};

// Date range validation middleware
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.body.startDate ? req.body : req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{
          field: 'dateRange',
          message: 'Start date cannot be after end date'
        }]
      });
    }

    // Check if date range is reasonable (not more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000; // milliseconds in a year
    if (end - start > oneYear) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{
          field: 'dateRange',
          message: 'Date range cannot exceed one year'
        }]
      });
    }
  }
  
  next();
};

// File upload validation middleware
export const validateFileUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{
        field: 'files',
        message: 'At least one file is required'
      }]
    });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'application/pdf'
  ];

  const errors = [];

  req.files.forEach((file, index) => {
    if (file.size > maxSize) {
      errors.push({
        field: `files[${index}]`,
        message: `File "${file.originalname}" exceeds maximum size of 10MB`
      });
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push({
        field: `files[${index}]`,
        message: `File "${file.originalname}" has unsupported file type: ${file.mimetype}`
      });
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'File validation failed',
      errors
    });
  }

  next();
};

// Password strength validation
export const validatePasswordStrength = (req, res, next) => {
  const password = req.body.password || req.body.newPassword;
  
  if (!password) {
    return next(); // Let other validation handle required field
  }

  const errors = [];
  
  // Check minimum length
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Password validation failed',
      errors: errors.map(error => ({
        field: 'password',
        message: error
      }))
    });  }

  next();
};
