import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { Camera } from 'lucide-react';
import api from '../../utils/api';
import FileUpload from '../../components/ui/FileUpload';

interface User {
  _id: string;
  name: string;
}

interface Workflow {
  _id: string;
  name: string;
  category: string;
  description: string;
  steps: {
    _id: string;
    title: string;
    instructions: string;
    mediaRequired: boolean;
  }[];
}

interface FormValues {
  workflowId: string;
  approverId: string;
  inspectionDate: string;
  steps: {
    stepId: string;
    responseText: string;
    mediaUrls: string[];
  }[];
}

const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [approvers, setApprovers] = useState<{ value: string; label: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available workflows and approvers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [workflowsResponse, approversResponse] = await Promise.all([
          api.get('/api/workflows'),
          api.get('/api/users', { params: { role: 'approver' } })
        ]);

        if (Array.isArray(workflowsResponse.data)) {
          setWorkflows(workflowsResponse.data);
        } else {
          console.error('Invalid workflow data format:', workflowsResponse.data);
          setWorkflows([]);
        }

        // Transform approvers data into select options
        if (Array.isArray(approversResponse.data)) {
          setApprovers(
            approversResponse.data.map((approver: User) => ({
              value: approver._id,
              label: approver.name
            }))
          );
        } else {
          console.error('Invalid approvers data format:', approversResponse.data);
          setApprovers([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const { 
    register, 
    handleSubmit, 
    control,
    watch,
    setValue,
    formState: { errors } 
  } = useForm<FormValues>({
    defaultValues: {
      inspectionDate: new Date().toISOString().split('T')[0],
      steps: []
    }
  });
  
  const { fields, replace } = useFieldArray({
    control,
    name: 'steps'
  });
  
  const watchedWorkflowId = watch('workflowId');
  
  // Update steps when workflow changes
  useEffect(() => {
    if (watchedWorkflowId) {
      const workflow = workflows.find(w => w._id === watchedWorkflowId);
      setSelectedWorkflow(workflow || null);
      
      if (workflow) {
        const stepsFields = workflow.steps.map(step => ({
          stepId: step._id,
          responseText: '',
          mediaUrls: []
        }));
        
        replace(stepsFields);
      }
    }
  }, [watchedWorkflowId, replace, workflows]);
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting inspection with data:', data);
      
      // Submit the inspection with the uploaded file URLs
      const response = await api.post('/api/inspections', {
        workflowId: data.workflowId,
        approverId: data.approverId,
        inspectionDate: data.inspectionDate,
        steps: data.steps.map(step => ({
          stepId: step.stepId,
          responseText: step.responseText,
          mediaUrls: step.mediaUrls
        }))
      });
      
      console.log('Inspection submitted successfully:', response.data);
      navigate('/inspections');
    } catch (error) {
      console.error('Error submitting inspection:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit inspection');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">New Inspection</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    <Select
                      label="Workflow Template"
                      options={workflows.map(w => ({ value: w._id, label: w.name }))}
                      {...register('workflowId', { required: 'Workflow is required' })}
                      error={errors.workflowId?.message}
                    />
                    
                    <Select
                      label="Approver"
                      options={approvers}
                      {...register('approverId', { required: 'Approver is required' })}
                      error={errors.approverId?.message}
                    />
                    
                    <Input
                      label="Inspection Date"
                      type="date"
                      {...register('inspectionDate', { required: 'Date is required' })}
                      error={errors.inspectionDate?.message}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {selectedWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Steps</CardTitle>
                <p className="text-sm text-gray-500">{selectedWorkflow.description}</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {fields.map((field, index) => {
                    const step = selectedWorkflow.steps.find(s => s._id === field.stepId);
                    if (!step) return null;
                    
                    return (
                      <div key={field.id} className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {index + 1}. {step.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{step.instructions}</p>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Response
                            </label>
                            <textarea
                              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Enter your response..."
                              {...register(`steps.${index}.responseText`, { 
                                required: 'Response is required'
                              })}
                            ></textarea>
                            {errors.steps?.[index]?.responseText && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.steps[index]?.responseText?.message}
                              </p>
                            )}
                          </div>
                          
                          {step.mediaRequired && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Media Attachments {step.mediaRequired && <span className="text-red-500">*</span>}
                              </label>
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <FileUpload
                                    onUploadComplete={(urls) => {
                                      console.log(`Files uploaded for step ${index}:`, urls);
                                      setValue(`steps.${index}.mediaUrls`, urls);
                                    }}
                                    onError={(error) => {
                                      console.error(`Upload error for step ${index}:`, error);
                                      setError('Failed to upload files. Please try again.');
                                    }}
                                    maxFiles={5}
                                    acceptedFileTypes={['image/*', 'video/*']}
                                    className="w-full"
                                  />
                                  {errors.steps?.[index]?.mediaUrls && (
                                    <p className="mt-1 text-sm text-red-600">
                                      {errors.steps[index]?.mediaUrls?.message}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Camera size={16} />}
                                  onClick={() => {
                                    const fileInput = document.createElement('input');
                                    fileInput.type = 'file';
                                    fileInput.accept = 'image/*';
                                    fileInput.setAttribute('capture', 'environment');
                                    fileInput.multiple = false;
                                    
                                    fileInput.onchange = async (e: Event) => {
                                      const target = e.target as HTMLInputElement;
                                      const files = target.files;
                                      if (files && files.length > 0) {
                                        const formData = new FormData();
                                        formData.append('media', files[0]);
                                        
                                        try {
                                          const token = localStorage.getItem('token');
                                          if (!token) throw new Error('No auth token');
                                          
                                          const response = await fetch('http://localhost:5000/api/media/upload', {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            },
                                            body: formData
                                          });
                                          
                                          if (!response.ok) throw new Error('Upload failed');
                                          
                                          const data = await response.json();
                                          console.log('Camera upload successful:', data);
                                          setValue(`steps.${index}.mediaUrls`, data.urls);
                                        } catch (error) {
                                          console.error('Camera upload failed:', error);
                                          setError('Failed to upload camera image');
                                        }
                                      }
                                    };
                                    
                                    fileInput.click();
                                  }}
                                >
                                  Camera
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/inspections')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    Submit Inspection
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewInspectionPage;