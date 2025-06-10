import { z } from 'zod';

// Custom validators
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format');
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// Date validators that accept both date strings (YYYY-MM-DD) and datetime strings (ISO)
const dateSchema = z.string().refine((dateString) => {
  // Check for YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(dateString + 'T00:00:00');
    return !isNaN(date.getTime());
  }
  
  // Check for ISO datetime format
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
  
  return false;
}, 'Invalid date format. Expected YYYY-MM-DD or ISO datetime format');

const datetimeSchema = z.string().refine((dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}, 'Invalid datetime format');

// User validation schemas
export const userSchemas = {
  login: z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required')
  }),

  register: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    organizationId: objectIdSchema,
    role: z.enum(['admin', 'inspector', 'approver', 'custom']),
    customRole: z.string().optional(),
    mobileNumber: phoneSchema.optional(),
    address: z.string().max(500, 'Address cannot exceed 500 characters').optional()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }).refine((data) => {
    if (data.role === 'custom' && !data.customRole) {
      return false;
    }
    return true;
  }, {
    message: "Custom role name is required when role is 'custom'",
    path: ["customRole"]
  }),

  updateProfile: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    mobileNumber: phoneSchema.optional(),
    address: z.string().max(500, 'Address cannot exceed 500 characters').optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional()
  }).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"]
  }).refine((data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: "New passwords don't match",
    path: ["confirmPassword"]
  }).refine((data) => {
    if (data.newPassword) {
      return passwordSchema.safeParse(data.newPassword).success;
    }
    return true;
  }, {
    message: "New password doesn't meet requirements",
    path: ["newPassword"]
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase()
  }),

  resetPassword: z.object({
    password: passwordSchema,
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  createUser: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: passwordSchema,
    role: z.enum(['admin', 'inspector', 'approver', 'custom']),
    organizationId: objectIdSchema
  }),

  updateUser: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    role: z.enum(['admin', 'inspector', 'approver', 'custom']),
    password: z.string().min(6, 'Password must be at least 6 characters').optional()
  })
};

// Organization validation schemas
export const organizationSchemas = {
  create: z.object({
    name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(200, 'Name cannot exceed 200 characters'),
    address: z.string().trim().min(5, 'Address must be at least 5 characters').max(500, 'Address cannot exceed 500 characters'),
    phone: phoneSchema,
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    industry: z.string().max(100, 'Industry cannot exceed 100 characters').optional(),
    size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
    settings: z.object({
      allowUserInvites: z.boolean().optional(),
      requireApproverReview: z.boolean().optional()
    }).optional()
  }),

  update: z.object({
    name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(200, 'Name cannot exceed 200 characters'),
    address: z.string().trim().min(5, 'Address must be at least 5 characters').max(500, 'Address cannot exceed 500 characters'),
    phone: phoneSchema,
    email: z.string().email('Invalid email address').trim().toLowerCase()
  }),

  addRole: z.object({
    name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50, 'Role name cannot exceed 50 characters'),
    permissions: z.array(z.string()).min(1, 'At least one permission is required')
  })
};

