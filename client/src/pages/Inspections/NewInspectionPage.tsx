import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import MultiSelect from '../../components/ui/MultiSelect';
import Switch from '../../components/ui/Switch';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import FileUpload from '../../components/ui/FileUpload';
import { inspectionSchemas } from '../../validation/schemas';
import { useValidation } from '../../validation/hooks';
import { handleApiValidationErrors, getErrorMessage } from '../../validation/utils';
import ValidatedInput from '../../components/ui/ValidatedInput';
import { getCurrentDateString, toISODateTime } from '../../utils/dateUtils';

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
  }[];  isRoutineInspection?: boolean;
  autoApprovalEnabled?: boolean;
}

interface FormValues {
  workflowId: string;
  approverId: string; // Main approver (for backward compatibility)
  approverIds: string[]; // Multiple approvers
  inspectionDate: string;
  autoApprove: boolean; // For daily inspections that can be auto-approved
  steps: {
    stepId: string;
    responseText: string;
    mediaUrls: string[];
  }[];
}

const NewInspectionPage: React.FC = () => {  
  const navigate = useNavigate();
  useAuth(); // Keep the auth context connection even if we don't use the state directly
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [approvers, setApprovers] = useState<{ value: string; label: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Use validation for inspection creation
  const validation = useValidation(inspectionSchemas.create);

  // Fetch available workflows and approvers
  useEffect(() => {
    const fetchData = async () => {      try {
        setLoading(true);
        const [workflowsResponse, approversResponse] = await Promise.all([
          api.get('/api/workflows'),
          api.get('/api/users/approvers')
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
        setErrorMessage('Failed to load required data');
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
    formState: { errors }   } = useForm<FormValues>({
    defaultValues: {
      inspectionDate: getCurrentDateString(),
      steps: [],
      approverIds: [],
      autoApprove: false // Default to false
    }
  });
  
  const { fields, replace } = useFieldArray({
    control,
    name: 'steps'
  });
  
  const watchedWorkflowId = watch('workflowId');  // Update steps when workflow changes
  useEffect(() => {
    console.log('Effect triggered:', { 
      watchedWorkflowId, 
      workflowsCount: workflows.length,
      selectedWorkflow: selectedWorkflow?.name 
    });
    
    if (watchedWorkflowId && workflows.length > 0) {
      const workflow = workflows.find(w => w._id === watchedWorkflowId);
      console.log('Found workflow:', workflow);
      
      if (workflow) {
        console.log('Workflow steps:', workflow.steps);
        setSelectedWorkflow(workflow);
        
        if (workflow.steps && Array.isArray(workflow.steps) && workflow.steps.length > 0) {
          const stepsFields = workflow.steps.map(step => ({
            stepId: step._id,
            responseText: '',
            mediaUrls: []
          }));
          
          console.log('Replacing fields with:', stepsFields);
          replace(stepsFields);
        } else {
          console.warn('Workflow has no valid steps:', workflow.steps);
          replace([]);
        }
      } else {
        console.warn('Workflow not found for ID:', watchedWorkflowId);
        setSelectedWorkflow(null);
        replace([]);
      }
    } else {
      console.log('Conditions not met:', { 
        hasWorkflowId: !!watchedWorkflowId, 
        workflowsLoaded: workflows.length > 0 
      });
      setSelectedWorkflow(null);
      replace([]);
    }
  }, [watchedWorkflowId, replace, workflows]);
  
  // Debug effect to log fields changes
  useEffect(() => {
    console.log('Fields array updated:', fields);
    console.log('Selected workflow:', selectedWorkflow);
  }, [fields, selectedWorkflow]);
  
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
    const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmissionSuccess(null);
    setErrorMessage(null);
      try {
      console.log('Submitting inspection with data:', data);
      
      // Validate all required fields
      if (!data.workflowId || !data.approverId || !data.inspectionDate) {
        throw new Error('All inspection details are required');
      }
      
      // Create combined list of approvers without duplicates
      const allApproverIds = new Set([data.approverId, ...(data.approverIds || [])]);
      const uniqueApproverIds = Array.from(allApproverIds);
      
      // Validate steps data
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error('No workflow steps found');
      }
      
      // Check if media is uploaded for required steps
      if (selectedWorkflow) {
        const mediaRequiredSteps = selectedWorkflow.steps.filter(step => step.mediaRequired);
        
        for (const requiredStep of mediaRequiredSteps) {
          const filledStep = data.steps.find(s => s.stepId === requiredStep._id);
          if (!filledStep || !filledStep.mediaUrls || filledStep.mediaUrls.length === 0) {
            throw new Error(`Media is required for step: ${requiredStep.title}`);
          }
        }
      }
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');      // Prepare the inspection data for both validation and API submission
      const inspectionData = {
        workflowId: data.workflowId,
        approverId: data.approverId, // Primary approver (for backward compatibility)
        approverIds: uniqueApproverIds, // All approvers including the primary one
        inspectionDate: toISODateTime(data.inspectionDate), // Convert to consistent ISO format
        filledSteps: data.steps.map(step => {
          // Find the corresponding step in the workflow to get its title
          const workflowStep = selectedWorkflow?.steps.find(ws => ws._id === step.stepId);
          return {
            stepId: step.stepId,
            stepTitle: workflowStep?.title || 'Unknown Step', // Add the required stepTitle field
            responseText: step.responseText || '',
            mediaUrls: step.mediaUrls || [], // Ensure mediaUrls is always an array
            timestamp: new Date().toISOString() // Add timestamp
          };
        }),
        autoApprove: data.autoApprove // Include autoApprove field for daily inspections
      };
      
      // Validate with our schema
      const validationResult = validation.validate(inspectionData);
      if (!validationResult.success) {
        setErrorMessage('Please check the form for validation errors');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Sending inspection data:', JSON.stringify(inspectionData));
      
      // Submit using centralized API configuration for better URL handling
      const { buildApiUrl } = await import('../../utils/apiConfig');
      const response = await fetch(buildApiUrl('/inspections'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inspectionData)
      });
      
      // Check for error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server returned error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        throw new Error(
          errorData.message || 
          `Server error: ${response.status} ${response.statusText}`
        );
      }
      
      const responseData = await response.json();
      console.log('Inspection submitted successfully:', responseData);
        // Check if the inspection was auto-approved
      if (responseData.autoApproved) {
        setSubmissionSuccess('Inspection was submitted and automatically approved!');
      } else {
        setSubmissionSuccess('Inspection was submitted successfully!');
      }
        // Navigate after a short delay to allow the user to see the success message
      setTimeout(() => {
        navigate('/inspections');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error submitting inspection:', error);
      
      // Handle validation errors from API
      const hasValidationErrors = handleApiValidationErrors(error, (field: string, message: string) => {
        validation.setFieldError(field, message);
      });
      
      if (!hasValidationErrors) {
        const errorMessage = getErrorMessage(error);
        setErrorMessage(errorMessage);
      }
      
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">New Inspection</h1>
      </div>
      
      {submissionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {submissionSuccess}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
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
                      label="Primary Approver"
                      options={approvers}
                      {...register('approverId', { required: 'Primary approver is required' })}
                      error={errors.approverId?.message}
                    />
                    
                    <div>
                      <MultiSelect
                        label="Additional Approvers (Optional)"
                        helperText="Hold Ctrl/Cmd key to select multiple approvers. Both AppRiver admin and selected approvers can approve the inspection."
                        options={approvers}
                        {...register('approverIds')}
                      />
                    </div>
                      <ValidatedInput
                      label="Inspection Date"
                      type="date"
                      {...register('inspectionDate', { required: 'Date is required' })}
                      error={errors.inspectionDate?.message}
                      validationErrors={validation.errors.inspectionDate ? [validation.errors.inspectionDate] : []}
                      showValidation={!validation.errors.inspectionDate}
                    />

                    {selectedWorkflow?.isRoutineInspection && (
                      <div className="md:col-span-2 mt-2">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Enable Auto-Approval</label>
                            <p className="text-xs text-gray-500 mt-1">
                              This is a daily inspection that can be automatically approved without manual review.
                            </p>
                          </div>
                          <Switch 
                            checked={watch('autoApprove')} 
                            onChange={(checked) => setValue('autoApprove', checked)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>          {selectedWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Steps</CardTitle>
                <p className="text-sm text-gray-500">{selectedWorkflow.description}</p>
              </CardHeader>              <CardContent className="p-0">
                {fields.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No workflow steps to display</p>
                    <div className="mt-2 text-sm">
                      <p>Selected workflow: {selectedWorkflow?.name || 'None'}</p>
                      <p>Workflow has {selectedWorkflow?.steps?.length || 0} steps</p>
                      <p>Form fields count: {fields.length}</p>
                      <p>Debug: {JSON.stringify({ 
                        hasWorkflow: !!selectedWorkflow, 
                        stepsCount: selectedWorkflow?.steps?.length,
                        fieldsCount: fields.length 
                      })}</p>
                    </div>
                  </div>
                ) : (
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
                                      setErrorMessage('Failed to upload files. Please try again.');
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
                                {/* <Button
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
                                          // Use the centralized upload function for consistency
                                          const { uploadFiles } = await import('../../utils/apiConfig');
                                          const urls = await uploadFiles([files[0]]);
                                          
                                          console.log('Camera upload successful:', { urls });
                                          setValue(`steps.${index}.mediaUrls`, urls);
                                        } catch (error) {
                                          console.error('Camera upload failed:', error);
                                          setErrorMessage('Failed to upload camera image');
                                        }
                                      }
                                    };
                                    
                                    fileInput.click();
                                  }}
                                >
                                  Camera
                                </Button> */}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>                    );
                  })}
                  </div>
                )}
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