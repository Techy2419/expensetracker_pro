import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { expenseService } from '../../services/expenseService';
import { profileSharingService } from '../../services/profileSharingService';
import { supabase } from '../../lib/supabase';
import ProfileHeader from './components/ProfileHeader';
import ProfileCard from './components/ProfileCard';
import AddProfileCard from './components/AddProfileCard';
import ProfileCreationModal from './components/ProfileCreationModal';

const ProfileSelectionScreen = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/authentication-screen');
      return;
    }
    
    loadExpenseProfiles();
  }, [user, authLoading, navigate]);

  // Add effect to refresh profiles when returning to this screen
  useEffect(() => {
    const handleFocus = () => {
      if (user && !authLoading) {
        loadExpenseProfiles();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, authLoading]);

  const loadExpenseProfiles = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // TODO: Re-enable after fixing RLS policies
      // await expenseService?.ensureShareCodes();
      
      const { data, error } = await expenseService?.getExpenseProfiles(user?.id);
      
      if (error) {
        setError(`Failed to load profiles: ${error}`);
        return;
      }
      
      // Transform the data to match the expected format
      const transformedProfiles = data?.map(profile => ({
        id: profile?.id,
        name: profile?.name,
        type: profile?.type,
        balance: profile?.balance,
        monthlySpent: profile?.monthly_spent,
        lastActivity: profile?.updated_at,
        recentActivity: `Last updated on ${new Date(profile.updated_at)?.toLocaleDateString()}`,
        createdAt: profile?.created_at,
        is_shared: profile?.is_shared,
        share_code: profile?.share_code,
        share_settings: profile?.share_settings,
        is_owner: profile?.user_id === user?.id // Add flag to identify owned vs joined profiles
      })) || [];
      
      setProfiles(transformedProfiles);
    } catch (error) {
      setError(`Failed to load profiles: ${error?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    
    // Save selected profile to localStorage for dashboard access
    localStorage.setItem('current_profile', JSON.stringify(profile));
    
    // Navigate to dashboard with smooth transition
    setTimeout(() => {
      navigate('/dashboard-screen');
    }, 300);
  };

  const handleJoinByCode = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setJoinError('Please enter a valid 6-digit code');
      return;
    }

    setIsJoining(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      // Use the profile sharing service to join by code
      const { data, error } = await profileSharingService.getProfileByCode(joinCode);
      
      if (error) {
        setJoinError(`Failed to join profile: ${error}`);
        return;
      }

      if (!data) {
        setJoinError('Invalid share code. Please check the code and try again.');
        return;
      }

      // Check if user already has access to this profile
      const existingProfile = profiles.find(p => p.id === data.id);
      if (existingProfile) {
        setJoinError('You already have access to this profile.');
        return;
      }

      // Join the profile using the existing join logic
      const userProfileResult = await profileSharingService.ensureUserProfileExists(user.id);
      if (!userProfileResult.success) {
        setJoinError('Failed to verify user account. Please try again.');
        return;
      }

      // Add user as member to the profile
      const memberData = {
        profile_id: data.id,
        user_id: user.id,
        role: 'member',
        permissions: { view: true, edit: false, delete: false, invite: false },
        status: 'active',
        invited_by: null,
        joined_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('profile_members')
        .insert(memberData);

      if (insertError) {
        setJoinError('Failed to join profile: ' + insertError.message);
        return;
      }

      // Show success toast
      showSuccess(`Successfully joined ${data.name}!`);
      setJoinCode('');
      setJoinSuccess('');
      
      // Immediately refresh profiles to show the newly joined profile
      await loadExpenseProfiles();

    } catch (error) {
      setJoinError('Failed to join profile. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateProfile = async (profileData) => {
    if (!user?.id) return;
    
    try {
      const newProfileData = {
        user_id: user?.id,
        name: profileData?.name,
        type: profileData?.type,
        balance: 0.00,
        monthly_spent: 0.00,
        is_shared: profileData?.isShared || false,
        share_settings: profileData?.shareSettings || null
      };
      
      const { data, error } = await expenseService?.createExpenseProfile(newProfileData);
      
      if (error) {
        setError(`Failed to create profile: ${error}`);
        return;
      }
      
      // Transform and add to profiles list
      const transformedProfile = {
        id: data?.id,
        name: data?.name,
        type: data?.type,
        balance: data?.balance,
        monthlySpent: data?.monthly_spent,
        lastActivity: data?.created_at,
        recentActivity: `Created on ${new Date(data.created_at)?.toLocaleDateString()}`,
        createdAt: data?.created_at,
        is_shared: data?.is_shared,
        share_code: data?.share_code,
        share_settings: data?.share_settings,
        is_owner: true // New profiles are always owned by the creator
      };
      
      setProfiles(prev => [transformedProfile, ...prev]);
      setIsModalOpen(false);
      
      // Auto-select the new profile
      handleProfileSelect(transformedProfile);
    } catch (error) {
      setError(`Failed to create profile: ${error?.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      
      // Clear stored data
      localStorage.removeItem('current_profile');
      
      navigate('/authentication-screen');
    } catch (error) {
      setError(`Logout failed: ${error?.message}`);
    }
  };

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ProfileHeader onLogout={handleLogout} />
      
      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 lg:px-6 lg:py-12">
          {/* Page Header */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="flex items-center justify-between mb-4">
              <div></div> {/* Spacer */}
              <button
                onClick={loadExpenseProfiles}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                title="Refresh profiles"
              >
                <div className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full ${loading ? 'animate-spin' : ''}`}></div>
                <span>Refresh</span>
              </button>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Choose Your Profile
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select a profile to manage your expenses, or create a new one for different categories like personal, family, or business expenses.
            </p>
          </div>

          {/* Join Profile by Code Section */}
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Join a Shared Profile
              </h2>
              <p className="text-muted-foreground">
                Enter a 6-digit share code to join an existing shared profile
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-center text-lg font-mono tracking-widest text-card-foreground bg-background"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  onClick={handleJoinByCode}
                  disabled={!joinCode || joinCode.length !== 6 || isJoining}
                  className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isJoining ? 'Joining...' : 'Join Profile'}
                </button>
              </div>
              
              {joinError && (
                <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-error text-sm text-center">{joinError}</p>
                </div>
              )}
              
              {joinSuccess && (
                <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm text-center text-success">{joinSuccess}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-error">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-error/70 hover:text-error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          ) : (
            <>
              {/* Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Existing Profiles */}
                {profiles?.map((profile) => (
                  <ProfileCard
                    key={profile?.id}
                    profile={profile}
                    isSelected={selectedProfile?.id === profile?.id}
                    onClick={handleProfileSelect}
                    onUpdate={loadExpenseProfiles}
                  />
                ))}

                {/* Add New Profile Card */}
                <AddProfileCard onClick={() => setIsModalOpen(true)} />
              </div>

              {/* Quick Stats */}
              {profiles?.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    Quick Overview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        {profiles?.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Profiles
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        ${profiles?.reduce((sum, profile) => sum + (profile?.balance || 0), 0)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Balance
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        ${profiles?.reduce((sum, profile) => sum + (profile?.monthlySpent || 0), 0)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        This Month
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {profiles?.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No profiles yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first expense profile to get started with tracking your finances.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    Create Profile
                  </button>
                </div>
              )}

              {/* Help Text */}
              <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">
                  Need help getting started? Each profile can have its own budgets, categories, and expense tracking.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* Profile Creation Modal */}
      <ProfileCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProfile={handleCreateProfile}
      />
    </div>
  );
};

export default ProfileSelectionScreen;