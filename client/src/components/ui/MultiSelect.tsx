import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

const MultiSelect = forwardRef<HTMLSelectElement, MultiSelectProps>(
  ({ 
    label, 
    options, 
    error, 
    helperText, 
    className = '', 
    id, 
    size = 'md', 
    containerClassName = '', 
    ...rest 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
    
    const getSizeClass = () => {
      switch (size) {
        case 'sm': return 'py-1.5 text-xs';
        case 'lg': return 'py-3 text-base';
        default: return 'py-2 text-sm';
      }
    };
    
    const baseSelectClasses = 'block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 appearance-none bg-white pr-10 transition-colors hover:border-blue-300';
    const errorClasses = error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-gray-300';
    const sizeClass = getSizeClass();
    
    return (
      <div className={`${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`${baseSelectClasses} ${errorClasses} ${sizeClass} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-description` : undefined}
            multiple={true}
            {...rest}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <div className="text-gray-400 transition-colors group-hover:text-blue-500">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500" id={`${selectId}-description`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;