// Workflow validation schemas
export const workflowSchemas = {
  create: z.object({
    name: z.string().trim().min(2, 'Workflow name must be at least 2 characters').max(200, 'Name cannot exceed 200 characters'),
    category: z.string().trim().min(2, 'Category must be at least 2 characters').max(100, 'Category cannot exceed 100 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
    steps: z.array(z.object({
      title: z.string().trim().min(2, 'Step title must be at least 2 characters').max(200, 'Title cannot exceed 200 characters'),
      instructions: z.string().trim().min(5, 'Instructions must be at least 5 characters').max(1000, 'Instructions cannot exceed 1000 characters'),
      mediaRequired: z.boolean().optional()
    })).min(1, 'At least one step is required'),
    isRoutineInspection: z.boolean().optional(),
    autoApprovalEnabled: z.boolean().optional(),
    autoApprovalRules: z.object({
      timeRangeStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      timeRangeEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      maxValue: z.number().optional(),
      minValue: z.number().optional(),
      valueField: z.string().optional(),
      requirePhoto: z.boolean().optional(),
      frequencyLimit: z.number().positive('Frequency limit must be positive').optional(),
      frequencyPeriod: z.enum(['hour', 'day', 'week']).optional()
    }).optional(),
    bulkApprovalEnabled: z.boolean().optional(),
    notificationFrequency: z.object({
      value: z.number().positive('Notification frequency value must be positive').optional(),
      unit: z.enum(['minute', 'hour', 'day']).optional()
    }).optional()
  }),

  update: z.object({
    name: z.string().trim().min(2, 'Workflow name must be at least 2 characters').max(200, 'Name cannot exceed 200 characters').optional(),
    category: z.string().trim().min(2, 'Category must be at least 2 characters').max(100, 'Category cannot exceed 100 characters').optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters').optional(),
    steps: z.array(z.object({
      title: z.string().trim().min(2, 'Step title must be at least 2 characters').max(200, 'Title cannot exceed 200 characters'),
      instructions: z.string().trim().min(5, 'Instructions must be at least 5 characters').max(1000, 'Instructions cannot exceed 1000 characters'),
      mediaRequired: z.boolean().optional()
    })).min(1, 'At least one step is required').optional(),
    isRoutineInspection: z.boolean().optional(),
    autoApprovalEnabled: z.boolean().optional(),
    autoApprovalRules: z.object({
      timeRangeStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      timeRangeEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      maxValue: z.number().optional(),
      minValue: z.number().optional(),
      valueField: z.string().optional(),
      requirePhoto: z.boolean().optional(),
      frequencyLimit: z.number().positive('Frequency limit must be positive').optional(),
      frequencyPeriod: z.enum(['hour', 'day', 'week']).optional()
    }).optional(),
    bulkApprovalEnabled: z.boolean().optional()
  })
};

// Inspection validation schemas
export const inspectionSchemas = {
  create: z.object({
    workflowId: objectIdSchema,
    approverId: objectIdSchema,
    approverIds: z.array(objectIdSchema).optional(),
    inspectionDate: dateSchema,
    filledSteps: z.array(z.object({
      stepId: objectIdSchema,
      stepTitle: z.string().min(1, 'Step title is required'),
      responseText: z.string().trim().min(1, 'Response is required'),
      mediaUrls: z.array(z.string().url('Invalid URL format')).optional(),
      timestamp: datetimeSchema.optional()
    })).min(1, 'At least one step response is required'),
    meterReading: z.number().min(0, 'Meter reading cannot be negative').optional(),
    readingDate: dateSchema.optional(),
    autoApprove: z.boolean().optional()
  }),
  update: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'auto-approved']).optional(),
    remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional(),
    meterReading: z.number().min(0, 'Meter reading cannot be negative').optional(),
    readingDate: dateSchema.optional()
  }),

  approve: z.object({
    remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional()
  }),
  reject: z.object({
    remarks: z.string().trim().min(1, 'Rejection remarks are required').max(1000, 'Remarks cannot exceed 1000 characters')
  })
};

// Report validation schemas
export const reportSchemas = {
  analytics: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
    category: z.string().optional(),
    inspector: objectIdSchema.optional(),
    format: z.enum(['pdf', 'csv', 'excel']).optional()
  }).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }, {
    message: "Start date cannot be after end date",
    path: ["startDate"]
  }),

  inspectionSummary: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
    status: z.enum(['pending', 'approved', 'rejected', 'auto-approved']).optional(),
    assignedTo: objectIdSchema.optional(),
    category: z.string().optional(),
    format: z.enum(['pdf', 'csv', 'excel']).optional()
  }).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }, {
    message: "Start date cannot be after end date",
    path: ["startDate"]
  }),

  inspectorPerformance: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
    inspectorId: objectIdSchema.optional(),
    format: z.enum(['pdf', 'csv', 'excel']).optional()
  }).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }, {
    message: "Start date cannot be after end date",
    path: ["startDate"]
  })
};

// Query filter validation schemas
export const querySchemas = {
  inspectionFilters: z.object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    category: z.string().optional(),
    inspectionType: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'auto-approved']).optional(),
    assignedTo: objectIdSchema.optional(),
    approverId: objectIdSchema.optional(),
    page: z.number().positive('Page must be positive').optional(),
    limit: z.number().positive('Limit must be positive').max(100, 'Limit cannot exceed 100').optional()
  }),

  userFilters: z.object({
    role: z.enum(['all', 'admin', 'inspector', 'approver', 'custom']).optional(),
    page: z.number().positive('Page must be positive').optional(),
    limit: z.number().positive('Limit must be positive').max(100, 'Limit cannot exceed 100').optional()
  }),

  workflowFilters: z.object({
    category: z.string().optional(),
    isRoutineInspection: z.boolean().optional(),
    page: z.number().positive('Page must be positive').optional(),
    limit: z.number().positive('Limit must be positive').max(100, 'Limit cannot exceed 100').optional()
  })
};

// Settings validation schemas
export const settingsSchemas = {
  profile: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional()
  }).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, {
    message: "Current password is required to change password",
    path: ["currentPassword"]
  }).refine((data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: "New passwords don't match",
    path: ["confirmPassword"]
  }),

  organization: z.object({
    name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(200, 'Name cannot exceed 200 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    address: z.string().trim().min(5, 'Address must be at least 5 characters').max(500, 'Address cannot exceed 500 characters'),
    phone: phoneSchema
  })
};

// Export all schemas
export const validationSchemas = {
  user: userSchemas,
  organization: organizationSchemas,
  workflow: workflowSchemas,
  inspection: inspectionSchemas,
  report: reportSchemas,
  query: querySchemas,
  settings: settingsSchemas
};

// Utility function to validate data and return errors in a consistent format
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      value: error.code === 'invalid_type' ? undefined : (data as any)[error.path[0]]
    }));
    
    return {
      success: false,
      errors,
      data: null
    };
  }
  
  return {
    success: true,
    errors: [],
    data: result.data
  };
};
