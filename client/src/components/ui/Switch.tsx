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
  const id = React.useMemo(() => `switch-${Math.random().toString(36).substring(7)}`, []);
  
  const handleChange = React.useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      console.log('Switch clicked - Current state:', checked, 'New state:', !checked);
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
          console.log('Switch activated via keyboard - Current state:', checked, 'New state:', !checked);
          handleChange(e);
        }
      }}
    >
      <input
        type="checkbox"
        name="toggle"
        id={id}
        className="sr-only"
        checked={checked}
        onChange={() => {}} // Empty function to prevent conflicts
        disabled={disabled}
        tabIndex={-1} // Remove from tab order since parent div handles it
      />
      <label
        htmlFor={id}
        className={`block overflow-hidden h-6 rounded-full pointer-events-none transition-colors duration-200 ease-in-out ${
          disabled ? 'bg-gray-300' : checked ? 'bg-blue-600' : 'bg-gray-200'
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