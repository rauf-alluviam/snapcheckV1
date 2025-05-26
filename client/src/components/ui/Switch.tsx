import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  className = '',
  disabled = false
}) => {
  // Generate a unique ID for this switch instance
  const id = React.useMemo(() => `switch-${Math.random().toString(36).substring(7)}`, []);
  
  const handleChange = React.useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);
  
  return (
    <div 
      className={`relative inline-block w-10 align-middle select-none ${className} ${disabled ? 'opacity-60' : ''}`} 
      onClick={handleChange}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleChange();
        }
      }}
    >
      <input
        type="checkbox"
        name="toggle"
        id={id}
        className="sr-only"
        checked={checked}
        onChange={handleChange}  // Add real handler for proper accessibility
        disabled={disabled}
      />
      <label
        htmlFor={id}
        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
          disabled ? 'bg-gray-300 cursor-not-allowed' : checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`block h-4 w-4 ml-1 mt-1 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </label>
    </div>
  );
};

export default Switch;
