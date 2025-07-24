import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ValidationError from '../ui/ValidationError';
import { userSchemas } from '../../validation/schemas';
import { useValidation } from '../../validation/hooks';
import { handleApiValidationErrors, getErrorMessage } from '../../validation/utils';
import { getReactHookFormRules } from '../../validation/fieldValidation';

interface ResetPasswordFormInputs {
  password: string;
  confirmPassword: string;
}

const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<any>(null);
  
  // Use enhanced validation system
  const validation = useValidation(userSchemas.resetPassword);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<ResetPasswordFormInputs>();

  // Watch form values for real-time validation
  const formData = watch();
  const password = watch('password');

  // Real-time validation on form changes
  useEffect(() => {
    if (formData.password || formData.confirmPassword) {
      validation.validate(formData);
    }
  }, [formData]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    if (!token) {
      setSubmitMessage({ 
        type: 'error', 
        text: 'Invalid reset token.' 
      });
      return;
    }

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
      const result = await resetPassword(token, data.password);
      
      if (result.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: result.message || 'Your password has been reset successfully.' 
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setSubmitMessage({ 
          type: 'error', 
          text: result.error || 'Failed to reset password. The link may be invalid or expired.' 
        });
      }
    } catch (err: any) {
      console.error('Reset password submission error:', err);
      
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
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Reset Password
      </h2>
      <p className="text-gray-600 text-center">
        Enter your new password below.
      </p>
      
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
        {/* Password Field */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Lock className="mt-5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', getReactHookFormRules('password'))}
              error={errors.password?.message || validation.errors.password}
              className="pr-12" // Add padding for the toggle button
            />
            {/* Show/Hide Password Button */}
            <button 
              type="button" 
              className="absolute right-3 top-8 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors p-2"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
            >
              {showPassword ? (
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
                required: 'Please confirm your password',
                validate: (value) => 
                  value === password || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message || validation.errors.confirmPassword}
              className="pr-12" // Add padding for the toggle button
            />
            {/* Show/Hide Password Button */}
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

      <Button 
        type="submit" 
        variant="primary" 
        fullWidth 
        size="lg"
        isLoading={loading}
        disabled={loading}
      >
        Reset Password
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
