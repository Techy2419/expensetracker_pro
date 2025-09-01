import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import BudgetOverviewCard from './components/BudgetOverviewCard';
import CategoryBudgetCard from './components/CategoryBudgetCard';
import BudgetTemplateCard from './components/BudgetTemplateCard';
import BudgetEditModal from './components/BudgetEditModal';
import BudgetChart from './components/BudgetChart';
import BudgetAlerts from './components/BudgetAlerts';

import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { expenseService } from '../../services/expenseService';
import { authService } from '../../services/authService';
import { realTimeService } from '../../services/realTimeService';

const periodOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

const BudgetManagementScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profiles and budgets from Supabase
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
        }
        
        setCurrentProfile(selectedProfile);
        
        // Get budgets for selected profile
        if (selectedProfile) {
          const { data: fetchedBudgets } = await expenseService.getBudgets(selectedProfile.id);
          setBudgets(fetchedBudgets || []);
        }
      } catch (error) {
        console.error('Error fetching data in budget management:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Real-time subscription effect
  useEffect(() => {
    if (!currentProfile?.id) return;

    console.log('🔔 Setting up real-time subscription for budget management, profile:', currentProfile.id);

    // Subscribe to real-time updates for the current profile
    const subscription = realTimeService.subscribeToProfileExpenses(currentProfile.id, async (payload) => {
      console.log('📡 Real-time update received in budget management:', payload);
      
      // Handle different types of updates
      if (payload.table === 'budgets') {
        // Budget updated
        console.log('💰 Budget updated, refreshing budgets...');
        const { data: fetchedBudgets } = await expenseService.getBudgets(currentProfile.id);
        setBudgets(fetchedBudgets || []);
      } else if (payload.table === 'expenses') {
        // Expense updated - this affects budget calculations
        console.log('💸 Expense updated, refreshing budgets...');
        const { data: fetchedBudgets } = await expenseService.getBudgets(currentProfile.id);
        setBudgets(fetchedBudgets || []);
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
          }
        }
      }
    });

    // Cleanup subscription when component unmounts or profile changes
    return () => {
      console.log('🔕 Cleaning up real-time subscription for budget management, profile:', currentProfile.id);
      realTimeService.unsubscribeFromProfileExpenses(currentProfile.id);
    };
  }, [currentProfile?.id, user?.id]);

  // Cleanup all subscriptions when component unmounts
  useEffect(() => {
    return () => {
      console.log('🔕 Budget management unmounting, cleaning up all subscriptions');
      realTimeService.unsubscribeFromAll();
    };
  }, []);

  // Handle profile change from navigation header
  const handleProfileChange = async (newProfile) => {
    console.log('🔄 Profile changed in budget management to:', newProfile.name, newProfile.id);
    
    // Update current profile
    setCurrentProfile(newProfile);
    
    // Save to localStorage
    localStorage.setItem('current_profile', JSON.stringify(newProfile));
    
    // Refresh budgets for new profile
    if (newProfile) {
      try {
        const { data: fetchedBudgets } = await expenseService.getBudgets(newProfile.id);
        setBudgets(fetchedBudgets || []);
      } catch (error) {
        console.error('Error fetching budgets for new profile:', error);
      }
    }
  };

  const handleSearch = (query) => {
    console.log('Searching for:', query);
  };

  const handleUserMenuClick = () => {
    console.log('User menu clicked');
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const allowedCategoryEnums = [
    'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'travel', 'other'
  ];

  const getCategoryEnumValue = (cat) => {
    if (!cat) return undefined;
    if (typeof cat === 'string') return cat;
    if (typeof cat === 'object' && cat.id) return cat.id;
    return undefined;
  };

  const handleSaveCategory = async (updatedCategory) => {
    if (!currentProfile || !user) return;
    setIsLoading(true);

    // Support both string and object for category
    const categoryEnum = getCategoryEnumValue(updatedCategory.category);
    if (!categoryEnum || !allowedCategoryEnums.includes(categoryEnum)) {
      showError('Selected category is not supported for budgets. Please choose a standard category.');
      setIsLoading(false);
      return;
    }
    if (!updatedCategory.budget || isNaN(parseFloat(updatedCategory.budget))) {
      showError('Please enter a valid budget amount.');
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const start_date = now.toISOString().split('T')[0];
    const end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Use the categoryEnum as the ENUM value
    const dbBudget = {
      profile_id: currentProfile.id,
      user_id: user.id,
      category: categoryEnum,
      amount: parseFloat(updatedCategory.budget) || 0,
      period: updatedCategory.period || 'monthly',
      start_date,
      end_date,
    };

    let result;
    if (updatedCategory.id) {
      result = await expenseService.updateBudget(updatedCategory.id, dbBudget);
    } else {
      result = await expenseService.createBudget(dbBudget);
    }

    // Refresh budgets
    const { data: fetchedBudgets } = await expenseService.getBudgets(currentProfile.id);
    setBudgets(fetchedBudgets || []);
    setIsLoading(false);
  };

  const handleApplyTemplate = (template) => {
    console.log('Applying template:', template);
    // Apply template logic here
  };

  const handleQuickExpense = () => {
    navigate('/expense-entry-screen');
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <NavigationHeader
        currentProfile={currentProfile}
        profiles={profiles}
        onProfileChange={handleProfileChange}
        onSearch={handleSearch}
        onUserMenuClick={handleUserMenuClick}
      />
      {/* Main Content */}
      <main className="pt-20 md:pt-36 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Budget Management</h1>
              <p className="text-muted-foreground">
                Track and manage your spending limits across categories
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Select
                options={periodOptions}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                className="w-32"
              />
              <Button
                variant="default"
                onClick={handleAddCategory}
                iconName="Plus"
                iconPosition="left"
              >
                Add Category
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Panel - Overview & Controls */}
            <div className="lg:col-span-4 space-y-6">
              {/* Budget Overview Cards */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Budget Overview</h2>
                {budgets?.map((overview, index) => (
                  <BudgetOverviewCard
                    key={index}
                    {...overview}
                  />
                ))}
              </div>

              {/* Budget Templates */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Quick Templates</h2>
                {/* Mock budget templates removed */}
              </div>
            </div>

            {/* Right Panel - Categories & Chart */}
            <div className="lg:col-span-8 space-y-6">
              {/* Category Budget List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Category Budgets</h2>
                  <span className="text-sm text-muted-foreground">
                    {budgets?.length} categories
                  </span>
                </div>
                <div className="grid gap-4">
                  {budgets?.map((category) => (
                    <CategoryBudgetCard
                      key={category?.id}
                      category={category}
                      onEdit={handleEditCategory}
                    />
                  ))}
                </div>
              </div>

              {/* Budget Performance Chart */}
              <BudgetChart budgets={budgets} />

              {/* Budget Alerts */}
              <BudgetAlerts />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets?.slice(0, 2)?.map((overview, index) => (
                <BudgetOverviewCard
                  key={index}
                  {...overview}
                />
              ))}
            </div>

            {/* Category Budget List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Categories</h2>
                <span className="text-sm text-muted-foreground">
                  {budgets?.length} total
                </span>
              </div>
              <div className="space-y-3">
                {budgets?.map((category) => (
                  <CategoryBudgetCard
                    key={category?.id}
                    category={category}
                    onEdit={handleEditCategory}
                  />
                ))}
              </div>
            </div>

            {/* Budget Templates */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Templates</h2>
              <div className="grid gap-3">
                {/* Mock budget templates removed */}
              </div>
            </div>

            {/* Budget Chart */}
            <BudgetChart budgets={budgets} />

            {/* Budget Alerts */}
            <BudgetAlerts />
          </div>
        </div>
      </main>
      {/* Budget Edit Modal */}
      <BudgetEditModal
        isOpen={isEditModalOpen}
        category={selectedCategory}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCategory}
      />
      {/* Bottom Navigation */}
      <BottomNavigation />
      {/* Floating Action Button */}
      <FloatingActionButton onQuickExpense={handleQuickExpense} />
    </div>
  );
};

export default BudgetManagementScreen;