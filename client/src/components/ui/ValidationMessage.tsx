import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationMessageProps {
  errors: string[];
  showSuccess?: boolean;
  successMessage?: string;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({ 
  errors, 
  showSuccess = false, 
  successMessage = 'Valid' 
}) => {
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
