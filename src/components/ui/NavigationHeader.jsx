import React, { useState } from 'react';
import Icon from '../AppIcon';
import ProfileSwitcher from './ProfileSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NavigationHeader = ({ 
  currentProfile = null, 
  profiles = [], 
  onProfileChange = () => {}, 
  onSearch = () => {},
  onUserMenuClick = () => {},
  onAddProfile = () => {},
  className = ""
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery?.trim()) {
      onSearch(searchQuery);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  const handleSwitchProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/profile-selection-screen');
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    window.location.reload();
  };

  // Get avatar from Google OAuth or fallback
  const avatarUrl = user?.user_metadata?.avatar_url || userProfile?.avatar || null;
  const email = user?.email || userProfile?.email || '';

  return (
    <header className={`fixed top-0 left-0 right-0 z-300 bg-background border-b border-border ${className}`}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Icon name="DollarSign" size={20} color="white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">FinTrackr</h1>
            </div>
          </div>
        </div>
        {/* Search Section - Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative">
              <Icon 
                name="Search" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <input
                type="text"
                placeholder="Search expenses, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
              />
            </div>
          </form>
        </div>
        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Search Toggle - Mobile */}
          <button
            onClick={handleSearchToggle}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all duration-150"
          >
            <Icon name="Search" size={20} />
          </button>
          {/* Profile Switcher */}
          <ProfileSwitcher
            currentProfile={currentProfile}
            profiles={profiles}
            onProfileChange={onProfileChange}
            onAddProfile={onAddProfile}
          />
          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all duration-150 flex items-center"
            >
              <Icon name="Settings" size={20} />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-modal z-400 animate-slide-in">
                <div className="flex items-center space-x-3 p-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Icon name="User" size={24} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-popover-foreground">{email}</div>
                    <div className="text-xs text-muted-foreground">Signed in</div>
                  </div>
                </div>
                <button
                  onClick={handleSwitchProfile}
                  className="w-full flex items-center justify-center space-x-2 py-3 text-sm text-muted-foreground hover:text-muted-foreground transition-colors duration-150"
                >
                  <Icon name="User" size={16} />
                  <span>Switch Profile</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 py-3 text-sm text-error hover:text-error-foreground transition-colors duration-150"
                >
                  <Icon name="LogOut" size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="md:hidden bg-card border-t border-border p-4 animate-slide-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <Icon 
                name="Search" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <input
                type="text"
                placeholder="Search expenses, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSearchToggle}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

export default NavigationHeader;