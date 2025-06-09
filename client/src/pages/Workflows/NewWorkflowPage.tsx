import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CategorySelect from '../../components/ui/CategorySelect';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, MoveUp, MoveDown, Info } from 'lucide-react';
import api from '../../utils/api';

interface Step {
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

const NewWorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const { 
    register, 
    handleSubmit, 
    control,
    watch,
    setValue,
    formState: { errors } 
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
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit the workflow to the API
      const response = await api.post('/api/workflows', data);
      console.log('Workflow created:', response.data);
      
      // Navigate to the new workflow's detail page
      navigate(`/workflows/${response.data._id}`);
    } catch (err: any) {
      console.error('Error creating workflow:', err);
      setError(err.response?.data?.message || 'Failed to create workflow. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  if (!isAdmin) {
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
            You don't have permission to create workflows. This feature is only available to administrators.
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Workflow</h1>
      </div>
      
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
                  onClick={() => navigate('/workflows')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  Create Workflow
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default NewWorkflowPage;