import React from 'react';
import { X } from 'lucide-react';

interface NotificationProps {
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  type = 'info',
  onClose
}) => {
  const bgColors = {
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
    error: 'bg-red-50'
  };

  const borderColors = {
    success: 'border-green-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400',
    error: 'border-red-400'
  };

  const textColors = {
    success: 'text-green-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
    error: 'text-red-800'
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    error: 'text-red-600'
  };

  return (
    <div className={`rounded-md ${bgColors[type]} border ${borderColors[type]} p-4 mb-4`}>
      <div className="flex">
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${textColors[type]}`}>{title}</h3>
          <div className={`mt-2 text-sm ${textColors[type]}`}>
            <p>{message}</p>
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${bgColors[type]} ${iconColors[type]} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}-50 focus:ring-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}-600`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
