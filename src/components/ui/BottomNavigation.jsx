import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomNavigation = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard-screen',
      icon: 'LayoutDashboard',
      badge: null
    },
    {
      label: 'Add Expense',
      path: '/expense-entry-screen',
      icon: 'Plus',
      badge: null
    },
    {
      label: 'History',
      path: '/expense-history-screen',
      icon: 'History',
      badge: null
    },
    {
      label: 'Budget',
      path: '/budget-management-screen',
      icon: 'Target',
      badge: null
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location?.pathname === path;
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-100 bg-card border-t border-border ${className}`}>
        <div className="flex items-center justify-around px-4 py-2">
          {navigationItems?.map((item) => {
            const active = isActive(item?.path);
            
            return (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-150 min-w-0 flex-1 ${
                  active 
                    ? 'text-accent bg-accent/10' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="relative">
                  <Icon 
                    name={item?.icon} 
                    size={20} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {item?.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center">
                      {item?.badge}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium truncate ${active ? 'text-accent' : ''}`}>
                  {item?.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      {/* Desktop Top Navigation */}
      <nav className={`hidden md:block fixed top-16 left-0 right-0 z-100 bg-background border-b border-border ${className}`}>
        <div className="flex items-center justify-center px-6 py-3">
          <div className="flex items-center space-x-1 bg-card rounded-lg p-1">
            {navigationItems?.map((item) => {
              const active = isActive(item?.path);
              
              return (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-150 ${
                    active 
                      ? 'text-accent bg-accent/10 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="relative">
                    <Icon 
                      name={item?.icon} 
                      size={18} 
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {item?.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center">
                        {item?.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-accent' : ''}`}>
                    {item?.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNavigation;