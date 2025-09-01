import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import AppLogo from '../../../components/AppLogo';
import { useAuth } from '../../../contexts/AuthContext';

const ProfileHeader = ({ onLogout = () => {}, className = "" }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, userProfile, signOut } = useAuth();

  // Get avatar and email from Google OAuth or fallback
  const avatarUrl = user?.user_metadata?.avatar_url || userProfile?.avatar || null;
  const email = user?.email || userProfile?.email || '';
  const name = user?.user_metadata?.full_name || userProfile?.full_name || '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef?.current && !menuRef?.current?.contains(event?.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await signOut();
    onLogout();
    navigate('/authentication-screen');
  };

  return (
    <header className={`bg-background border-b border-border ${className}`}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <AppLogo size={32} variant="default" />
        </div>
        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-3 p-2 hover:bg-card rounded-lg transition-all duration-150 group"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center">
                  <Icon name="User" size={16} color="white" />
                </div>
              )}
            </div>
            {/* User Info - Hidden on mobile */}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-foreground">{name}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
            {/* Dropdown Arrow */}
            <Icon 
              name="ChevronDown" 
              size={16} 
              className={`text-muted-foreground group-hover:text-foreground transition-all duration-150 ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-modal z-300 animate-slide-in">
              {/* User Info Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-accent flex items-center justify-center">
                        <Icon name="User" size={18} color="white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-popover-foreground truncate">{name}</div>
                    <div className="text-xs text-muted-foreground truncate">{email}</div>
                  </div>
                </div>
              </div>
              {/* Only Sign Out Option */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-3 text-sm text-error hover:text-error-foreground transition-colors duration-150"
              >
                <Icon name="LogOut" size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;