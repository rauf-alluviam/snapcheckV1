import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  validationErrors?: string[];
  showValidation?: boolean;
  helpText?: string;
  required?: boolean;
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    label, 
    error, 
    validationErrors = [], 
    showValidation = false, 
    helpText, 
    required, 
    className, 
    ...props 
  }, ref) => {
    const hasError = !!(error || (validationErrors && validationErrors.length > 0));
    const allErrors = error ? [error, ...validationErrors] : validationErrors;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm 
              placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors
              ${hasError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              ${className || ''}
            `}
            {...props}
          />
          
          {hasError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>

        {/* Help text */}
        {helpText && !hasError && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}

        {/* Error messages */}
        {hasError && (
          <div className="space-y-1">
            {allErrors.map((errorMsg, index) => (
              <p key={index} className="text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{errorMsg}</span>
              </p>
            ))}
          </div>
        )}

        {/* Validation feedback for valid inputs */}
        {showValidation && !hasError && props.value && (
          <p className="text-xs text-green-600">✓ Valid</p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;
