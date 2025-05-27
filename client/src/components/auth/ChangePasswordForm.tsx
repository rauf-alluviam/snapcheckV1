import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
  
  const { 
    register, 
    handleSubmit,
    reset,
    watch,
    formState: { errors } 
  } = useForm<ChangePasswordFormInputs>();

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
    setLoading(true);
    
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
    } catch (err) {
      console.error('Change password submission error:', err);
      setSubmitMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900">
        Change Password
      </h2>
      
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
              error={errors.currentPassword?.message}
              className="pr-12" // Add padding for the toggle button
            />
            {/* Show/Hide Password Button */}
            <button 
              type="button" 
              className="absolute right-3 top-11 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              onClick={toggleCurrentPasswordVisibility}
              tabIndex={-1} // Prevent tab focus
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
              {...register('newPassword', { 
                required: 'New password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              error={errors.newPassword?.message}
              className="pr-12" // Add padding for the toggle button
            />
            {/* Show/Hide Password Button */}
            <button 
              type="button" 
              className="absolute right-3 top-11 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              onClick={toggleNewPasswordVisibility}
              tabIndex={-1} // Prevent tab focus
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Confirm New Password Field */}
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
                  value === watch('newPassword') || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
              className="pr-12" // Add padding for the toggle button
            />
            {/* Show/Hide Password Button */}
            <button 
              type="button" 
              className="absolute right-3 top-11 transform text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              onClick={toggleConfirmPasswordVisibility}
              tabIndex={-1} // Prevent tab focus
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
