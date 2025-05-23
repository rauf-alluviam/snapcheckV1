import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { FilterParams } from '../../types';
import { CalendarIcon, Filter, Plus, Search, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

// Mock data for inspections
const mockInspections = [
  {
    _id: '1',
    workflowId: '1',
    workflowName: 'Cargo Inspection',
    category: 'Cargo',
    inspectionType: 'Cargo Inspection',
    assignedTo: '1',
    assignedToName: 'John Doe',
    approverId: '2',
    approverName: 'Jane Smith',
    status: 'pending',
    organizationId: '1',
    inspectionDate: '2025-04-01',
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-01T10:00:00Z'
  },
  {
    _id: '2',
    workflowId: '2',
    workflowName: 'Facility Inspection',
    category: 'Facility',
    inspectionType: 'Bathroom Cleaning',
    assignedTo: '1',
    assignedToName: 'John Doe',
    approverId: '2',
    approverName: 'Jane Smith',
    status: 'approved',
    organizationId: '1',
    inspectionDate: '2025-03-28',
    createdAt: '2025-03-28T10:00:00Z',
    updatedAt: '2025-03-28T10:00:00Z'
  },
  {
    _id: '3',
    workflowId: '3',
    workflowName: 'Vehicle Inspection',
    category: 'Vehicle',
    inspectionType: 'Truck Inspection',
    assignedTo: '3',
    assignedToName: 'Michael Brown',
    approverId: '2',
    approverName: 'Jane Smith',
    status: 'rejected',
    organizationId: '1',
    inspectionDate: '2025-03-25',
    createdAt: '2025-03-25T10:00:00Z',
    updatedAt: '2025-03-25T10:00:00Z'
  },
  {
    _id: '4',
    workflowId: '4',
    workflowName: 'Chair Setup',
    category: 'Facility',
    inspectionType: 'Chair Setup',
    assignedTo: '4',
    assignedToName: 'David Wilson',
    approverId: '2',
    approverName: 'Jane Smith',
    status: 'pending',
    organizationId: '1',
    inspectionDate: '2025-03-22',
    createdAt: '2025-03-22T10:00:00Z',
    updatedAt: '2025-03-22T10:00:00Z'
  },
  {
    _id: '5',
    workflowId: '1',
    workflowName: 'Cargo Inspection',
    category: 'Cargo',
    inspectionType: 'Cargo Inspection',
    assignedTo: '5',
    assignedToName: 'Sarah Johnson',
    approverId: '2',
    approverName: 'Jane Smith',
    status: 'approved',
    organizationId: '1',
    inspectionDate: '2025-03-20',
    createdAt: '2025-03-20T10:00:00Z',
    updatedAt: '2025-03-20T10:00:00Z'
  }
];

// Mock data for filters
const categoryOptions = ['All', 'Cargo', 'Facility', 'Vehicle'];
const inspectionTypeOptions = ['All', 'Cargo Inspection', 'Bathroom Cleaning', 'Truck Inspection', 'Chair Setup'];
const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];
const inspectorOptions = ['All', 'John Doe', 'Michael Brown', 'Sarah Johnson', 'David Wilson'];

const InspectionsPage: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({organizationId: '', role: ''});
  const [searchQuery, setSearchQuery] = useState('');
  const [inspections, setInspections] = useState(mockInspections);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch inspections from API
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/inspections');
        setInspections(response.data);
      } catch (err) {
        console.error('Error fetching inspections:', err);
        setError('Failed to load inspections. Please try again.');
        // Use mock data as fallback
        setInspections(mockInspections);
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
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
  
  // Filter inspections based on the current filters
  const filteredInspections = inspections.filter(inspection => {
    // Search query filter
    if (searchQuery && 
        !inspection.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inspection.inspectionType.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (filters.category && inspection.category !== filters.category) {
      return false;
    }
    
    // Inspection type filter
    if (filters.inspectionType && inspection.inspectionType !== filters.inspectionType) {
      return false;
    }
    
    // Status filter
    if (filters.status && inspection.status !== filters.status.toLowerCase()) {
      return false;
    }
    
    // Assigned to filter
    if (filters.assignedTo && inspection.assignedToName !== filters.assignedTo) {
      return false;
    }
    
    return true;
  });
  // Filter inspections based on user role
  const userInspections = React.useMemo(() => {
    if (!user) return [];
    
    switch (user.role) {
      case 'admin':
        return filteredInspections; // Admin sees all inspections
      case 'approver':
        return filteredInspections.filter(insp => insp.approverId === user._id);
      case 'inspector':
        return filteredInspections.filter(insp => insp.assignedTo === user._id);
      default:
        return [];
    }
  }, [filteredInspections, user]);

  // Check if user has permission to access this page
  if (!user || (user.role !== 'admin' && user.role !== 'approver' && user.role !== 'inspector')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-yellow-100 p-6">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 max-w-md mb-6">
            You don't have permission to access inspection management. This feature is available to administrators, approvers, and inspectors.
          </p>
          <Link to="/dashboard">
            <Button variant="primary">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">Inspections</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          {isAdmin && (
            <Link to="/inspections/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                New Inspection
              </Button>
            </Link>
          )}
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
              placeholder="Search inspections..."
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
                  <label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.category || 'All'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="inspectionType" className="block text-xs font-medium text-gray-700 mb-1">
                    Inspection Type
                  </label>
                  <select
                    id="inspectionType"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.inspectionType || 'All'}
                    onChange={(e) => handleFilterChange('inspectionType', e.target.value)}
                  >
                    {inspectionTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.status || 'All'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="assignedTo" className="block text-xs font-medium text-gray-700 mb-1">
                    Inspector
                  </label>
                  <select
                    id="assignedTo"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.assignedTo || 'All'}
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  >
                    {inspectorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading inspections...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="inline-block rounded-full bg-red-100 p-3 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInspections.map((inspection) => (
              <Link 
                key={inspection._id} 
                to={`/inspections/${inspection._id}`}
                className="group block"
              >
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                          {inspection.workflowName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {inspection.inspectionType}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          inspection.status === 'approved' 
                            ? 'success' 
                            : inspection.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-gray-500">Inspector</p>
                          <p className="font-medium text-gray-900">{inspection.assignedToName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Approver</p>
                          <p className="font-medium text-gray-900">{inspection.approverName}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{inspection.inspectionDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {userInspections.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">No inspections found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InspectionsPage;