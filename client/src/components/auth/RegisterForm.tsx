import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Mail, Lock, User, Building, Phone, Globe } from 'lucide-react';
import api from '../../utils/api';

/**
 * RegisterForm Component
 * 
 * This component handles user registration with organization selection or creation.
 * 
 * Key features:
 * - User can join an existing organization (loaded from public API endpoint)
 * - User can create a new organization during registration
 * - Role selection with support for custom roles
 * - Comprehensive form validation with react-hook-form
 * - Error handling for organization loading and creation
 * - Loading states for async operations
 * 
 * Flow:
 * 1. Form loads existing organizations from the public API endpoint
 * 2. User either selects an existing organization or creates a new one
 * 3. If creating a new org, the component first creates the organization
 * 4. Then registers the user with the selected/created organization
 * 5. On success, redirects to dashboard
 */

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
  const { register: registerUser, state } = useAuth();  const { loading, error } = state;  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ value: string; label: string; }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [orgLoadError, setOrgLoadError] = useState<string | null>(null);
  
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
        try {
          console.log('Creating new organization:', data.orgName);
          const orgResponse = await api.post('/api/organizations/register', {
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
          console.log('Organization created successfully:', orgResponse.data);
        } catch (orgError: any) {
          console.error('Failed to create organization:', orgError);
          throw new Error(
            orgError.response?.data?.message || 
            'Failed to create organization. Please try again.'
          );
        }
      }

      // Handle custom roles
      let role = data.role;
      let customRole;
      
      if (data.role.startsWith('custom:')) {
        role = 'custom';
        customRole = data.role.split(':')[1];
      }
      
      // Register user with organization
      console.log('Registering user with organization:', organizationId);
      const result = await registerUser(
        data.name,
        data.email,
        data.password,
        organizationId,
        role,
        customRole
      );
      
      if (result && result.success) {
        console.log('Registration successful, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.error('Registration failed:', result?.error);
        // Error will be handled by AuthContext and shown via error state
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      // The error will be handled by the AuthContext and displayed via the error state
    }
  };  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoadingOrgs(true);
      setOrgLoadError(null);
      try {
        // Use the public endpoint that doesn't require authentication
        const response = await api.get('/api/organizations/public');
        
        if (response.data && Array.isArray(response.data)) {
          setOrganizations(response.data.map((org: any) => ({
            value: org._id,
            label: org.name
          })));
          console.log('Organizations loaded:', response.data.length);
        } else {
          console.error('Invalid organization data format:', response.data);
          setOrganizations([]);
          setOrgLoadError('Unable to load organizations. Please try again later.');
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
        setOrgLoadError('Failed to load organizations. Please check your connection and try again.');
      } finally {
        setLoadingOrgs(false);
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
          <div className="space-y-4">          <div className="flex items-center space-x-2">            <input
              type="checkbox"
              id="createNewOrg"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={watch('createNewOrg')}
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
            </>          ) : (
            <>
              {loadingOrgs ? (
                <div className="flex items-center justify-center p-4 border border-gray-200 rounded-md">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                  <span className="text-gray-600">Loading organizations...</span>
                </div>
              ) : orgLoadError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm mb-4">
                  {orgLoadError}                  <button 
                    onClick={() => {
                      // Set the createNewOrg field to true
                      const createNewOrgField = 'createNewOrg';
                      const event = { target: { name: createNewOrgField, value: true } };
                      register(createNewOrgField).onChange(event);
                    }}
                    className="ml-2 text-blue-500 hover:text-blue-700 underline"
                  >
                    Create a new organization instead
                  </button>
                </div>
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
              
              {organizations.length === 0 && !loadingOrgs && !orgLoadError && (
                <div className="text-sm text-gray-600 mt-1">
                  No organizations available. Please create a new one.
                </div>
              )}
            </>
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