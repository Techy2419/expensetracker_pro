import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

const periodOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

const BudgetManagementScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
      // Get current user
      const { data: user, error: userError } = await authService.getCurrentUser();
      if (userError || !user) {
        setIsLoading(false);
        return;
      }
      // Get profiles
      const { data: fetchedProfiles } = await expenseService.getExpenseProfiles(user.id);
      setProfiles(fetchedProfiles || []);
      setCurrentProfile(fetchedProfiles?.[0] || null);
      // Get budgets for first profile
      if (fetchedProfiles?.[0]) {
        const { data: fetchedBudgets } = await expenseService.getBudgets(fetchedProfiles[0].id);
        setBudgets(fetchedBudgets || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle profile change
  const handleProfileChange = async (profile) => {
    setCurrentProfile(profile);
    setIsLoading(true);
    // Fetch budgets for selected profile
    const { data: fetchedBudgets } = await expenseService.getBudgets(profile.id);
    setBudgets(fetchedBudgets || []);
    setIsLoading(false);
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
      alert('Selected category is not supported for budgets. Please choose a standard category.');
      setIsLoading(false);
      return;
    }
    if (!updatedCategory.budget || isNaN(parseFloat(updatedCategory.budget))) {
      alert('Please enter a valid budget amount.');
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