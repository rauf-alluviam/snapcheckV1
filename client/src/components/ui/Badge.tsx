import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {  const getVariantClasses = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-primary text-white shadow-sm';
      case 'secondary':
        return 'bg-gradient-secondary text-white shadow-sm';
      case 'success':
        return 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-sm';
      case 'danger':
        return 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-sm';
      case 'gray':
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      case 'md':
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getVariantClasses()} ${getSizeClasses()} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;