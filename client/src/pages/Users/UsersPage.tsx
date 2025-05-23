import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { FilterParams } from '../../types';
import api from '../../utils/api';
import { Plus, Search, Filter, User, Mail, Building, AlertCircle, UserCog, Trash2, Loader, Lock } from 'lucide-react';

// Define user interface
interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for users
const mockUsers: UserData[] = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    organizationId: '1',
    organizationName: 'Acme Corp',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'approver',
    organizationId: '1',
    organizationName: 'Acme Corp',
    createdAt: '2025-03-02T10:00:00Z',
    updatedAt: '2025-03-02T10:00:00Z'
  },
  {
    _id: '3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    role: 'inspector',
    organizationId: '1',
    organizationName: 'Acme Corp',
    createdAt: '2025-03-03T10:00:00Z',
    updatedAt: '2025-03-03T10:00:00Z'
  },
  {
    _id: '4',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    role: 'inspector',
    organizationId: '1',
    organizationName: 'Acme Corp',
    createdAt: '2025-03-04T10:00:00Z',
    updatedAt: '2025-03-04T10:00:00Z'
  },
  {
    _id: '5',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'inspector',
    organizationId: '1',
    organizationName: 'Acme Corp',
    createdAt: '2025-03-05T10:00:00Z',
    updatedAt: '2025-03-05T10:00:00Z'
  }
];

// Mock data for filters
const roleOptions = ['All', 'Admin', 'Approver', 'Inspector'];

// Define organization interface
interface Organization {
  _id: string;
  name: string;
}

interface NewUserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  organizationId: string;
}

