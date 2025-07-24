import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { validateData } from './schemas';

// Define dateSchema locally for use in hooks
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

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface ValidationResult<T> {
  success: boolean;
  errors: ValidationError[];
  data: T | null;
}

interface UseValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface UseValidationReturn<T> {
  errors: Record<string, string>;
  hasErrors: boolean;
  validate: (data: unknown) => ValidationResult<T>;
  validateField: (fieldName: string, value: any) => string | null;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  setFieldError: (fieldName: string, message: string) => void;
  isValid: boolean;
}

export function useValidation<T>(
  schema: z.ZodSchema<T>,
  options: UseValidationOptions = {}
): UseValidationReturn<T> {
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: unknown): ValidationResult<T> => {
    const result = validateData(schema, data);
    
    if (!result.success) {
      const errorMap: Record<string, string> = {};
      result.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
    } else {
      setErrors({});
    }
    
    return result;
  }, [schema]);

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    try {
      // Extract the field schema from the main schema
      const fieldSchema = (schema as any).shape[fieldName];
      if (!fieldSchema) {
        return null;
      }

      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        const error = result.error.errors[0];
        const errorMessage = error?.message || 'Invalid value';
        
        // Update only this field's error
        setErrors(prev => ({
          ...prev,
          [fieldName]: errorMessage
        }));
        
        return errorMessage;
      } else {
        // Clear this field's error
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        
        return null;
      }
    } catch (error) {
      console.warn(`Failed to validate field ${fieldName}:`, error);
      return null;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((fieldName: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: message
    }));
  }, []);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const isValid = useMemo(() => !hasErrors, [hasErrors]);

  return {
    errors,
    hasErrors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
    isValid
  };
}

// Hook for form validation with react-hook-form integration
export function useFormValidation<T>(
  schema: z.ZodSchema<T>,
  options: UseValidationOptions = {}
) {
  const validation = useValidation(schema, options);

  // Create resolver function for react-hook-form
  const resolver = useCallback(async (data: any) => {
    const result = validation.validate(data);
    
    if (!result.success) {
      const fieldErrors: Record<string, { type: string; message: string }> = {};
      result.errors.forEach(error => {
        fieldErrors[error.field] = {
          type: 'validation',
          message: error.message
        };
      });
      
      return {
        values: {},
        errors: fieldErrors
      };
    }
    
    return {
      values: result.data,
      errors: {}
    };
  }, []);

  return {
    ...validation,
    resolver
  };
}

// Utility hooks for common validation patterns
export function useEmailValidation() {
  return useValidation(z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase()
  }));
}

export function usePasswordValidation() {
  return useValidation(z.object({
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
  }));
}

export function useDateRangeValidation() {
  return useValidation(z.object({
    startDate: dateSchema,
    endDate: dateSchema
  }).refine((data) => {
    const start = new Date(data.startDate as string);
    const end = new Date(data.endDate as string);
    return start <= end;
  }, {
    message: "Start date cannot be after end date",
    path: ["startDate"]
  }));
}

// Hook for async validation (for checking uniqueness, etc.)
export function useAsyncValidation<T>(
  schema: z.ZodSchema<T>,
  asyncValidators: Record<string, (value: any) => Promise<boolean>> = {}
) {
  const [isValidating, setIsValidating] = useState(false);
  const [asyncErrors, setAsyncErrors] = useState<Record<string, string>>({});
  
  const syncValidation = useValidation(schema);

  const validateAsync = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    
    // First run sync validation
    const syncResult = syncValidation.validate(data);
    if (!syncResult.success) {
      setIsValidating(false);
      return syncResult;
    }

    // Then run async validators
    const asyncErrorMap: Record<string, string> = {};
    for (const [field, validator] of Object.entries(asyncValidators)) {
      const value = (data as any)[field];
      if (value !== undefined) {
        try {
          const isValid = await validator(value);
          if (!isValid) {
            asyncErrorMap[field] = `${field} is already taken`;
          }
        } catch (error) {
          console.error(`Async validation failed for ${field}:`, error);
          asyncErrorMap[field] = `Validation failed for ${field}`;
        }
      }
    }

    setAsyncErrors(asyncErrorMap);
    setIsValidating(false);

    if (Object.keys(asyncErrorMap).length > 0) {
      return {
        success: false,
        errors: Object.entries(asyncErrorMap).map(([field, message]) => ({
          field,
          message,
          value: (data as any)[field]
        })),
        data: null
      };
    }

    return syncResult;
  }, [syncValidation, asyncValidators]);

  const clearAsyncErrors = useCallback(() => {
    setAsyncErrors({});
  }, []);

  return {
    ...syncValidation,
    validateAsync,
    isValidating,
    asyncErrors,
    clearAsyncErrors,
    allErrors: { ...syncValidation.errors, ...asyncErrors },
    hasAnyErrors: syncValidation.hasErrors || Object.keys(asyncErrors).length > 0
  };
}

// Helper function to create validation rules for react-hook-form register
export function createValidationRules<T>(
  schema: z.ZodSchema<T>,
  fieldName: string
) {
  return {
    validate: (value: any) => {
      try {
        const fieldSchema = (schema as any).shape[fieldName];
        if (!fieldSchema) {
          return true;
        }

        const result = fieldSchema.safeParse(value);
        return result.success || result.error.errors[0]?.message || 'Invalid value';
      } catch (error) {
        return true; // Allow if validation fails
      }
    }
  };
}
