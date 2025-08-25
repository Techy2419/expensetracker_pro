import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import ProfileSharingModal from '../../../components/ui/ProfileSharingModal';

const ProfileCard = ({ 
  profile, 
  isSelected = false, 
  onClick = () => {},
  className = ""
}) => {
  const [showSharingModal, setShowSharingModal] = useState(false);

  const getProfileIcon = (type) => {
    switch (type) {
      case 'family':
        return 'Users';
      case 'business':
        return 'Building2';
      case 'split_expense':
        return 'SplitSquareHorizontal';
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
      case 'split_expense':
        return 'bg-orange-600';
      default:
        return 'bg-accent';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleShareClick = (e) => {
    e.stopPropagation(); // Prevent profile selection
    setShowSharingModal(true);
  };

  const handleCopyShareCode = (e) => {
    e.stopPropagation(); // Prevent profile selection
    if (profile?.share_code) {
      const shareUrl = `${window.location.origin}/join-profile/${profile.share_code}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share link copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy link. Please copy manually: ' + shareUrl);
      });
    }
  };

  const isSharedProfile = profile?.is_shared || profile?.type === 'family' || profile?.type === 'split_expense';

  return (
    <>
      <button
        onClick={() => onClick(profile)}
        className={`
          w-full p-6 bg-card border border-border rounded-lg 
          hover:bg-card/80 hover:border-accent/30 
          transition-all duration-200 text-left group relative
          ${isSelected ? 'ring-2 ring-accent border-accent' : ''}
          ${className}
        `}
      >
        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 ${getProfileColor(profile?.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon 
              name={getProfileIcon(profile?.type)} 
              size={24} 
              color="white" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors duration-200">
              {profile?.name}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground capitalize">
                {profile?.type} Profile
              </p>
              {isSharedProfile && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Shared
                </span>
              )}
            </div>
          </div>
          {isSelected && (
            <Icon 
              name="Check" 
              size={20} 
              className="text-accent flex-shrink-0" 
            />
          )}
        </div>

        {/* Share Code Display for Shared Profiles */}
        {isSharedProfile && profile?.share_code && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Share Code</span>
                          <div
              onClick={handleCopyShareCode}
              className="text-xs text-accent hover:text-accent/80 transition-colors cursor-pointer"
            >
              Copy Link
            </div>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-background px-2 py-1 rounded border font-mono text-card-foreground">
                {profile.share_code}
              </code>
            </div>
          </div>
        )}

        {/* Profile Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="text-lg font-mono font-semibold text-accent">
              {formatCurrency(profile?.balance)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">This Month</span>
            <span className="text-sm font-mono text-card-foreground">
              {formatCurrency(profile?.monthlySpent)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Activity</span>
            <span className="text-sm text-card-foreground">
              {formatDate(profile?.lastActivity)}
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Icon 
              name="Clock" 
              size={14} 
              className="text-muted-foreground flex-shrink-0" 
            />
            <span className="text-xs text-muted-foreground truncate">
              {profile?.recentActivity}
            </span>
          </div>
        </div>

        {/* Action Buttons for Shared Profiles */}
        {isSharedProfile && (
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={handleShareClick}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm"
            >
              <Icon name="Users" size={16} />
              <span>Manage Sharing</span>
            </button>
          </div>
        )}

        {/* Selection Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
            isSelected ? 'bg-accent' : 'bg-muted-foreground/30'
          }`} />
        </div>
      </button>

      {/* Sharing Modal */}
      {showSharingModal && (
        <ProfileSharingModal
          isOpen={showSharingModal}
          profile={profile}
          onClose={() => setShowSharingModal(false)}
          onUpdate={() => {
            // Refresh profile data if needed
            setShowSharingModal(false);
          }}
        />
      )}
    </>
  );
};

export default ProfileCard;