const UsersPage: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({organizationId: '', role: ''});
  const [searchQuery, setSearchQuery] = useState('');
  
  const [users, setUsers] = useState<UserData[]>(mockUsers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        // Use mock data as fallback
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  
  const [newUserFormData, setNewUserFormData] = useState<NewUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'inspector',
    organizationId: '1'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{value: string, label: string}>>([
    { value: 'all', label: 'All Organizations' }
  ]);
  
  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await api.get('/api/organizations');
        const orgs = response.data;
        setOrganizations(orgs);
        setOrganizationOptions([
          { value: 'all', label: 'All Organizations' },
          ...orgs.map((org: Organization) => ({
            value: org._id,
            label: org.name
          }))
        ]);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };

    fetchOrganizations();
  }, []);
  
  // Function to handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    if (value === 'All') {
      const newFilters = { ...filters };
      delete newFilters[key as keyof FilterParams];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };
  
  // Function to reset all filters
  const resetFilters = () => {
    setFilters({organizationId: '', role: ''});
    setSearchQuery('');
  };
  
  // Filter users based on the current filters
  const filteredUsers = users.filter(user => {
    // Search query filter
    if (searchQuery && 
        !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Role filter
    if (filters.role && user.role !== filters.role.toLowerCase()) {
      return false;
    }
    
    // Organization filter
    if (filters.organizationId && filters.organizationId !== 'all' && user.organizationId !== filters.organizationId) {
      return false;
    }
    
    return true;
  });
  
  const validateForm = (data: NewUserFormData, isEdit: boolean = false): boolean => {
    const errors: Record<string, string> = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
      errors.email = 'Invalid email address';
    }
    
    // Only validate password for new users or if a password is provided for edits
    if (!isEdit && !data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.trim() && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!data.role) {
      errors.role = 'Role is required';
    }
    
    if (!data.organizationId) {
      errors.organizationId = 'Organization is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
    const handleNewUserSubmit = async () => {
    if (!validateForm(newUserFormData)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/auth/register', {
        name: newUserFormData.name,
        email: newUserFormData.email,
        password: newUserFormData.password,
        role: newUserFormData.role,
        organizationId: newUserFormData.organizationId
      });
      
      // Add the new user to the list
      const newUser = response.data.user;
      const orgName = organizations.find(org => org._id === newUser.organizationId)?.name || '';
      
      setUsers(prev => [...prev, {
        ...newUser,
        organizationName: orgName
      }]);
      
      setIsNewUserModalOpen(false);
      setNewUserFormData({
        name: '',
        email: '',
        password: '',
        role: 'inspector',
        organizationId: ''
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      setFormErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };
    const handleEditUserSubmit = async () => {
    if (!validateForm(newUserFormData, true)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await api.put(`/api/users/${selectedUser?._id}`, {
        name: newUserFormData.name,
        email: newUserFormData.email,
        ...(newUserFormData.password ? { password: newUserFormData.password } : {}),
        role: newUserFormData.role,
        organizationId: newUserFormData.organizationId
      });
      
      // Update the user in the list
      const updatedUser = response.data;
      const orgName = organizations.find(org => org._id === updatedUser.organizationId)?.name || '';
      
      setUsers(prev => prev.map(user => 
        user._id === updatedUser._id 
          ? { ...updatedUser, organizationName: orgName }
          : user
      ));
      
      setIsEditUserModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      setFormErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setNewUserFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password for security
      role: user.role,
      organizationId: user.organizationId
    });
    setIsEditUserModalOpen(true);
  };
  
  const handleDeleteUser = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteUserModalOpen(true);
  };
    const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      await api.delete(`/api/users/${selectedUser._id}`);
      
      // Remove user from the list
      setUsers(prev => prev.filter(user => user._id !== selectedUser._id));
      setIsDeleteUserModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      setFormErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-6">
              <UserCog className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 max-w-md mb-6">
            You don't have permission to access user management. This feature is only available to administrators.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsNewUserModalOpen(true)}
          >
            New User
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Reset all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.role || 'All'}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="organization" className="block text-xs font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <select
                    id="organization"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.organizationId || 'all'}
                    onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                  >
                    {organizationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-red-100 p-3 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          user.role === 'admin' 
                            ? 'primary' 
                            : user.role === 'approver'
                              ? 'secondary'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500">{user.organizationName}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found matching your criteria.</p>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
      
      {/* New User Modal */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Create New User"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={newUserFormData.name}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, name: e.target.value })}
              error={formErrors.name}
              leftAddon={<User className="ml-3 h-5 w-5 text-gray-400" />}
            />
            
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email address"
              value={newUserFormData.email}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, email: e.target.value })}
              error={formErrors.email}
              leftAddon={<Mail className="ml-3 h-5 w-5 text-gray-400" />}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={newUserFormData.password}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, password: e.target.value })}
              error={formErrors.password}
              leftAddon={<Lock className="ml-3 h-5 w-5 text-gray-400" />}
            />
            
            <Select
              label="Role"
              options={[
                { value: 'admin', label: 'Administrator' },
                { value: 'approver', label: 'Approver' },
                { value: 'inspector', label: 'Inspector' }
              ]}
              value={newUserFormData.role}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, role: e.target.value })}
              error={formErrors.role}
            />
            
            <Select
              label="Organization"
              options={organizationOptions}
              value={newUserFormData.organizationId}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, organizationId: e.target.value })}
              error={formErrors.organizationId}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsNewUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleNewUserSubmit}
              isLoading={isSubmitting}
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title={`Edit User: ${selectedUser?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={newUserFormData.name}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, name: e.target.value })}
              error={formErrors.name}
              leftAddon={<User className="ml-3 h-5 w-5 text-gray-400" />}
            />
            
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email address"
              value={newUserFormData.email}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, email: e.target.value })}
              error={formErrors.email}
              leftAddon={<Mail className="ml-3 h-5 w-5 text-gray-400" />}
            />
            
            <Input
              label="Password (leave blank to keep current)"
              type="password"
              placeholder="Enter new password or leave blank"
              value={newUserFormData.password}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, password: e.target.value })}
              error={formErrors.password}
              leftAddon={<Lock className="ml-3 h-5 w-5 text-gray-400" />}
            />
            
            <Select
              label="Role"
              options={[
                { value: 'admin', label: 'Administrator' },
                { value: 'approver', label: 'Approver' },
                { value: 'inspector', label: 'Inspector' }
              ]}
              value={newUserFormData.role}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, role: e.target.value })}
              error={formErrors.role}
            />
            
            <Select
              label="Organization"
              options={organizationOptions}
              value={newUserFormData.organizationId}
              onChange={(e) => setNewUserFormData({ ...newUserFormData, organizationId: e.target.value })}
              error={formErrors.organizationId}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditUserSubmit}
              isLoading={isSubmitting}
            >
              Update User
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-md flex">
            <div className="flex-shrink-0 mr-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Warning</h3>
              <p className="mt-1 text-sm text-red-700">
                Deleting this user cannot be undone. They will lose all access to the system.
              </p>
            </div>
          </div>
          
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>?
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              isLoading={isSubmitting}
              leftIcon={<Trash2 size={16} />}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;