import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import ProfileSharingModal from '../../../components/ui/ProfileSharingModal';
import { profileSharingService } from '../../../services/profileSharingService';
import { useToast } from '../../../contexts/ToastContext';

const ProfileCard = ({ 
  profile, 
  isSelected = false, 
  onClick = () => {},
  onUpdate = () => {},
  className = ""
}) => {
  const [showSharingModal, setShowSharingModal] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

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

  const handleCopyShareCode = async (e) => {
    e.stopPropagation(); // Prevent profile selection
    if (profile?.share_code) {
      try {
        await navigator.clipboard.writeText(profile.share_code);
        showSuccess('Share code copied to clipboard!');
      } catch (error) {
        showError('Failed to copy code. Please copy manually: ' + profile.share_code);
      }
    }
  };

  const handleGenerateNewCode = async (e) => {
    e.stopPropagation(); // Prevent profile selection
    if (!profile?.is_owner) return;
    
    try {
      const { data, error } = await profileSharingService.generateNewShareCode(profile.id);
      if (error) {
        showError('Failed to generate new code: ' + error);
        return;
      }
      
      // Update the profile data with new share code
      profile.share_code = data.share_code;
      
      // Show success toast
      showSuccess(`New share code generated: ${data.share_code}`);
      
      // Trigger parent update to refresh the UI without page reload
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      showError('Failed to generate new code: ' + error.message);
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
              {!profile?.is_owner && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Member)
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground capitalize">
                {profile?.type} Profile
              </p>
              {isSharedProfile && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {profile?.is_owner ? 'Shared' : 'Joined'}
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
              <span className="text-xs font-medium text-muted-foreground">Quick Share Code (6 digits)</span>
              <div className="flex items-center space-x-2">
                <div
                  onClick={handleCopyShareCode}
                  className="text-xs text-accent hover:text-accent/80 transition-colors cursor-pointer"
                >
                  Copy Code
                </div>
                {profile?.is_owner && (
                  <div
                    onClick={handleGenerateNewCode}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Generate New
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-sm bg-background px-3 py-2 rounded border font-mono text-card-foreground font-bold tracking-wider">
                {profile.share_code}
              </code>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Share this code with others to let them join instantly
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
        {isSharedProfile && profile?.is_owner && (
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
        
        {/* Show different action for joined profiles */}
        {isSharedProfile && !profile?.is_owner && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-muted text-muted-foreground rounded-lg text-sm font-medium">
              <Icon name="CheckCircle" size={16} />
              <span>Member Access</span>
            </div>
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
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default ProfileCard;