import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { expenseService } from '../../services/expenseService';
import ProfileHeader from './components/ProfileHeader';
import ProfileCard from './components/ProfileCard';
import AddProfileCard from './components/AddProfileCard';
import ProfileCreationModal from './components/ProfileCreationModal';

const ProfileSelectionScreen = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/authentication-screen');
      return;
    }
    
    loadExpenseProfiles();
  }, [user, authLoading, navigate]);

  const loadExpenseProfiles = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Ensure all shared profiles have share codes
      await expenseService?.ensureShareCodes();
      
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
        share_settings: profile?.share_settings
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
        share_settings: data?.share_settings
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Choose Your Profile
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select a profile to manage your expenses, or create a new one for different categories like personal, family, or business expenses.
            </p>
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