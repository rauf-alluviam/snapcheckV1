import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Mail, Lock, User, Building, Phone, Globe } from 'lucide-react';
import api from '../../utils/api';

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationId: string;
  role: string;
  // Organization fields
  createNewOrg: boolean;
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  orgIndustry: string;
  orgSize: string;
}

const RegisterForm: React.FC = () => {
  const { register: registerUser, state } = useAuth();
  const { loading, error } = state;
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ value: string; label: string; }>>([]);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm<RegisterFormInputs>();
  
  const password = watch('password');  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      let organizationId = data.organizationId;

      // If creating a new organization
      if (data.createNewOrg) {
        const orgResponse = await api.post('${process.env.VITE_APP_API_STRING}/organizations/register', {
          name: data.orgName,
          address: data.orgAddress,
          phone: data.orgPhone,
          email: data.orgEmail,
          industry: data.orgIndustry,
          size: data.orgSize,
          settings: {
            allowUserInvites: true,
            requireApproverReview: true
          }
        });
        organizationId = orgResponse.data._id;
      }

      // Handle custom roles
      let role = data.role;
      let customRole;
      
      if (data.role.startsWith('custom:')) {
        role = 'custom';
        customRole = data.role.split(':')[1];
      }

      // Register user with organization
      await registerUser(
        data.name,
        data.email,
        data.password,
        organizationId,
        role,
        customRole
      );
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };
  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await api.get('/api/organizations');
        setOrganizations(response.data.map((org: any) => ({
          value: org._id,
          label: org.name
        })));
      } catch (error) {
        console.error('Failed to load organizations:', error);
      }
    };

    loadOrganizations();
  }, []);
  // Load custom roles for selected organization
  const [roleOptions, setRoleOptions] = useState([
    { value: 'admin', label: 'Administrator' },
    { value: 'inspector', label: 'Inspector' },
    { value: 'approver', label: 'Approver' }
  ]);

  // Update role options when organization changes
  useEffect(() => {
    const loadCustomRoles = async () => {
      const selectedOrgId = watch('organizationId');
      if (selectedOrgId && !watch('createNewOrg')) {
        try {
          const response = await api.get(`/api/organizations/${selectedOrgId}`);
          const customRoles = response.data.customRoles?.map((role: any) => ({
            value: `custom:${role.name}`,
            label: role.name
          })) || [];
          
          setRoleOptions([
            { value: 'admin', label: 'Administrator' },
            { value: 'inspector', label: 'Inspector' },
            { value: 'approver', label: 'Approver' },
            ...customRoles
          ]);
        } catch (error) {
          console.error('Failed to load custom roles:', error);
        }
      }
    };

    loadCustomRoles();
  }, [watch('organizationId'), watch('createNewOrg')]);

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
          <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="createNewOrg"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('createNewOrg')}
            />
            <label htmlFor="createNewOrg" className="text-sm text-gray-700">
              Create a new organization
            </label>
          </div>

          {watch('createNewOrg') ? (
            <>
              <Input
                label="Organization Name"
                type="text"
                {...register('orgName', { 
                  required: 'Organization name is required'
                })}
                error={errors.orgName?.message}
                leftAddon={<Building className="ml-3 h-5 w-5 text-gray-400" />}
              />
              
              <Input
                label="Organization Address"
                type="text"
                {...register('orgAddress', { 
                  required: 'Organization address is required'
                })}
                error={errors.orgAddress?.message}
                leftAddon={<Building className="ml-3 h-5 w-5 text-gray-400" />}
              />
              
              <Input
                label="Organization Phone"
                type="tel"
                {...register('orgPhone', { 
                  required: 'Organization phone is required'
                })}
                error={errors.orgPhone?.message}
                leftAddon={<Phone className="ml-3 h-5 w-5 text-gray-400" />}
              />
              
              <Input
                label="Organization Email"
                type="email"
                {...register('orgEmail', { 
                  required: 'Organization email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.orgEmail?.message}
                leftAddon={<Mail className="ml-3 h-5 w-5 text-gray-400" />}
              />
              
              <Input
                label="Industry"
                type="text"
                {...register('orgIndustry')}
                error={errors.orgIndustry?.message}
                leftAddon={<Globe className="ml-3 h-5 w-5 text-gray-400" />}
              />
              
              <Select
                label="Organization Size"
                options={[
                  { value: 'small', label: 'Small (1-50 employees)' },
                  { value: 'medium', label: 'Medium (51-200 employees)' },
                  { value: 'large', label: 'Large (201-1000 employees)' },
                  { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
                ]}
                {...register('orgSize', { required: 'Organization size is required' })}
                error={errors.orgSize?.message}
              />
            </>
          ) : (
            <Select
              label="Organization"
              options={organizations}
              {...register('organizationId', { 
                required: 'Please select an organization or create a new one'
              })}
              error={errors.organizationId?.message}
            />
          )}
        </div>
        
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