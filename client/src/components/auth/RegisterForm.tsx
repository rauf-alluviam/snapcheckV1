import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Mail, Lock, User, Building } from 'lucide-react';

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationId: string;
  role: string;
}

const RegisterForm: React.FC = () => {
  const { register: registerUser, state } = useAuth();
  const { loading, error } = state;
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm<RegisterFormInputs>();
  
  const password = watch('password');

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      await registerUser(
        data.name,
        data.email,
        data.password,
        data.organizationId,
        data.role
      );
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  // Mock organizations for demo
  const organizations = [
    { value: '1', label: 'Acme Corp' },
    { value: '2', label: 'Globex Industries' },
    { value: '3', label: 'Initech' },
  ];

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'inspector', label: 'Inspector' },
    { value: 'approver', label: 'Approver' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          {...register('name', { 
            required: 'Name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters'
            }
          })}
          error={errors.name?.message}
          leftAddon={<User className="ml-3 h-5 w-5 text-gray-400" />}
        />
        
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
          leftAddon={<Mail className="ml-3 h-5 w-5 text-gray-400" />}
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
          error={errors.password?.message}
          leftAddon={<Lock className="ml-3 h-5 w-5 text-gray-400" />}
          rightAddon={
            <button 
              type="button" 
              className="mr-3 text-gray-400 hover:text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />
        
        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          {...register('confirmPassword', { 
            required: 'Please confirm your password',
            validate: value => value === password || 'Passwords do not match'
          })}
          error={errors.confirmPassword?.message}
          leftAddon={<Lock className="ml-3 h-5 w-5 text-gray-400" />}
        />
        
        <Select
          label="Organization"
          options={organizations}
          {...register('organizationId', { required: 'Organization is required' })}
          error={errors.organizationId?.message}
        />
        
        <Select
          label="Role"
          options={roleOptions}
          {...register('role', { required: 'Role is required' })}
          error={errors.role?.message}
        />
      </div>

      <Button 
        type="submit" 
        variant="primary" 
        fullWidth 
        size="lg"
        isLoading={loading}
      >
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;