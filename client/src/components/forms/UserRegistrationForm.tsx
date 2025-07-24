import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { userSchemas } from '../../validation/schemas';
import { useValidation } from '../../validation/hooks';
import { handleApiValidationErrors, getErrorMessage } from '../../validation/utils';
import ValidatedInput from '../ui/ValidatedInput';
import Button from '../ui/Button';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

interface UserRegistrationFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  showOrganizationField?: boolean;
  defaultRole?: string;
}

interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationId?: string;
  role: string;
  customRole?: string;
  mobileNumber?: string;
  address?: string;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({
  onSuccess,
  onError,
  showOrganizationField = true,
  defaultRole = 'inspector'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useValidation(userSchemas.register);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue
  } = useForm<RegistrationFormData>({
    defaultValues: {
      role: defaultRole
    }
  });

  const watchedValues = watch();

  // Real-time validation
  React.useEffect(() => {
    if (Object.keys(watchedValues).length > 0) {
      validation.validate(watchedValues);
    }
  }, [watchedValues]);

  const onSubmit = async (data: RegistrationFormData) => {
    // Client-side validation
    const validationResult = validation.validate(data);
    if (!validationResult.success) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/register', data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error: any) {
      // Handle validation errors from server
      const hasValidationErrors = handleApiValidationErrors(error, (field: string, message: string) => {
        setError(field as keyof RegistrationFormData, { type: 'manual', message });
      });
      
      if (!hasValidationErrors) {
        const errorMessage = getErrorMessage(error);
        if (onError) {
          onError(errorMessage);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Name Field */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <User className="mt-6 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <ValidatedInput
            label="Full Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
            validationErrors={validation.errors.name ? [validation.errors.name] : []}
            showValidation={!!watchedValues.name && !validation.errors.name}
            required
          />
        </div>
      </div>

      {/* Email Field */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Mail className="mt-6 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <ValidatedInput
            label="Email Address"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
            validationErrors={validation.errors.email ? [validation.errors.email] : []}
            showValidation={!!watchedValues.email && !validation.errors.email}
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Lock className="mt-6 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 relative">
          <ValidatedInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
            validationErrors={validation.errors.password ? [validation.errors.password] : []}
            showValidation={!!watchedValues.password && !validation.errors.password}
            helpText="Must contain uppercase, lowercase, number, and special character"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-11 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Lock className="mt-6 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 relative">
          <ValidatedInput
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword', { required: 'Please confirm your password' })}
            error={errors.confirmPassword?.message}
            validationErrors={validation.errors.confirmPassword ? [validation.errors.confirmPassword] : []}
            showValidation={!!watchedValues.confirmPassword && !validation.errors.confirmPassword}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-11 text-gray-400 hover:text-gray-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          {...register('role', { required: 'Role is required' })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="inspector">Inspector</option>
          <option value="approver">Approver</option>
          <option value="admin">Admin</option>
          <option value="custom">Custom Role</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Custom Role Field (conditional) */}
      {watchedValues.role === 'custom' && (
        <ValidatedInput
          label="Custom Role Name"
          {...register('customRole', { required: 'Custom role name is required when role is custom' })}
          error={errors.customRole?.message}
          placeholder="Enter custom role name"
          required
        />
      )}

      {/* Optional Fields */}
      <details className="border rounded-lg p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
          Additional Information (Optional)
        </summary>
        <div className="space-y-4 mt-4">
          <ValidatedInput
            label="Mobile Number"
            type="tel"
            {...register('mobileNumber')}
            error={errors.mobileNumber?.message}
            placeholder="+1 (555) 123-4567"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>
        </div>
      </details>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        disabled={validation.hasErrors}
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>

      {/* Validation Summary */}
      {validation.hasErrors && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {Object.entries(validation.errors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!validation.hasErrors && Object.keys(watchedValues).length > 5 && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Form looks good! Ready to submit.
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default UserRegistrationForm;
