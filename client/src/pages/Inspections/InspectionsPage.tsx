import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Switch from '../../components/ui/Switch';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { FilterParams, Inspection } from '../../types';
import { CalendarIcon, Filter, Plus, Search, AlertCircle, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import api from '../../utils/api';

// Mock data for inspections
const mockInspections: Inspection[] = [
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
    updatedAt: '2025-04-01T10:00:00Z',
    filledSteps: [],
    inspectorId: '1',
    approvers: [
      {
        userId: '2',
        userName: 'Jane Smith',
        status: 'pending'
      }
    ]
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
    updatedAt: '2025-03-28T10:00:00Z',
    filledSteps: [],
    inspectorId: '1',
    approvers: [
      {
        userId: '2',
        userName: 'Jane Smith',
        status: 'approved'
      }
    ]
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
    updatedAt: '2025-03-25T10:00:00Z',
    filledSteps: [],
    inspectorId: '3',
    approvers: [
      {
        userId: '2',
        userName: 'Jane Smith',
        status: 'rejected'
      }
    ]
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
    updatedAt: '2025-03-22T10:00:00Z',
    filledSteps: [],
    inspectorId: '4',
    approvers: [
      {
        userId: '2',
        userName: 'Jane Smith',
        status: 'pending'
      }
    ]
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
    updatedAt: '2025-03-20T10:00:00Z',
    filledSteps: [],
    inspectorId: '5',
    approvers: [
      {
        userId: '2',
        userName: 'Jane Smith',
        status: 'approved'
      }
    ]
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
  const [searchQuery, setSearchQuery] = useState('');  const [inspections, setInspections] = useState<Inspection[]>(mockInspections);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  // Group by workflow state
  const [groupByWorkflow, setGroupByWorkflow] = useState(true);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({});

  const handleGroupByWorkflowChange = (newValue: boolean) => {
    console.log('Group by workflow changed from:', groupByWorkflow, 'to:', newValue);
    setGroupByWorkflow(newValue);
  };

  // Fetch inspections from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
          // Fetch inspections
        const inspResponse = await api.get('/api/inspections');
        setInspections(inspResponse.data);
      } catch (err) {
        console.error('Error fetching inspections:', err);
        setError('Failed to load inspections. Please try again.');
        // Use mock data as fallback
        setInspections(mockInspections);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.role]);
  
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

  // Function to delete an inspection
  const deleteInspection = async () => {
    if (!inspectionToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/inspections/${inspectionToDelete._id}`);
      setInspections(prev => prev.filter(insp => insp._id !== inspectionToDelete._id));
      setDeleteModalOpen(false);
      setInspectionToDelete(null);
    } catch (err) {
      console.error('Error deleting inspection:', err);
      setError('Failed to delete inspection. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to open delete confirmation modal
  const handleDeleteClick = (e: React.MouseEvent, inspection: Inspection) => {
    e.preventDefault();
    e.stopPropagation();
    setInspectionToDelete(inspection);
    setDeleteModalOpen(true);
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

    // Date range filter
    if (startDate && inspection.inspectionDate < startDate) {
      return false;
    }
    if (endDate && inspection.inspectionDate > endDate) {
      return false;
    }

    // Approver filter
    if (filters.approverId) {
      // Check if the inspection has the approver in its list
      if (inspection.approverId === filters.approverId) {
        return true;
      }
      
      // Also check in the approvers array if it exists
      if (inspection.approvers && Array.isArray(inspection.approvers)) {
        return inspection.approvers.some(
          approver => approver.userId === filters.approverId
        );
      }
      return false;
    }
    
    return true;
  });
  
  // Filter inspections based on user role
  const userInspections = React.useMemo(() => {
    if (!user) return [];
    
    const userId = user._id;
    
    switch (user.role) {
      case 'admin':
        return filteredInspections; // Admin sees all inspections      
      case 'approver':
        // Show inspections where the user is an approver or where they created the inspection
        return filteredInspections.filter(insp => 
          insp.approverId === userId || 
          insp.assignedTo === userId ||
          insp.approvers?.some(approver => approver.userId === userId)
        );
      case 'inspector':
        return filteredInspections.filter(insp => insp.assignedTo === userId);
      default:
        return [];
    }
  }, [filteredInspections, user]);

  // Group inspections by workflow
  const groupedInspections = React.useMemo(() => {
    if (!groupByWorkflow) return { ungrouped: userInspections };
    
    return userInspections.reduce((acc: Record<string, Inspection[]>, inspection) => {
      const key = inspection.workflowName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(inspection);
      return acc;
    }, {});
  }, [userInspections, groupByWorkflow]);

  // Initialize expanded state when workflows change - FIXED
  useEffect(() => {
    if (groupByWorkflow) {
      const workflowNames = Object.keys(groupedInspections);
      if (workflowNames.length > 0) {
        setExpandedWorkflows(prev => {
          const hasWorkflows = Object.keys(prev).length > 0;
          const workflowsChanged = !workflowNames.every(name => name in prev);
          
          if (!hasWorkflows || workflowsChanged) {
            const initialExpanded: Record<string, boolean> = {};
            workflowNames.forEach(name => {
              initialExpanded[name] = prev[name] !== undefined ? prev[name] : true;
            });
            return initialExpanded;
          }
          return prev;
        });
      }
    } else {
      // Clear expanded state when not grouping
      setExpandedWorkflows({});
    }
  }, [groupByWorkflow]); // Only depend on groupByWorkflow

  // Toggle expansion of a workflow group
  const toggleWorkflowExpansion = (workflowName: string) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [workflowName]: !prev[workflowName]
    }));
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Inspections</h1>        <div className="flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>          
          {(isAdmin || user?.role === 'approver' || user?.role === 'inspector') && (
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
          <div className="relative w-full mb-4">
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
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <label className="inline-flex items-center mr-4 text-sm font-medium text-gray-700">
                Group by workflow
              </label>
              <Switch 
                checked={groupByWorkflow} 
                onChange={handleGroupByWorkflowChange}
                className="ml-2"
              />
            </div>
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
                
                <div>
                  <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="startDate"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="endDate"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setInspectionToDelete(null);
        }}
        title="Delete Inspection"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="mr-4 flex-shrink-0 bg-red-100 rounded-full p-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Deletion
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this inspection? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setInspectionToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteInspection}
              disabled={isDeleting}
              isLoading={isDeleting}
            >
              Delete Inspection
            </Button>
          </div>
        </div>
      </Modal>
      
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
          {/* View mode toggle */}
          {userInspections.length > 0 && (
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-lg ${
                    viewMode === 'card' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setViewMode('card')}
                >
                  Card View
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-lg ${
                    viewMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </button>
              </div>
            </div>
          )}
          
          {/* Main Content */}
          {viewMode === 'table' ? (
            groupByWorkflow ? (
              /* Grouped Table View */
              <div className="space-y-6">
                {Object.keys(groupedInspections).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No inspections found matching your criteria.</p>
                  </div>
                ) : (
                  Object.entries(groupedInspections).map(([workflowName, workflowInspections]) => (
                    <Card key={workflowName} className="overflow-hidden">
                      <div 
                        className="bg-gray-50 p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleWorkflowExpansion(workflowName)}
                      >
                        <div className="flex items-center space-x-2">
                          <Folder className="h-5 w-5 text-blue-600" />
                          <h3 className="font-medium text-gray-900">{workflowName}</h3>
                          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                            {workflowInspections.length}
                          </span>
                        </div>
                        {expandedWorkflows[workflowName] ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      
                      {expandedWorkflows[workflowName] && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Inspection Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Category
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Inspector
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {workflowInspections.map((inspection) => (
                                <tr key={inspection._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/inspections/${inspection._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                      {inspection.inspectionType}
                                    </Link>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">{inspection.category}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">
                                      {new Date(inspection.inspectionDate).toLocaleDateString()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">{inspection.assignedToName}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge 
                                      variant={
                                        inspection.status === 'approved' 
                                          ? 'success' 
                                          : inspection.status === 'rejected'
                                            ? 'danger'
                                            : 'warning'
                                      }
                                      size="sm"
                                    >
                                      {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={`/inspections/${inspection._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                                      View
                                    </Link>
                                    {isAdmin && (
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleDeleteClick(e, inspection);
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            ) : (
              /* Ungrouped Table View */
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inspection Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inspector
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userInspections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No inspections found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        userInspections.map((inspection) => (
                          <tr key={inspection._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link to={`/inspections/${inspection._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                {inspection.inspectionType}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{inspection.category}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {new Date(inspection.inspectionDate).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{inspection.assignedToName}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant={
                                  inspection.status === 'approved' 
                                    ? 'success' 
                                    : inspection.status === 'rejected'
                                      ? 'danger'
                                      : 'warning'
                                }
                                size="sm"
                              >
                                {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link to={`/inspections/${inspection._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                                View
                              </Link>
                              {isAdmin && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteClick(e, inspection);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          ) : (
            /* Card View */
            groupByWorkflow ? (
              /* Grouped Card View */
              <div className="space-y-6">
                {Object.keys(groupedInspections).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No inspections found matching your criteria.</p>
                  </div>
                ) : (
                  Object.entries(groupedInspections).map(([workflowName, workflowInspections]) => (
                    <Card key={workflowName} className="overflow-hidden">
                      <div 
                        className="bg-gray-50 p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleWorkflowExpansion(workflowName)}
                      >
                        <div className="flex items-center space-x-2">
                          <Folder className="h-5 w-5 text-blue-600" />
                          <h3 className="font-medium text-gray-900">{workflowName}</h3>
                          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                            {workflowInspections.length}
                          </span>
                        </div>
                        {expandedWorkflows[workflowName] ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>                    
                      {expandedWorkflows[workflowName] && (
                        <div className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {workflowInspections.map((inspection) => (
                              <Card key={inspection._id} className="h-full transition-shadow hover:shadow-lg">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <Link 
                                        to={`/inspections/${inspection._id}`}
                                        className="group block"
                                      >
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                                          {inspection.inspectionType}
                                        </h3>
                                      </Link>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {inspection.category}
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
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
                                      
                                      {inspection.status === 'pending' && 
                                      (inspection.assignedTo === inspection.approverId || 
                                        inspection.approvers?.some(a => a.userId === inspection.assignedTo)) && (
                                        <Badge variant="warning" className="text-xs">
                                          Needs Admin Approval
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between text-sm">
                                      <div>
                                        <p className="text-gray-500">Inspector</p>
                                        <p className="font-medium text-gray-900">{inspection.assignedToName}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Approvers</p>
                                        <p className="font-medium text-gray-900">
                                          {inspection.approverName}
                                          {inspection.approvers && inspection.approvers.length > 1 && 
                                            ` + ${inspection.approvers.length - 1} more`}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center text-sm text-gray-500">
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      <span>{inspection.inspectionDate}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            ) : (
              /* Ungrouped Card View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userInspections.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No inspections found matching your criteria.</p>
                  </div>
                ) : (
                  userInspections.map((inspection) => (
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
                            <div className="flex flex-col gap-1">
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
                              
                              {inspection.status === 'pending' && 
                              (inspection.assignedTo === inspection.approverId || 
                                inspection.approvers?.some(a => a.userId === inspection.assignedTo)) && (
                                <Badge variant="warning" className="text-xs">
                                  Needs Admin Approval
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <div>
                                <p className="text-gray-500">Inspector</p>
                                <p className="font-medium text-gray-900">{inspection.assignedToName}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Approvers</p>
                                <p className="font-medium text-gray-900">
                                  {inspection.approverName}
                                  {inspection.approvers && inspection.approvers.length > 1 && 
                                    ` + ${inspection.approvers.length - 1} more`}
                                </p>
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
                  ))
                )}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default InspectionsPage;