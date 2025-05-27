import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ForgotPasswordFormInputs {
  email: string;
}

const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ForgotPasswordFormInputs>();

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    setLoading(true);
    try {
      const result = await forgotPassword(data.email);
      
      if (result.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: result.message || 'If the email address is registered, you will receive password reset instructions.' 
        });
      } else {
        setSubmitMessage({ 
          type: 'error', 
          text: result.error || 'An error occurred. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Forgot password submission error:', err);
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
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Forgot Password
      </h2>
      <p className="text-gray-600 text-center">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      {submitMessage && (
        <div className={`p-3 ${submitMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md text-sm`}>
          {submitMessage.text}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Email Field with External Icon */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Mail className="mt-5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <Input
              label="Email Address"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />
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
        Send Reset Link
      </Button>
      
      <div className="text-center mt-4">
        <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Back to Login
        </Link>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
