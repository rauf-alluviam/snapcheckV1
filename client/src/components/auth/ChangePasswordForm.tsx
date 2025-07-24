import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ValidationError from '../ui/ValidationError';
import { userSchemas } from '../../validation/schemas';
import { useValidation } from '../../validation/hooks';
import { handleApiValidationErrors, getErrorMessage } from '../../validation/utils';
import { getReactHookFormRules } from '../../validation/fieldValidation';

interface ChangePasswordFormInputs {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordForm: React.FC = () => {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<any>(null);
  
  // Use enhanced validation system
  const validation = useValidation(userSchemas.changePassword);
  
  const { 
    register, 
    handleSubmit,
    reset,
    watch,
    formState: { errors } 
  } = useForm<ChangePasswordFormInputs>();

  // Watch form values for real-time validation
  const formData = watch();
  const newPassword = watch('newPassword');

  // Real-time validation on form changes
  useEffect(() => {
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      validation.validate(formData);
    }
  }, [formData]);

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onSubmit = async (data: ChangePasswordFormInputs) => {
    // Clear previous validation errors
    setValidationError(null);
    
    // Validate before submission
    const validationResult = validation.validate(data);
    if (!validationResult.success) {
      setValidationError(validationResult);
      return;
    }

    setLoading(true);
    setSubmitMessage(null);
    
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      
      if (result.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: result.message || 'Your password has been changed successfully.' 
        });
        
        // Clear form
        reset();
      } else {
        setSubmitMessage({ 
          type: 'error', 
          text: result.error || 'Failed to change password.' 
        });
      }
    } catch (err: any) {
      console.error('Change password submission error:', err);
      
      // Handle validation errors from API
      const hasValidationErrors = handleApiValidationErrors(err, (field: string, message: string) => {
        validation.setFieldError(field, message);
      });
      
      if (!hasValidationErrors) {
        const errorMessage = getErrorMessage(err);
        setSubmitMessage({ 
          type: 'error', 
          text: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900">
        Change Password
      </h2>
      
      {/* Enhanced Validation Error Display */}
      {validationError && (
        <ValidationError error={validationError} />
      )}
      
      {submitMessage && (
        <div className={`p-3 ${submitMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md text-sm`}>
          {submitMessage.text}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Current Password Field */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Lock className="mt-5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 relative">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword', { 
                required: 'Current password is required'
              })}
              error={errors.currentPassword?.message || validation.errors.currentPassword}
              className="pr-12"
            />
            <button 
              type="button" 
              className="absolute right-3 top-8 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors p-2"
              onClick={toggleCurrentPasswordVisibility}
              tabIndex={-1}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* New Password Field */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Lock className="mt-5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 relative">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              {...register('newPassword', getReactHookFormRules('password'))}
              error={errors.newPassword?.message || validation.errors.newPassword}
              className="pr-12"
            />
            <button 
              type="button" 
              className="absolute right-3 top-8 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors p-2"
              onClick={toggleNewPasswordVisibility}
              tabIndex={-1}
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Confirm Password Field */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Lock className="mt-5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', { 
                required: 'Please confirm your new password',
                validate: (value) => 
                  value === newPassword || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message || validation.errors.confirmPassword}
              className="pr-12"
            />
            <button 
              type="button" 
              className="absolute right-3 top-8 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors p-2"
              onClick={toggleConfirmPasswordVisibility}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={loading}
        >
          Change Password
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
