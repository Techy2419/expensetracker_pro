import React from 'react';

const AppLogo = ({ 
  size = 40, 
  className = "", 
  variant = "default" // "default", "icon-only", "text-only"
}) => {
  // Since the logo is now properly sized and fully covered, we can use normal sizing
  const logoWidth = size * 5; // Make it wider to replace logo + text area
  const logoHeight = size;

  // Since the logo already contains the app name, we just show the logo
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <img 
          src="/logo.svg" 
          alt="MoneySync Logo" 
          width={logoWidth} 
          height={logoHeight}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default AppLogo;