import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 4000, 
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'CheckCircle';
      case 'error':
        return 'AlertTriangle';
      case 'warning':
        return 'AlertCircle';
      case 'info':
        return 'Info';
      default:
        return 'Info';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-blue-500';
    }
  };

  const getPosition = () => {
    switch (position) {
      case 'top-right':
        return 'top-20 md:top-36 right-4';
      case 'top-left':
        return 'top-20 md:top-36 left-4';
      case 'top-center':
        return 'top-20 md:top-36 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-20 md:top-36 right-4';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed ${getPosition()} z-50 
      max-w-sm w-full
      transform transition-all duration-300 ease-in-out
      ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
    `}>
      <div className={`
        ${getColors()} 
        border rounded-lg shadow-lg p-4
        flex items-start space-x-3
      `}>
        <Icon 
          name={getIcon()} 
          size={20} 
          className={`flex-shrink-0 mt-0.5 ${getIconColor()}`} 
        />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">{message}</p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-current/70 hover:text-current transition-colors p-1 rounded"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
