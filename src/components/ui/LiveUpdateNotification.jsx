import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const LiveUpdateNotification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'CheckCircle';
      case 'error':
        return 'AlertTriangle';
      case 'warning':
        return 'AlertCircle';
      default:
        return 'Info';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-20 md:top-36 right-4 z-50 
      px-4 py-3 rounded-lg border shadow-lg
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${getColors()}
    `}>
      <div className="flex items-center space-x-3">
        <Icon name={getIcon()} size={20} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-current/70 hover:text-current transition-colors"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

export default LiveUpdateNotification;
