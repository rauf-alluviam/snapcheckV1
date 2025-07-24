import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationMessageProps {
  // Support for array of errors (original format)
  errors?: string[];
  showSuccess?: boolean;
  successMessage?: string;
  // Support for single message with type (new format)
  type?: 'error' | 'success' | 'warning';
  message?: string;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({ 
  errors = [],
  showSuccess = false, 
  successMessage = 'Valid',
  type,
  message
}) => {
  // Handle single message format (type + message)
  if (type && message) {
    const isError = type === 'error';
    const isSuccess = type === 'success';
    const isWarning = type === 'warning';
    
    return (
      <div className={`flex items-center space-x-2 text-sm mt-1 ${
        isError ? 'text-red-600' : 
        isSuccess ? 'text-green-600' : 
        'text-yellow-600'
      }`}>
        {isError && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
        {isSuccess && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
        {isWarning && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
        <span>{message}</span>
      </div>
    );
  }

  // Handle array format (original)
  if (errors.length === 0 && !showSuccess) {
    return null;
  }

  if (errors.length === 0 && showSuccess) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm mt-1">
        <CheckCircle className="h-4 w-4" />
        <span>{successMessage}</span>
      </div>
    );
  }

  return (
    <div className="mt-1">
      {errors.map((error, index) => (
        <div key={index} className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ))}
    </div>
  );
};

export default ValidationMessage;
