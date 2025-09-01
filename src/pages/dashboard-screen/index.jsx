import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { expenseService } from '../../services/expenseService';
import { realTimeService } from '../../services/realTimeService';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import RecentTransactions from './components/RecentTransactions';
import SpendingChart from './components/SpendingChart';
import QuickExpenseEntry from './components/QuickExpenseEntry';
import ProfileCreationModal from '../profile-selection-screen/components/ProfileCreationModal';
import AppIcon from '../../components/AppIcon';
import MonthlyOverview from './components/MonthlyOverview';
import AchievementNotifications from './components/AchievementNotifications';
import SpendingInsights from './components/SpendingInsights';
import LiveUpdateNotification from '../../components/ui/LiveUpdateNotification';
// Import predefinedCategories from CategorySelector
import { predefinedCategories } from '../expense-entry-screen/components/CategorySelector';

// Helper to convert Tailwind bg-* color classes to hex codes
const tailwindColorToHex = (colorClass) => {
  switch (colorClass) {
    case 'bg-orange-600': return '#ea580c';
    case 'bg-blue-600': return '#2563eb';
    case 'bg-purple-600': return '#9333ea';
    case 'bg-pink-600': return '#db2777';
    case 'bg-red-600': return '#dc2626';
    case 'bg-yellow-600': return '#ca8a04';
    case 'bg-green-600': return '#16a34a';
    case 'bg-indigo-600': return '#4f46e5';
    case 'bg-emerald-600': return '#059669';
    case 'bg-amber-600': return '#d97706';
    case 'bg-rose-600': return '#e11d48';
    case 'bg-gray-600': return '#4b5563';
    default: return '#888';
  }
};

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch profiles and transactions from Supabase
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/authentication-screen');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current user
        const { data: user, error: userError } = await authService.getCurrentUser();
        if (userError || !user) {
          setIsLoading(false);
          return;
        }
        
        // Get profiles
        const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user.id);
        setProfiles(fetchedProfiles || []);
        
        // IMPORTANT: Get the selected profile from localStorage instead of defaulting to first
        const savedProfile = localStorage.getItem('current_profile');
        let selectedProfile = null;
        
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile);
            // Find the profile in the fetched profiles to ensure it exists and has latest data
            selectedProfile = fetchedProfiles?.find(p => p.id === parsedProfile.id);
          } catch (error) {
            console.warn('Failed to parse saved profile from localStorage:', error);
          }
        }
        
        // If no saved profile or saved profile not found, use first profile as fallback
        if (!selectedProfile && fetchedProfiles?.length > 0) {
          selectedProfile = fetchedProfiles[0];
          // Save this as current profile
          localStorage.setItem('current_profile', JSON.stringify(selectedProfile));
        }
        
        setCurrentProfile(selectedProfile);
        
        // Get transactions for selected profile
        if (selectedProfile) {
          const { data: fetchedTransactions } = await expenseService.getExpenses(selectedProfile.id);
          setTransactions(fetchedTransactions || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading, showError]);

  // Real-time subscription effect - FIXED: Now properly handles profile changes
  useEffect(() => {
    if (!currentProfile?.id) return;

    console.log('🔔 Setting up real-time subscription for profile:', currentProfile.id);

    // Test real-time connection first
    realTimeService.testConnection();

    // Subscribe to real-time updates for the current profile
    const subscription = realTimeService.subscribeToProfileExpenses(currentProfile.id, async (payload) => {
      console.log('📡 Real-time update received:', payload);
      
      // Handle different types of updates
      if (payload.table === 'expenses') {
        if (payload.eventType === 'INSERT') {
          // New expense added
          console.log('➕ New expense added, refreshing transactions...');
          const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
          setTransactions(fetchedTransactions || []);
          
          // Also refresh profile data to update balance/monthly_spent
          const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user?.id);
          if (fetchedProfiles) {
            setProfiles(fetchedProfiles);
            // Update current profile with latest data
            const updatedProfile = fetchedProfiles.find(p => p.id === currentProfile.id);
            if (updatedProfile) {
              setCurrentProfile(updatedProfile);
              // Update localStorage with latest profile data
              localStorage.setItem('current_profile', JSON.stringify(updatedProfile));
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          // Expense updated
          console.log('✏️ Expense updated, refreshing transactions...');
          const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
          setTransactions(fetchedTransactions || []);
          
          // Refresh profile data
          const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user?.id);
          if (fetchedProfiles) {
            setProfiles(fetchedProfiles);
            const updatedProfile = fetchedProfiles.find(p => p.id === currentProfile.id);
            if (updatedProfile) {
              setCurrentProfile(updatedProfile);
              localStorage.setItem('current_profile', JSON.stringify(updatedProfile));
            }
          }
        } else if (payload.eventType === 'DELETE') {
          // Expense deleted
          console.log('🗑️ Expense deleted, refreshing transactions...');
          const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
          setTransactions(fetchedTransactions || []);
          
          // Refresh profile data
          const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user?.id);
          if (fetchedProfiles) {
            setProfiles(fetchedProfiles);
            const updatedProfile = fetchedProfiles.find(p => p.id === currentProfile.id);
            if (updatedProfile) {
              setCurrentProfile(updatedProfile);
              localStorage.setItem('current_profile', JSON.stringify(updatedProfile));
            }
          }
        }
      } else if (payload.table === 'expense_profiles') {
        // Profile updated (balance, monthly_spent, etc.)
        console.log('📊 Profile updated, refreshing profile data...');
        const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user?.id);
        setProfiles(fetchedProfiles || []);
        
        // Update current profile if it's the same one
        if (fetchedProfiles) {
          const updatedProfile = fetchedProfiles.find(p => p.id === currentProfile.id);
          if (updatedProfile) {
            setCurrentProfile(updatedProfile);
            localStorage.setItem('current_profile', JSON.stringify(updatedProfile));
          }
        }
      } else if (payload.table === 'budgets') {
        // Budget updated
        console.log('💰 Budget updated, refreshing data...');
        // You can add budget refresh logic here if needed
      } else if (payload.table === 'profile_members') {
        // Profile member updated (someone joined/left)
        console.log('👥 Profile member updated, refreshing profile data...');
        const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user?.id);
        setProfiles(fetchedProfiles || []);
      } else if (payload.table === 'profile_invitations') {
        // Profile invitation updated
        console.log('📧 Profile invitation updated, refreshing profile data...');
        const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user?.id);
        setProfiles(fetchedProfiles || []);
      }
    });

    // Cleanup subscription when component unmounts or profile changes
    return () => {
      console.log('🔕 Cleaning up real-time subscription for profile:', currentProfile.id);
      realTimeService.unsubscribeFromProfileExpenses(currentProfile.id);
    };
  }, [currentProfile?.id, user?.id]);

  // Cleanup all subscriptions when component unmounts
  useEffect(() => {
    return () => {
      console.log('🔕 Dashboard unmounting, cleaning up all subscriptions');
      realTimeService.unsubscribeFromAll();
    };
  }, []);

  // Handle profile change - FIXED: Now properly saves to localStorage and updates state
  const handleProfileChange = async (profile) => {
    console.log('🔄 Profile changed to:', profile.name, profile.id);
    
    // Save to localStorage immediately
    localStorage.setItem('current_profile', JSON.stringify(profile));
    
    // Update state
    setCurrentProfile(profile);
    setIsLoading(true);
    
    try {
      // Fetch transactions for selected profile
      const { data: fetchedTransactions } = await expenseService.getExpenses(profile.id);
      setTransactions(fetchedTransactions || []);
    } catch (error) {
      console.error('Error fetching transactions for new profile:', error);
      showError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
    
    // The real-time subscription will automatically update when currentProfile changes
    // due to the useEffect dependency on currentProfile?.id
  };

  const handleAddProfile = () => {
    setIsProfileModalOpen(true);
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
        showError('Failed to create profile: ' + error);
        return;
      }
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
      setCurrentProfile(transformedProfile);
      setIsProfileModalOpen(false);
    } catch (error) {
      showError('Failed to create profile: ' + error?.message);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    // Optionally implement search logic here
  };

  // Handle user menu
  const handleUserMenuClick = () => {
    // Optionally implement user menu logic here
  };

  // Add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle expense addition
  const handleExpenseAdd = async (expense) => {
    if (!currentProfile) return;
    setIsLoading(true);
    await expenseService.createExpense({ ...expense, profile_id: currentProfile.id });
    // Refresh transactions
    const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
    setTransactions(fetchedTransactions || []);
    setIsLoading(false);
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentProfile) {
      const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
      setTransactions(fetchedTransactions || []);
    }
    setRefreshing(false);
  };

  // Handle quick expense via FAB
  const handleQuickExpense = () => {
    navigate('/expense-entry-screen');
  };

  // Calculate real values for MonthlyOverview and SpendingChart
  let currentSpending = 0;
  let monthlyBudget = 0;
  let remainingBudget = 0;
  let transactionCount = null;
  let avgPerDay = null;
  let topCategory = null;
  let spendingChartData = [];

  if (transactions.length > 0) {
    currentSpending = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    transactionCount = transactions.length;

    // Calculate avgPerDay (for current month)
    const dates = transactions.map(t => new Date(t.expense_date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const days = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
    avgPerDay = currentSpending / days;

    // Calculate category breakdown for SpendingChart
    const categoryMap = {};
    transactions.forEach(t => {
      const catId = t.category;
      if (!categoryMap[catId]) {
        const catMeta = predefinedCategories.find(c => c.id === catId) || { name: catId, color: 'bg-gray-600', icon: 'Tag' };
        categoryMap[catId] = {
          id: catId,
          name: catMeta.name,
          value: 0,
          color: tailwindColorToHex(catMeta.color),
          icon: <span><AppIcon name={catMeta.icon} size={16} /></span>
        };
      }
      categoryMap[catId].value += t.amount || 0;
    });
    spendingChartData = Object.values(categoryMap);

    // Find top category
    if (spendingChartData.length > 0) {
      const top = spendingChartData.reduce((a, b) => (a.value > b.value ? a : b));
      topCategory = top.value;
    }
  }
  // Optionally, fetch monthlyBudget from profile or another source if available
  // remainingBudget = monthlyBudget - currentSpending;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <BottomNavigation />
        {/* Loading Skeleton */}
        <div className="pt-16 md:pt-32 pb-20 md:pb-6 px-4 lg:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              {/* Overview Skeleton */}
              <div className="bg-card rounded-lg p-6 border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-32 mb-4"></div>
                <div className="h-8 bg-muted rounded w-48 mb-4"></div>
                <div className="h-2 bg-muted rounded w-full mb-2"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              </div>

              {/* Quick Entry Skeleton */}
              <div className="bg-card rounded-lg p-4 border border-border animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>

              {/* Transactions Skeleton */}
              <div className="bg-card rounded-lg border border-border animate-pulse">
                <div className="p-4 border-b border-border">
                  <div className="h-6 bg-muted rounded w-40"></div>
                </div>
                <div className="space-y-4 p-4">
                  {[1, 2, 3]?.map(i => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <NavigationHeader
        currentProfile={currentProfile}
        profiles={profiles}
        onProfileChange={handleProfileChange}
        onSearch={handleSearch}
        onUserMenuClick={handleUserMenuClick}
        onAddProfile={handleAddProfile}
      />
      {/* Profile Creation Modal */}
      <ProfileCreationModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onCreateProfile={handleCreateProfile}
      />
      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <FloatingActionButton onQuickExpense={handleQuickExpense} />

      {/* Main Content */}
      <main className="pt-20 md:pt-36 pb-20 md:pb-6 px-4 lg:px-6">
        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">🔍 Debug Info (Development Only)</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <div><strong>Current Profile:</strong> {currentProfile?.name} (ID: {currentProfile?.id})</div>
              <div><strong>Profile Type:</strong> {currentProfile?.type}</div>
              <div><strong>Is Shared:</strong> {currentProfile?.is_shared ? 'Yes' : 'No'}</div>
              <div><strong>Share Code:</strong> {currentProfile?.share_code || 'None'}</div>
              <div><strong>Total Profiles:</strong> {profiles.length}</div>
              <div><strong>Total Transactions:</strong> {transactions.length}</div>
              <div><strong>LocalStorage Profile:</strong> {localStorage.getItem('current_profile') ? 'Set' : 'Not Set'}</div>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  console.log('🧪 Testing real-time connection...');
                  realTimeService.testConnection();
                }}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Test Real-time
              </button>
              <button
                onClick={async () => {
                  console.log('🔄 Manual refresh...');
                  if (currentProfile) {
                    const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
                    setTransactions(fetchedTransactions || []);
                    console.log('✅ Manual refresh completed');
                  }
                }}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Manual Refresh
              </button>
            </div>
          </div>
        )}
        
        {/* Live Update Notifications */}
        {notifications.map(notification => (
          <LiveUpdateNotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
        
        <div className="max-w-7xl mx-auto">
          {/* Pull to Refresh Indicator */}
          {refreshing && (
            <div className="fixed top-16 md:top-32 left-0 right-0 z-50 bg-accent text-accent-foreground text-center py-2 text-sm animate-slide-in">
              Refreshing data...
            </div>
          )}

          {/* Switch Profile Button */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {currentProfile?.name || 'Dashboard'}
                </h1>
                <p className="text-muted-foreground">
                  {currentProfile?.type ? `${currentProfile.type.charAt(0).toUpperCase() + currentProfile.type.slice(1)} Profile` : 'Select a profile to get started'}
                </p>
              </div>
              {/* Live Updates Indicator */}
              {currentProfile?.is_shared && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/profile-selection-screen')}
              className="flex items-center space-x-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
            >
              <AppIcon name="Users" size={16} />
              <span>Switch Profile</span>
            </button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <QuickExpenseEntry onExpenseAdd={handleExpenseAdd} categories={predefinedCategories} />
              <AchievementNotifications />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-6 space-y-6">
              <MonthlyOverview
                currentSpending={currentSpending}
                monthlyBudget={monthlyBudget}
                remainingBudget={remainingBudget}
                transactionCount={transactionCount}
                avgPerDay={avgPerDay}
                topCategory={topCategory}
              />
              <RecentTransactions transactions={transactions} />
              <SpendingChart data={spendingChartData} />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <SpendingInsights />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            <MonthlyOverview
              currentSpending={currentSpending}
              monthlyBudget={monthlyBudget}
              remainingBudget={remainingBudget}
              transactionCount={transactionCount}
              avgPerDay={avgPerDay}
              topCategory={topCategory}
            />
            
            <QuickExpenseEntry onExpenseAdd={handleExpenseAdd} categories={predefinedCategories} />
            
            <RecentTransactions transactions={transactions} />
            
            <div className="grid grid-cols-1 gap-6">
              <SpendingChart data={spendingChartData} />
              <AchievementNotifications />
              <SpendingInsights />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardScreen;