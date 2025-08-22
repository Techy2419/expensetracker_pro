import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const ProfileSwitcher = ({ 
  currentProfile = null, 
  profiles = [], 
  onProfileChange = () => {},
  onAddProfile = () => {},
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const profileList = profiles;
  const activeProfile = currentProfile || profileList?.[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSelect = (profile) => {
    onProfileChange(profile);
    setIsOpen(false);
  };

  const handleSwitchProfile = () => {
    setIsOpen(false);
    navigate('/profile-selection-screen');
  };

  const getProfileIcon = (type) => {
    switch (type) {
      case 'family':
        return 'Users';
      case 'business':
        return 'Building2';
      default:
        return 'User';
    }
  };
  const getProfileColor = (type) => {
    switch (type) {
      case 'family':
        return 'bg-blue-600';
      case 'business':
        return 'bg-purple-600';
      default:
        return 'bg-accent';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-card rounded-lg transition-all duration-150 group"
      >
        {/* Profile Avatar */}
        <div className={`w-8 h-8 ${getProfileColor(activeProfile?.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
          {activeProfile?.avatar ? (
            <img 
              src={activeProfile?.avatar} 
              alt={activeProfile?.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Icon 
              name={getProfileIcon(activeProfile?.type)} 
              size={16} 
              color="white" 
            />
          )}
        </div>
        {/* Profile Info - Hidden on mobile */}
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-foreground">
            {activeProfile?.name}
          </div>
        </div>
        {/* Dropdown Arrow */}
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={`text-muted-foreground group-hover:text-foreground transition-all duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-modal z-200 animate-slide-in">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium text-popover-foreground">Switch Profile</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Manage different budgets and expenses
            </p>
          </div>
          <div className="py-2">
            {profileList?.map((profile) => (
              <button
                key={profile?.id}
                onClick={() => handleProfileSelect(profile)}
                className={`w-full flex items-center space-x-3 px-3 py-3 hover:bg-card transition-all duration-150 ${
                  activeProfile?.id === profile?.id ? 'bg-card' : ''
                }`}
              >
                {/* Profile Avatar */}
                <div className={`w-10 h-10 ${getProfileColor(profile?.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {profile?.avatar ? (
                    <img 
                      src={profile?.avatar} 
                      alt={profile?.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Icon 
                      name={getProfileIcon(profile?.type)} 
                      size={18} 
                      color="white" 
                    />
                  )}
                </div>
                {/* Profile Details */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-popover-foreground">
                      {profile?.name}
                    </span>
                    {activeProfile?.id === profile?.id && (
                      <Icon name="Check" size={16} className="text-accent" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <button
              className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              onClick={() => { setIsOpen(false); onAddProfile(); }}
            >
              <Icon name="Plus" size={16} />
              <span>Add New Profile</span>
            </button>
            <button
              className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              onClick={handleSwitchProfile}
            >
              <Icon name="Users" size={16} />
              <span>Switch Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSwitcher;