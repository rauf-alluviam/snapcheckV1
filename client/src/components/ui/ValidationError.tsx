import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface ValidationErrorProps {
  error: {
    message?: string;
    summary?: string;
    errors?: Array<{
      field: string;
      message: string;
      requirements?: string;
      type?: string;
    }>;
    help?: string;
  };
  className?: string;
}

/**
 * ValidationError Component
 * 
 * Displays comprehensive validation error messages with helpful guidance
 * for users to understand what's required for each field.
 */
const ValidationError: React.FC<ValidationErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  const hasDetailedErrors = error.errors && error.errors.length > 0;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      {/* Main error message */}
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {error.summary || error.message || 'Validation Error'}
          </h3>
          
          {/* Detailed field errors */}
          {hasDetailedErrors && (
            <div className="mt-2">
              <ul className="space-y-2">
                {error.errors!.map((fieldError, index) => (
                  <li key={index} className="text-sm text-red-700">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {fieldError.field.charAt(0).toUpperCase() + fieldError.field.slice(1)}:
                      </span>
                      <span className="ml-2">{fieldError.message}</span>
                      {fieldError.requirements && (
                        <span className="ml-2 text-red-600 italic text-xs">
                          Requirements: {fieldError.requirements}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Help message */}
          {error.help && (
            <div className="mt-3 flex items-start">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="ml-2 text-sm text-blue-700">
                {error.help}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationError;
