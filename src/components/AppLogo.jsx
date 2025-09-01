import React from 'react';

const AppLogo = ({ 
  size = 40, 
  className = "", 
  variant = "default", // "default", "icon-only", "text-only"
  showText = true 
}) => {
  const logoSize = size;
  const iconSize = size * 0.6;
  
  // Modern gradient colors for the logo
  const primaryGradient = "from-blue-600 to-indigo-600";
  const secondaryGradient = "from-emerald-500 to-teal-500";
  const accentGradient = "from-purple-500 to-pink-500";

  if (variant === "icon-only") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          {/* Main logo icon - represents financial tracking and growth */}
          <div className={`w-${Math.round(logoSize/4)} h-${Math.round(logoSize/4)} bg-gradient-to-br ${primaryGradient} rounded-2xl shadow-lg flex items-center justify-center`}>
            {/* Chart/growth lines */}
            <svg 
              width={iconSize} 
              height={iconSize} 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-white"
            >
              {/* Base line */}
              <path 
                d="M3 21L21 21" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Growth chart line */}
              <path 
                d="M3 18L7 15L11 17L15 12L19 14L21 10" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
              />
              {/* Data points */}
              <circle cx="7" cy="15" r="1.5" fill="currentColor" />
              <circle cx="11" cy="17" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="14" r="1.5" fill="currentColor" />
              <circle cx="21" cy="10" r="1.5" fill="currentColor" />
            </svg>
          </div>
          
          {/* Floating accent element - represents financial security */}
          <div className={`absolute -top-1 -right-1 w-${Math.round(logoSize/6)} h-${Math.round(logoSize/6)} bg-gradient-to-br ${secondaryGradient} rounded-full shadow-md flex items-center justify-center`}>
            <svg 
              width={Math.round(iconSize/2)} 
              height={Math.round(iconSize/2)} 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-white"
            >
              <path 
                d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "text-only") {
    return (
      <div className={`flex items-center ${className}`}>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          FinTrackr
        </span>
      </div>
    );
  }

  // Default variant with icon and text
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        <div className={`w-${Math.round(logoSize/4)} h-${Math.round(logoSize/4)} bg-gradient-to-br ${primaryGradient} rounded-2xl shadow-lg flex items-center justify-center`}>
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-white"
          >
            {/* Base line */}
            <path 
              d="M3 21L21 21" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Growth chart line */}
            <path 
              d="M3 18L7 15L11 17L15 12L19 14L21 10" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
            {/* Data points */}
            <circle cx="7" cy="15" r="1.5" fill="currentColor" />
            <circle cx="11" cy="17" r="1.5" fill="currentColor" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" />
            <circle cx="19" cy="14" r="1.5" fill="currentColor" />
            <circle cx="21" cy="10" r="1.5" fill="currentColor" />
          </svg>
        </div>
        
        {/* Floating accent element */}
        <div className={`absolute -top-1 -right-1 w-${Math.round(logoSize/6)} h-${Math.round(logoSize/6)} bg-gradient-to-br ${secondaryGradient} rounded-full shadow-md flex items-center justify-center`}>
          <svg 
            width={Math.round(iconSize/2)} 
            height={Math.round(iconSize/2)} 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-white"
          >
            <path 
              d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* App Name */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            FinTrackr
          </span>
          <span className="text-xs text-gray-500 font-medium leading-tight">
            Smart Finance Tracking
          </span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
