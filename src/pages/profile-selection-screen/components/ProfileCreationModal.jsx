import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProfileCreationModal = ({ isOpen, onClose, onCreateProfile }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    type: 'personal',
    isShared: false,
    shareSettings: {
      allowView: true,
      allowEdit: false,
      allowDelete: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const profileTypes = [
    {
      type: 'personal',
      name: 'Personal',
      description: 'Track your personal daily expenses',
      icon: 'User',
      color: 'bg-blue-500',
      canShare: false
    },
    {
      type: 'family',
      name: 'Family',
      description: 'Manage household and family expenses',
      icon: 'Users',
      color: 'bg-green-500',
      canShare: true
    },
    {
      type: 'business',
      name: 'Business',
      description: 'Track business and work-related costs',
      icon: 'Briefcase',
      color: 'bg-purple-500',
      canShare: false
    },
    {
      type: 'split_expense',
      name: 'Split Expense',
      description: 'Split bills and expenses with friends',
      icon: 'Split',
      color: 'bg-orange-500',
      canShare: true
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData?.name?.trim()) {
      newErrors.name = 'Profile name is required';
    } else if (profileData?.name?.trim()?.length < 2) {
      newErrors.name = 'Profile name must be at least 2 characters';
    }
    
    if (!profileData?.type) {
      newErrors.type = 'Please select a profile type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const selectedType = profileTypes.find(t => t.type === profileData.type);
      const isShared = selectedType?.canShare && profileData.isShared;
      
      await onCreateProfile({
        name: profileData?.name?.trim(),
        type: profileData?.type,
        isShared,
        shareSettings: isShared ? profileData.shareSettings : null
      });
      
      // Reset form
      setProfileData({ 
        name: '', 
        type: 'personal', 
        isShared: false,
        shareSettings: {
          allowView: true,
          allowEdit: false,
          allowDelete: false
        }
      });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to create profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleShareSettingChange = (setting, value) => {
    setProfileData(prev => ({
      ...prev,
      shareSettings: {
        ...prev.shareSettings,
        [setting]: value
      }
    }));
  };

  const selectedType = profileTypes.find(t => t.type === profileData.type);
  const canShare = selectedType?.canShare;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-card-foreground">
            Create New Profile
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Form - Make scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Profile Name - Always visible at top */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Profile Name *
            </label>
            <input
              type="text"
              value={profileData?.name}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              placeholder="e.g., Personal Expenses, Family Budget"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors"
              disabled={isLoading}
            />
            {errors?.name && (
              <p className="text-sm text-error">{errors?.name}</p>
            )}
          </div>

          {/* Profile Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-card-foreground">
              Profile Type *
            </label>
            <div className="grid gap-3">
              {profileTypes?.map((type) => (
                <label
                  key={type?.type}
                  className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                    profileData?.type === type?.type
                      ? 'border-accent bg-accent/5' :'border-border hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="profileType"
                    value={type?.type}
                    checked={profileData?.type === type?.type}
                    onChange={(e) => handleInputChange('type', e?.target?.value)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type?.color} mr-3`}>
                    <Icon name={type?.icon} size={20} color="white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground">
                      {type?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {type?.description}
                    </div>
                    {type?.canShare && (
                      <div className="text-xs text-accent mt-1">
                        Can be shared with others
                      </div>
                    )}
                  </div>
                  {profileData?.type === type?.type && (
                    <Icon name="Check" size={20} className="text-accent" />
                  )}
                </label>
              ))}
            </div>
            {errors?.type && (
              <p className="text-sm text-error">{errors?.type}</p>
            )}
          </div>

          {/* Sharing Options - Only show for shareable profile types */}
          {canShare && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="shareProfile"
                  checked={profileData.isShared}
                  onChange={(e) => handleInputChange('isShared', e.target.checked)}
                  className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="shareProfile" className="text-sm font-medium text-card-foreground">
                  Make this profile shareable
                </label>
              </div>
              
              {profileData.isShared && (
                <div className="space-y-3 pl-7">
                  <div className="text-sm text-muted-foreground">
                    Choose what shared members can do:
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profileData.shareSettings.allowView}
                        onChange={(e) => handleShareSettingChange('allowView', e.target.checked)}
                        className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-card-foreground">View expenses and budgets</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profileData.shareSettings.allowEdit}
                        onChange={(e) => handleShareSettingChange('allowEdit', e.target.checked)}
                        className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-card-foreground">Add and edit expenses</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profileData.shareSettings.allowDelete}
                        onChange={(e) => handleShareSettingChange('allowDelete', e.target.checked)}
                        className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-card-foreground">Delete expenses</span>
                    </label>
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
                    <Icon name="Info" size={14} className="inline mr-1" />
                    You'll get a share link to invite others. They'll need to create an account to join.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors?.submit && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{errors?.submit}</p>
            </div>
          )}
        </form>

        {/* Actions - Fixed at bottom */}
        <div className="p-6 border-t border-border flex-shrink-0">
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={!profileData?.name?.trim() || !profileData?.type}
              className="flex-1"
              onClick={handleSubmit}
            >
              Create Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreationModal;