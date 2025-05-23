import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Mail, Lock } from 'lucide-react';

interface LoginFormInputs {
  email: string;
  password: string;
}

interface LocationState {
  from?: string;
}

const LoginForm: React.FC = () => {
  const { login, state: authState } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormInputs>();

  // Get the previous path from location state, if available
  const locationState = location.state as LocationState;
  const from = locationState?.from || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data.email, data.password);
      // Navigation will happen in useEffect when isAuthenticated becomes true
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">        <Input
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
          leftAddon={<div className="px-3 py-2 bg-gray-50 border-r border-gray-300 rounded-l-md"><Mail className="h-5 w-5 text-gray-400" /></div>}
        />
        
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
          error={errors.password?.message}          leftAddon={<div className="px-3 py-2 bg-gray-50 border-r border-gray-300 rounded-l-md"><Lock className="h-5 w-5 text-gray-400" /></div>}
          rightAddon={
            <div className="pr-3">
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-500 bg-transparent px-2 py-1 rounded transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input 
            id="remember-me" 
            name="remember-me" 
            type="checkbox" 
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
          </a>
        </div>
      </div>

      <Button 
        type="submit" 
        variant="primary" 
        fullWidth 
        size="lg"
        isLoading={loading}
      >
        Sign in
      </Button>
    </form>
  );
};

export default LoginForm;