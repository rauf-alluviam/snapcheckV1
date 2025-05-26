import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { FilterParams, Workflow } from '../../types';
import { Filter, Plus, Search, FileText, CheckCircle, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

// Mock data as fallback
const mockWorkflows = [
  {
    _id: '1',
    name: 'Cargo Inspection',
    category: 'Cargo',
    description: 'Standard inspection for cargo shipments',
    steps: [
      { title: 'Visual Inspection', instructions: 'Check for any visible damage or tampering', mediaRequired: true },
      { title: 'Weight Verification', instructions: 'Verify weight matches the manifest', mediaRequired: true },
      { title: 'Seal Check', instructions: 'Confirm all seals are intact and match provided numbers', mediaRequired: false }
    ],
    organizationId: '1',
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-15T10:00:00Z'
  },
  {
    _id: '2',
    name: 'Facility Inspection',
    category: 'Facility',
    description: 'Comprehensive facility safety check',
    steps: [
      { title: 'Entrance Check', instructions: 'Inspect entry/exit points', mediaRequired: true },
      { title: 'Fire Safety', instructions: 'Check fire extinguishers and emergency exits', mediaRequired: true },
      { title: 'Electrical Systems', instructions: 'Inspect electrical panels and wiring', mediaRequired: true }
    ],
    organizationId: '1',
    createdAt: '2025-03-10T10:00:00Z',
    updatedAt: '2025-03-10T10:00:00Z'
  },
  {
    _id: '3',
    name: 'Vehicle Inspection',
    category: 'Vehicle',
    description: 'Standard vehicle safety inspection',
    steps: [
      { title: 'Exterior Check', instructions: 'Inspect for dents, scratches, and damage', mediaRequired: true },
      { title: 'Tire Inspection', instructions: 'Check tire pressure and tread depth', mediaRequired: true },
      { title: 'Lights and Signals', instructions: 'Verify all lights and signals are working', mediaRequired: true },
      { title: 'Fluid Levels', instructions: 'Check oil, coolant, and other fluid levels', mediaRequired: false }
    ],
    organizationId: '1',
    createdAt: '2025-03-05T10:00:00Z',
    updatedAt: '2025-03-05T10:00:00Z'
  },
  {
    _id: '4',
    name: 'Chair Setup',
    category: 'Facility',
    description: 'Inspection for proper chair setup and ergonomics',
    steps: [
      { title: 'Chair Count', instructions: 'Count and verify number of chairs', mediaRequired: true },
      { title: 'Arrangement Check', instructions: 'Verify chairs are properly arranged', mediaRequired: true },
      { title: 'Quality Inspection', instructions: 'Check for any damage or issues', mediaRequired: true }
    ],
    organizationId: '1',
    createdAt: '2025-02-28T10:00:00Z',
    updatedAt: '2025-02-28T10:00:00Z'
  },
  {
    _id: '5',
    name: 'Bathroom Cleaning',
    category: 'Facility',
    description: 'Standard bathroom cleanliness inspection',
    steps: [
      { title: 'Toilet Check', instructions: 'Verify toilets are clean and functional', mediaRequired: true },
      { title: 'Sink Inspection', instructions: 'Check sinks, faucets, and drains', mediaRequired: true },
      { title: 'Floor Cleaning', instructions: 'Verify floors are clean and dry', mediaRequired: true },
      { title: 'Supply Check', instructions: 'Confirm adequate soap, paper towels, and toilet paper', mediaRequired: false }
    ],
    organizationId: '1',
    createdAt: '2025-02-20T10:00:00Z',
    updatedAt: '2025-02-20T10:00:00Z'
  }
];

const categoryOptions = ['All', 'Cargo', 'Facility', 'Vehicle'];

const WorkflowsPage: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({organizationId: '', role: ''});
  const [searchQuery, setSearchQuery] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Function to fetch workflows
  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await api.get('/api/workflows');
      setWorkflows(response.data);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setErrorMessage('Failed to load workflows. Please try again.');
      // Use mock data as fallback
      setWorkflows(mockWorkflows);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to delete a workflow
  const deleteWorkflow = async () => {
    if (!workflowToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/workflows/${workflowToDelete._id}`);
      setWorkflows(prev => prev.filter(w => w._id !== workflowToDelete._id));
      setDeleteModalOpen(false);
      setWorkflowToDelete(null);
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setErrorMessage('Failed to delete workflow. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to open delete confirmation modal
  const handleDeleteClick = (e: React.MouseEvent, workflow: Workflow) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkflowToDelete(workflow);
    setDeleteModalOpen(true);
  };

  // Fetch workflows from API on component mount
  useEffect(() => {
    fetchWorkflows();
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
  
  // Filter workflows based on the current filters
  const filteredWorkflows = workflows.filter(workflow => {
    // Search query filter
    if (searchQuery && 
        !workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !workflow.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (filters.category && workflow.category !== filters.category) {
      return false;
    }
    
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-6">
              <FileText className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 max-w-md mb-6">
            You don't have permission to access workflow management. This feature is only available to administrators.
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
        <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Link to="/workflows/new">
            <Button variant="primary" leftIcon={<Plus size={16} />}>
              New Workflow
            </Button>
          </Link>
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
              placeholder="Search workflows..."
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow._id} className="h-full transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <Link 
                    to={`/workflows/${workflow._id}`}
                    className="group block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                      {workflow.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {workflow.description}
                  </p>
                </div>
                <Badge 
                  variant="primary"
                  size="sm"
                >
                  {workflow.category}
                </Badge>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-gray-600">{workflow.steps.length} Steps</span>
                  </div>
                  <span className="text-gray-500">
                    Created {new Date(workflow.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {isAdmin && (
                  <div className="mt-3 flex justify-end space-x-2">
                    <Link to={`/workflows/edit/${workflow._id}`}>
                      <button
                        className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                        title="Edit workflow"
                      >
                        <Edit size={16} />
                      </button>
                    </Link>
                    <button
                      className="p-1.5 rounded-full bg-gray-100 text-red-600 hover:bg-gray-200"
                      onClick={(e) => handleDeleteClick(e, workflow)}
                      title="Delete workflow"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading workflows...</p>
        </div>
      ) : errorMessage ? (
        <div className="text-center py-12">
          <p className="text-red-500">{errorMessage}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fetchWorkflows()}
          >
            Retry
          </Button>
        </div>
      ) : filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No workflows found matching your criteria.</p>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWorkflowToDelete(null);
        }}
        title="Delete Workflow"
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
                Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setWorkflowToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteWorkflow}
              disabled={isDeleting}
              loading={isDeleting}
            >
              Delete Workflow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowsPage;