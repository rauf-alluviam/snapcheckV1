import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Trash2, Edit, Copy, AlertCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { Workflow } from '../../types';
import AutoApprovalSettings from '../../components/workflows/AutoApprovalSettings';

// Mock data for workflow
const mockWorkflows = [
  {
    _id: '1',
    name: 'Cargo Inspection',
    category: 'Cargo',
    description: 'Standard inspection for cargo shipments',
    steps: [
      { _id: '1', title: 'Visual Inspection', instructions: 'Check for any visible damage or tampering', mediaRequired: true },
      { _id: '2', title: 'Weight Verification', instructions: 'Verify weight matches the manifest', mediaRequired: true },
      { _id: '3', title: 'Seal Check', instructions: 'Confirm all seals are intact and match provided numbers', mediaRequired: false }
    ],
    organizationId: '1',
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-15T10:00:00Z'
  }
];

const WorkflowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if current user can edit this workflow
  const canEdit = isAdmin || (workflow && workflow.createdBy === user?._id);
    useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get(`/api/workflows/${id}`);
        setWorkflow(res.data);
      } catch (err) {
        console.error('Error fetching workflow:', err);
        setError('Failed to load workflow details');
        
        // Use mock data as fallback for development
        const found = mockWorkflows.find(w => w._id === id);
        setWorkflow(found as any);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkflow();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-6">
              <FileText className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Workflow</h2>
          <p className="text-gray-600 max-w-md mb-6">
            {error}
          </p>
          <Button variant="primary" onClick={() => navigate('/workflows')}>
            Return to Workflows
          </Button>
        </div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      await api.delete(`/api/workflows/${id}`);
      navigate('/workflows');
    } catch (err) {
      console.error('Error deleting workflow:', err);
      alert('Failed to delete workflow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDuplicate = async () => {
    try {
      setIsLoading(true);
      const res = await api.post(`/api/workflows/duplicate/${id}`);
      navigate(`/workflows/${res.data._id}`);
    } catch (err) {
      console.error('Error duplicating workflow:', err);
      alert('Failed to duplicate workflow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  if (!workflow) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{workflow.name}</h1>
          <div className="flex items-center mt-1">
            <Badge variant="primary" size="sm">{workflow.category}</Badge>
            <span className="text-sm text-gray-500 ml-3">
              Created on {new Date(workflow.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>        <div className="flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<Copy size={16} />}
            onClick={handleDuplicate}
          >
            Duplicate
          </Button>
          {canEdit && (
            <>
              <Button
                variant="outline"
                leftIcon={<Edit size={16} />}
                onClick={() => navigate(`/workflows/${id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                leftIcon={<Trash2 size={16} />}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{workflow.description}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Steps</CardTitle>
          <span className="text-sm text-gray-500">{workflow.steps.length} steps</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {workflow.steps.map((step: any, index: number) => (
              <div key={step._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="mt-2 text-gray-700">{step.instructions}</p>
                    
                    <div className="mt-3 flex items-center">
                      <Badge 
                        variant={step.mediaRequired ? 'warning' : 'gray'} 
                        size="sm"
                      >
                        Media {step.mediaRequired ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        {/* Auto-Approval Settings */}
      <AutoApprovalSettings
        workflowId={workflow._id}
        initialSettings={{
          isRoutineInspection: workflow.isRoutineInspection || false,
          autoApprovalEnabled: workflow.autoApprovalEnabled || false,
          bulkApprovalEnabled: workflow.bulkApprovalEnabled || false,
          autoApprovalRules: workflow.autoApprovalRules || {
            timeRangeStart: '00:00',
            timeRangeEnd: '23:59',
            valueField: 'responseText',
            requirePhoto: true,
            frequencyPeriod: 'day'
          },
          notificationFrequency: workflow.notificationFrequency || 'daily'
        }}
        onSettingsUpdate={() => {
          // Refresh workflow data when settings are updated
          const fetchWorkflow = async () => {
            try {
              const res = await api.get(`/api/workflows/${id}`);
              setWorkflow(res.data);
            } catch (err) {
              console.error('Error refreshing workflow data:', err);
            }
          };
          fetchWorkflow();
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            <div className="p-4 flex items-start">
              <div className="flex-shrink-0 mr-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Workflow created</p>
                <p className="text-xs text-gray-500">
                  {new Date(workflow.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {workflow.createdAt !== workflow.updatedAt && (
              <div className="p-4 flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Workflow updated</p>
                  <p className="text-xs text-gray-500">
                    {new Date(workflow.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Workflow"
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
                Deleting this workflow cannot be undone. All associated inspection templates will be removed.
              </p>
            </div>
          </div>
          
          <p className="text-gray-700">
            Are you sure you want to delete <strong>"{workflow.name}"</strong>?
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isLoading}
            >
              Delete Workflow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowDetailPage;