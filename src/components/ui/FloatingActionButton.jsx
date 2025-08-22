import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const FloatingActionButton = ({ 
  onQuickExpense = null,
  className = ""
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  // Hide FAB on expense entry screen to avoid redundancy
  const shouldHide = location?.pathname === '/expense-entry-screen';

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    if (onQuickExpense) {
      // If quick expense handler is provided, use it (for modal)
      onQuickExpense();
    } else {
      // Otherwise navigate to expense entry screen
      navigate('/expense-entry-screen');
    }
  };

  if (shouldHide) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        fixed bottom-20 md:bottom-6 right-4 md:right-6 
        w-14 h-14 md:w-16 md:h-16
        bg-accent hover:bg-accent/90 
        text-accent-foreground
        rounded-full shadow-modal hover:shadow-glow
        flex items-center justify-center
        transition-all duration-150 ease-out
        z-150 group
        ${isPressed ? 'scale-95' : 'scale-100 hover:scale-105'}
        ${className}
      `}
      aria-label="Add new expense"
    >
      <Icon 
        name="Plus" 
        size={24} 
        strokeWidth={2.5}
        className={`transition-transform duration-150 ${isPressed ? 'scale-90' : 'group-hover:scale-110'}`}
      />
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-lg shadow-modal opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Add Expense
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
      </div>
    </button>
  );
};

export default FloatingActionButton;