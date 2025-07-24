import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CategorySelect from '../../components/ui/CategorySelect';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, MoveUp, MoveDown, Info } from 'lucide-react';
import api from '../../utils/api';
import { Workflow } from '../../types';
import { workflowSchemas } from '../../validation/schemas';
import { useValidation } from '../../validation/hooks';
import { handleApiValidationErrors, getErrorMessage } from '../../validation/utils';
import ValidationError from '../../components/ui/ValidationError';

interface Step {
  _id?: string;
  title: string;
  instructions: string;
  mediaRequired: boolean;
}

interface FormValues {
  name: string;
  category: string;
  description: string;
  steps: Step[];
}

const EditWorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [validationError, setValidationError] = useState<any>(null);
  
  // Use enhanced validation system
  const validation = useValidation(workflowSchemas.update);
  
  const { 
    register, 
    handleSubmit, 
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      category: '',
      description: '',
      steps: [{ title: '', instructions: '', mediaRequired: false }]
    }
  });
  
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps'
  });

  // Watch form values for real-time validation
  const formData = watch();

  // Real-time validation on form changes
  useEffect(() => {
    if (formData.name || formData.category || formData.description || (formData.steps && formData.steps.length > 0)) {
      validation.validate(formData);
    }
  }, [formData]);

  // Check if current user can edit this workflow
  const canEdit = isAdmin || (workflow && workflow.createdBy === user?._id);

  // Fetch workflow data
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get(`/api/workflows/${id}`);
        const workflowData = res.data;
        setWorkflow(workflowData);
        
        // Reset form with workflow data
        reset({
          name: workflowData.name,
          category: workflowData.category,
          description: workflowData.description,
          steps: workflowData.steps.map((step: any) => ({
            _id: step._id,
            title: step.title,
            instructions: step.instructions,
            mediaRequired: step.mediaRequired
          }))
        });
      } catch (err: any) {
        console.error('Error fetching workflow:', err);
        setError(err.response?.data?.message || 'Failed to load workflow. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkflow();
  }, [id, reset]);
  
  const onSubmit = async (data: FormValues) => {
    // Clear previous validation errors
    setValidationError(null);
    
    // Validate before submission
    const validationResult = validation.validate(data);
    if (!validationResult.success) {
      setValidationError(validationResult);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit the updated workflow to the API
      const response = await api.put(`/api/workflows/${id}`, data);
      console.log('Workflow updated:', response.data);
      
      // Navigate back to the workflow's detail page
      navigate(`/workflows/${id}`);
    } catch (err: any) {
      console.error('Error updating workflow:', err);
      
      // Handle validation errors from API
      const hasValidationErrors = handleApiValidationErrors(err, (field: string, message: string) => {
        validation.setFieldError(field, message);
      });
      
      if (!hasValidationErrors) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while fetching workflow
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error if workflow couldn't be loaded
  if (error && !workflow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-6">
              <Info className="h-12 w-12 text-red-600" />
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

  // Show access denied if user can't edit
  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-6">
              <Info className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 max-w-md mb-6">
            You don't have permission to edit this workflow. Only administrators and the workflow creator can make changes.
          </p>
          <Button variant="primary" onClick={() => navigate(`/workflows/${id}`)}>
            View Workflow
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Workflow</h1>
          <p className="text-sm text-gray-500 mt-1">Modify workflow details and steps</p>
        </div>
      </div>
      
      {/* Enhanced Validation Error Display */}
      {validationError && (
        <ValidationError error={validationError} />
      )}
      
      {error && !validationError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Workflow Name"
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: {
                      value: 3,
                      message: 'Name must be at least 3 characters'
                    }
                  })}
                  error={errors.name?.message}
                />
                  <CategorySelect
                  label="Category"
                  value={watch('category')}
                  onChange={(value) => setValue('category', value)}
                  error={errors.category?.message}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the purpose of this workflow..."
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Description must be at least 10 characters'
                    }
                  })}
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Workflow Steps</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => append({ title: '', instructions: '', mediaRequired: false })}
              >
                Add Step
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Step {index + 1}
                      </h3>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => index > 0 && move(index, index - 1)}
                          disabled={index === 0}
                        >
                          <MoveUp size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => index < fields.length - 1 && move(index, index + 1)}
                          disabled={index === fields.length - 1}
                        >
                          <MoveDown size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fields.length > 1 && remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Input
                        label="Step Title"
                        {...register(`steps.${index}.title`, { 
                          required: 'Step title is required'
                        })}
                        error={errors.steps?.[index]?.title?.message}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Provide detailed instructions for this step..."
                          {...register(`steps.${index}.instructions`, { 
                            required: 'Instructions are required'
                          })}
                        ></textarea>
                        {errors.steps?.[index]?.instructions && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.steps?.[index]?.instructions?.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`media-required-${index}`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register(`steps.${index}.mediaRequired`)}
                        />
                        <label htmlFor={`media-required-${index}`} className="ml-2 block text-sm text-gray-700">
                          Require photo/video evidence for this step
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/workflows/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  Update Workflow
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default EditWorkflowPage;
