import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Building, User, Mail, Phone, CheckCircle, Settings as SettingsIcon, Shield, Info } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [orgForm, setOrgForm] = useState({
    name: 'Acme Corp',
    email: 'contact@acmecorp.com',
    phone: '(123) 456-7890',
    address: '123 Main St, Suite 100, Anytown, USA'
  });
  
  const [profileFormErrors, setProfileFormErrors] = useState<Record<string, string>>({});
  const [orgFormErrors, setOrgFormErrors] = useState<Record<string, string>>({});
  
  const [isProfileFormSubmitting, setIsProfileFormSubmitting] = useState(false);
  const [isOrgFormSubmitting, setIsOrgFormSubmitting] = useState(false);
  
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    
    if (!profileForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!profileForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(profileForm.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (profileForm.newPassword) {
      if (!profileForm.currentPassword) {
        errors.currentPassword = 'Current password is required to set a new password';
      }
      
      if (profileForm.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setProfileFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateOrgForm = () => {
    const errors: Record<string, string> = {};
    
    if (!orgForm.name.trim()) {
      errors.name = 'Organization name is required';
    }
    
    if (!orgForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(orgForm.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!orgForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!orgForm.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setOrgFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    setProfileSuccess(false);
  };
  
  const handleOrgFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrgForm(prev => ({ ...prev, [name]: value }));
    setOrgSuccess(false);
  };
  
  const handleProfileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsProfileFormSubmitting(true);
    
    // In a real app, this would call the API to update the user profile
    console.log('Updating profile:', profileForm);
    
    // Simulate API call
    setTimeout(() => {
      setIsProfileFormSubmitting(false);
      setProfileSuccess(true);
      
      // Reset password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }, 1500);
  };
  
  const handleOrgFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateOrgForm()) {
      return;
    }
    
    setIsOrgFormSubmitting(true);
    
    // In a real app, this would call the API to update the organization details
    console.log('Updating organization:', orgForm);
    
    // Simulate API call
    setTimeout(() => {
      setIsOrgFormSubmitting(false);
      setOrgSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage your account and organization preferences</p>
          </div>
        </div>

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Profile Settings Card */}
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-800">Profile Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleProfileFormSubmit} className="space-y-6">
                {profileSuccess && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center shadow-sm">
                    <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                    <span className="font-medium">Your profile has been updated successfully.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Full Name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileFormChange}
                    error={profileFormErrors.name}
                    leftAddon={<User className="ml-3 h-5 w-5 text-gray-400" />}
                  />
                  
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileFormChange}
                    error={profileFormErrors.email}
                    leftAddon={<Mail className="ml-3 h-5 w-5 text-gray-400" />}
                  />
                </div>
                
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={handleProfileFormChange}
                      error={profileFormErrors.currentPassword}
                    />
                    
                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={handleProfileFormChange}
                      error={profileFormErrors.newPassword}
                      helperText="Leave blank if you don't want to change"
                    />
                    
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileFormChange}
                      error={profileFormErrors.confirmPassword}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    leftIcon={<Save size={18} />}
                    isLoading={isProfileFormSubmitting}
                    className="px-8"
                  >
                    Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Organization Settings Card */}
          {isAdmin && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-800">Organization Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleOrgFormSubmit} className="space-y-6">
                  {orgSuccess && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center shadow-sm">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                      <span className="font-medium">Organization details have been updated successfully.</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6">
                    <Input
                      label="Organization Name"
                      name="name"
                      value={orgForm.name}
                      onChange={handleOrgFormChange}
                      error={orgFormErrors.name}
                      leftAddon={<Building className="ml-3 h-5 w-5 text-gray-400" />}
                    />
                    
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={orgForm.email}
                      onChange={handleOrgFormChange}
                      error={orgFormErrors.email}
                      leftAddon={<Mail className="ml-3 h-5 w-5 text-gray-400" />}
                    />
                    
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={orgForm.phone}
                      onChange={handleOrgFormChange}
                      error={orgFormErrors.phone}
                      leftAddon={<Phone className="ml-3 h-5 w-5 text-gray-400" />}
                    />
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="address"
                        className="w-full border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        rows={4}
                        value={orgForm.address}
                        onChange={handleOrgFormChange}
                        placeholder="Enter organization address..."
                      ></textarea>
                      {orgFormErrors.address && (
                        <p className="mt-2 text-sm text-red-600 font-medium">
                          {orgFormErrors.address}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      leftIcon={<Save size={18} />}
                      isLoading={isOrgFormSubmitting}
                      className="px-8"
                    >
                      Save Organization
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* System Information Card */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg">
                <Info className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-800">System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Application Version</p>
                <p className="text-2xl font-bold text-gray-800">1.0.0</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Last Updated</p>
                <p className="text-lg font-bold text-gray-800">April 10, 2025</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">License Type</p>
                <p className="text-xl font-bold text-gray-800">Enterprise</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Support Contact</p>
                <p className="text-sm font-bold text-gray-800 break-all">support@inspectpro.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;