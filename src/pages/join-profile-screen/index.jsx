import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileSharingService } from '../../services/profileSharingService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

const JoinProfileScreen = () => {
  const navigate = useNavigate();
  const { shareCode } = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualCode, setManualCode] = useState(shareCode || '');

  useEffect(() => {
    console.log('JoinProfileScreen useEffect:', { shareCode, user: !!user, authLoading });
    
    if (!authLoading && !user) {
      console.log('No user, redirecting to auth');
      navigate('/authentication-screen');
      return;
    }

    if (shareCode) {
      console.log('Loading profile with share code:', shareCode);
      loadProfileByCode(shareCode);
    }
  }, [shareCode, user, authLoading, navigate]);

  const loadProfileByCode = async (code) => {
    if (!code) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting to load profile with code:', code);
      
      // Use the profile sharing service to get profile by invitation code or share code
      const { data, error } = await profileSharingService.getProfileByCode(code);
      
      console.log('Service response:', { data, error });
      
      if (error) {
        console.error('Service error:', error);
        setError(`Failed to load profile: ${error}`);
        return;
      }
      
      if (!data) {
        console.error('No data returned from service');
        setError('Invalid share code. Please check the code and try again.');
        return;
      }
      
      console.log('Profile loaded successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Exception in loadProfileByCode:', error);
      setError(`Failed to load profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinProfile = async () => {
    if (!profile || !user) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Check if user already has access to this profile
      const { data: existingMember, error: checkError } = await supabase
        .from('profile_members')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('user_id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing membership:', checkError);
        setError('Failed to check profile access. Please try again.');
        return;
      }
      
      if (existingMember) {
        setError('You already have access to this profile.');
        return;
      }
      
      // If this is an invitation-based join, update the invitation status
      if (profile.invitation) {
        const { error: updateError } = await supabase
          .from('profile_invitations')
          .update({ status: 'accepted' })
          .eq('id', profile.invitation.id);
        
        if (updateError) {
          console.warn('Failed to update invitation status:', updateError);
          // Don't fail the join operation if this fails
        }
      }
      
      // Add user as member to the profile
      const { data, error } = await supabase
        .from('profile_members')
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          role: profile.invitation?.role || 'member',
          permissions: profile.invitation?.permissions || { view: true, edit: false, delete: false, invite: false },
          status: 'active',
          invited_by: profile.invitation?.invited_by || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error joining profile:', error);
        setError('Failed to join profile: ' + error.message);
        return;
      }
      
      setSuccess('Successfully joined the profile! Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard-screen');
      }, 2000);
      
    } catch (error) {
      console.error('Error joining profile:', error);
      setError('Failed to join profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualJoin = () => {
    if (!manualCode.trim()) {
      setError('Please enter a share code');
      return;
    }
    
    loadProfileByCode(manualCode.trim());
  };

  const testDatabaseAccess = async () => {
    try {
      console.log('🧪 Testing database access...');
      const result = await profileSharingService.testDatabaseAccess();
      console.log('Database test result:', result);
      
      if (result.success) {
        setSuccess('Database access test completed. Check console for details.');
      } else {
        setError('Database access test failed: ' + result.error);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setError('Test failed: ' + error.message);
    }
  };

  const getProfileTypeIcon = (type) => {
    switch (type) {
      case 'personal': return 'User';
      case 'family': return 'Users';
      case 'business': return 'Briefcase';
      case 'split_expense': return 'Split';
      default: return 'Tag';
    }
  };

  const getProfileTypeColor = (type) => {
    switch (type) {
      case 'personal': return 'bg-blue-500';
      case 'family': return 'bg-green-500';
      case 'business': return 'bg-purple-500';
      case 'split_expense': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getProfileTypeLabel = (type) => {
    switch (type) {
      case 'personal': return 'Personal';
      case 'family': return 'Family';
      case 'business': return 'Business';
      case 'split_expense': return 'Split Expense';
      default: return type;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Icon name="Users" size={24} color="white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Join Shared Profile</h1>
                <p className="text-muted-foreground">Join an expense profile shared by someone else</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard-screen')}
              iconName="ArrowLeft"
              iconPosition="left"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Manual Code Entry */}
          {!shareCode && (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                Enter Share Code
              </h2>
              <div className="space-y-4">
                <Input
                  label="Share Code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter the 12-character invitation code"
                  maxLength={12}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleManualJoin}
                    disabled={!manualCode.trim()}
                    iconName="Search"
                    iconPosition="left"
                    className="flex-1"
                  >
                    Find Profile
                  </Button>
                  <Button
                    onClick={testDatabaseAccess}
                    variant="outline"
                    iconName="Settings"
                    iconPosition="left"
                    className="px-4"
                    title="Test database access"
                  >
                    Test DB
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Information */}
          {profile && (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-4 mb-6">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${getProfileTypeColor(profile.type)}`}>
                  <Icon name={getProfileTypeIcon(profile.type)} size={32} color="white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-card-foreground mb-2">
                    {profile.name}
                  </h2>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full bg-accent/10 text-accent`}>
                      {getProfileTypeLabel(profile.type)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Shared Profile
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created by {profile.user_profiles?.full_name || 'Unknown User'}
                  </p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon name="Calendar" size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-card-foreground">Created</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon name="Settings" size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-card-foreground">Sharing Settings</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.share_settings?.allow_view ? 'View' : 'No view'} • {' '}
                    {profile.share_settings?.allow_edit ? 'Edit' : 'No edit'} • {' '}
                    {profile.share_settings?.allow_delete ? 'Delete' : 'No delete'}
                  </p>
                </div>
              </div>

              {/* Join Action */}
              <div className="border-t border-border pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll be able to view and manage expenses in this profile based on the sharing settings.
                  </p>
                  <Button
                    onClick={handleJoinProfile}
                    loading={isLoading}
                    iconName="Users"
                    iconPosition="left"
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    Join Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-8">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" size={20} className="text-error" />
                <p className="text-error">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-8">
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={20} className="text-success" />
                <p className="text-success">{success}</p>
              </div>
            </div>
          )}

          {/* Help Information */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              How to Join a Shared Profile
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p>Ask the profile owner to send you a share link or invitation email</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p>Click the share link or enter the share code on this page</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p>Click "Join Profile" to start collaborating on expenses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinProfileScreen;
