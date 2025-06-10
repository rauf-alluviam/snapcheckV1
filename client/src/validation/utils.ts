import { AxiosError } from 'axios';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationError[];
  details?: string;
}

/**
 * Extract validation errors from API response
 */
export const extractValidationErrors = (error: AxiosError): ValidationError[] => {
  if (error.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors;
    }
  }
  return [];
};

/**
 * Convert validation errors to form field errors
 */
export const convertToFieldErrors = (validationErrors: ValidationError[]): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  validationErrors.forEach(error => {
    fieldErrors[error.field] = error.message;
  });
  
  return fieldErrors;
};

/**
 * Handle API validation errors and update form state
 */
export const handleApiValidationErrors = (
  error: AxiosError, 
  setFieldError: (field: string, message: string) => void
) => {
  const validationErrors = extractValidationErrors(error);
  
  validationErrors.forEach(validationError => {
    setFieldError(validationError.field, validationError.message);
  });
  
  return validationErrors.length > 0;
};

/**
 * Get a user-friendly error message from API error
 */
export const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    
    // If there are validation errors, show a general message
    if (data.errors && data.errors.length > 0) {
      return `Validation failed: ${data.errors.length} error(s) found`;
    }
    
    // Return the specific error message
    return data.message || 'An error occurred';
  }
  
  // Network or other errors
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.';
  }
  
  return error.message || 'An unexpected error occurred';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common passwords
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  return errors;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate: string, endDate: string): string[] => {
  const errors: string[] = [];
  
  if (!startDate || !endDate) {
    errors.push('Both start date and end date are required');
    return errors;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push('Invalid date format');
    return errors;
  }
  
  if (start > end) {
    errors.push('Start date cannot be after end date');
  }
  
  // Check if date range is reasonable (not more than 1 year)
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYear) {
    errors.push('Date range cannot exceed one year');
  }
  
  return errors;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File): string[] => {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'application/pdf'
  ];
  
  if (file.size > maxSize) {
    errors.push(`File "${file.name}" exceeds maximum size of 10MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File "${file.name}" has unsupported file type: ${file.type}`);
  }
  
  return errors;
};

/**
 * Debounce function for real-time validation
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
