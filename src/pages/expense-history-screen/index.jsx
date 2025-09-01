import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import FilterPanel from './components/FilterPanel';
import TransactionCard from './components/TransactionCard';
import FilterChips from './components/FilterChips';
import MonthlyGroupHeader from './components/MonthlyGroupHeader';
import BulkActionBar from './components/BulkActionBar';
import EmptyState from './components/EmptyState';
import ExportModal from './components/ExportModal';
import { expenseService } from '../../services/expenseService';
import { authService } from '../../services/authService';
import { realTimeService } from '../../services/realTimeService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ExpenseHistoryScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { info: showInfo } = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    categories: [],
    amountRange: { min: '', max: '' },
    paymentMethods: [],
    searchQuery: ''
  });

  // Fetch profiles and transactions from Supabase
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
        
        // Get transactions for selected profile
        if (selectedProfile) {
          const { data: fetchedTransactions } = await expenseService.getExpenses(selectedProfile.id);
          setTransactions(fetchedTransactions || []);
        }
      } catch (error) {
        console.error('Error fetching data in expense history:', error);
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

    console.log('🔔 Setting up real-time subscription for expense history, profile:', currentProfile.id);

    // Subscribe to real-time updates for the current profile
    const subscription = realTimeService.subscribeToProfileExpenses(currentProfile.id, async (payload) => {
      console.log('📡 Real-time expense update received in history:', payload);
      
      // Handle different types of updates
      if (payload.table === 'expenses') {
        if (payload.eventType === 'INSERT') {
          // New expense added
          console.log('➕ New expense added, refreshing transactions...');
          
          // Show toast notification for new expenses
          if (payload.new && payload.new.user_id !== user?.id) {
            showInfo(`💰 New expense added: $${payload.new.amount} for ${payload.new.category}`);
          }
          
          const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
          setTransactions(fetchedTransactions || []);
        } else if (payload.eventType === 'UPDATE') {
          // Expense updated
          console.log('✏️ Expense updated, refreshing transactions...');
          
          // Show toast notification for expense updates
          if (payload.new && payload.new.user_id !== user?.id) {
            showInfo(`✏️ Expense updated: $${payload.new.amount} for ${payload.new.category}`);
          }
          
          const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
          setTransactions(fetchedTransactions || []);
        } else if (payload.eventType === 'DELETE') {
          // Expense deleted
          console.log('🗑️ Expense deleted, refreshing transactions...');
          
          // Show toast notification for expense deletions
          if (payload.old && payload.old.user_id !== user?.id) {
            showInfo(`🗑️ Expense removed: $${payload.old.amount} for ${payload.old.category}`);
          }
          
          const { data: fetchedTransactions } = await expenseService.getExpenses(currentProfile.id);
          setTransactions(fetchedTransactions || []);
        }
      } else if (payload.table === 'expense_profiles') {
        // Profile updated (balance, monthly_spent, etc.)
        if (payload.eventType === 'UPDATE' && payload.new && payload.new.user_id !== user?.id) {
          showInfo(`📊 Profile updated: Balance changed to $${payload.new.balance}`);
        }
      } else if (payload.table === 'budgets') {
        // Budget updated
        if (payload.eventType === 'INSERT' && payload.new && payload.new.user_id !== user?.id) {
          showInfo(`💰 New budget set: $${payload.new.amount} for ${payload.new.category}`);
        } else if (payload.eventType === 'UPDATE' && payload.new && payload.new.user_id !== user?.id) {
          showInfo(`💰 Budget updated: $${payload.new.amount} for ${payload.new.category}`);
        }
      }
    });

    // Cleanup subscription when component unmounts or profile changes
    return () => {
      console.log('🔕 Cleaning up real-time subscription for expense history, profile:', currentProfile.id);
      realTimeService.unsubscribeFromProfileExpenses(currentProfile.id);
    };
  }, [currentProfile?.id]);

  // Cleanup all subscriptions when component unmounts
  useEffect(() => {
    return () => {
      console.log('🔕 Expense history unmounting, cleaning up all subscriptions');
      realTimeService.unsubscribeFromAll();
    };
  }, []);

  // Handle profile change from navigation header
  const handleProfileChange = async (newProfile) => {
    console.log('🔄 Profile changed in expense history to:', newProfile.name, newProfile.id);
    
    // Update current profile
    setCurrentProfile(newProfile);
    
    // Save to localStorage
    localStorage.setItem('current_profile', JSON.stringify(newProfile));
    
    // Refresh transactions for new profile
    if (newProfile) {
      try {
        const { data: fetchedTransactions } = await expenseService.getExpenses(newProfile.id);
        setTransactions(fetchedTransactions || []);
      } catch (error) {
        console.error('Error fetching transactions for new profile:', error);
      }
    }
  };

  // Filter transactions based on current filters
  const filteredTransactions = transactions?.filter(transaction => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const categoryLabel = (transaction?.category || '').replace('_', ' ').toLowerCase();
      if (
        !(transaction?.description?.toLowerCase()?.includes(query) ||
          transaction?.memo?.toLowerCase()?.includes(query) ||
          categoryLabel.includes(query))
      ) {
        return false;
      }
    }

    // Date range filter
    if (filters?.dateRange?.start || filters?.dateRange?.end) {
      const transactionDate = new Date(transaction.expense_date);
      if (filters?.dateRange?.start && transactionDate < new Date(filters.dateRange.start)) return false;
      if (filters?.dateRange?.end && transactionDate > new Date(filters.dateRange.end)) return false;
    }

    // Category filter
    if (filters?.categories?.length > 0) {
      const categoryValues = filters?.categories?.map(cat => cat?.value || cat);
      if (!categoryValues?.includes(transaction?.category)) return false;
    }

    // Amount range filter
    if (filters?.amountRange?.min && transaction?.amount < parseFloat(filters?.amountRange?.min)) return false;
    if (filters?.amountRange?.max && transaction?.amount > parseFloat(filters?.amountRange?.max)) return false;

    // Payment method filter
    if (filters?.paymentMethods?.length > 0) {
      const methodValues = filters?.paymentMethods?.map(method => method?.value || method);
      if (!methodValues?.includes(transaction?.payment_method)) return false;
    }

    return true;
  });

  // Group transactions by month
  const groupedTransactions = filteredTransactions?.reduce((groups, transaction) => {
    const date = new Date(transaction.expense_date);
    const key = `${date?.getFullYear()}-${date?.getMonth() + 1}`;
    
    if (!groups?.[key]) {
      groups[key] = {
        month: date?.getMonth() + 1,
        year: date?.getFullYear(),
        transactions: [],
        total: 0
      };
    }
    
    groups?.[key]?.transactions?.push(transaction);
    groups[key].total += transaction?.amount;
    
    return groups;
  }, {});

  // Sort groups by date (newest first)
  const sortedGroups = Object.values(groupedTransactions)?.sort((a, b) => {
    return new Date(b.year, b.month - 1) - new Date(a.year, a.month - 1);
  });

  // Sort transactions within each group by date (newest first)
  sortedGroups?.forEach(group => {
    group?.transactions?.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      categories: [],
      amountRange: { min: '', max: '' },
      paymentMethods: [],
      searchQuery: ''
    });
    setSearchQuery('');
  };

  const handleTransactionEdit = (transaction) => {
    navigate('/expense-entry-screen', { state: { editTransaction: transaction } });
  };

  const handleTransactionDelete = (transactionId) => {
    setTransactions(prev => prev?.filter(t => t?.id !== transactionId));
    setSelectedTransactions(prev => prev?.filter(id => id !== transactionId));
  };

  const handleTransactionDuplicate = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now()?.toString(),
      expense_date: new Date(),
      description: `${transaction?.description} (Copy)`
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleBulkSelect = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev?.includes(transactionId)) {
        return prev?.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredTransactions?.map(t => t?.id);
    setSelectedTransactions(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedTransactions([]);
  };

  const handleBulkDelete = () => {
    setTransactions(prev => prev?.filter(t => !selectedTransactions?.includes(t?.id)));
    setSelectedTransactions([]);
    setBulkSelectMode(false);
  };

  const handleExport = (exportOptions) => {
    console.log('Exporting with options:', exportOptions);
    // Simulate export process
            showInfo(`Exporting ${exportOptions?.format?.toUpperCase()} report...`);
  };

  const hasActiveFilters = () => {
    return filters?.dateRange?.start || filters?.dateRange?.end || 
           filters?.categories?.length > 0 || 
           filters?.amountRange?.min || filters?.amountRange?.max ||
           filters?.paymentMethods?.length > 0 || 
           searchQuery;
  };

  // Pull to refresh handler
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isScrolling = false;

    const handleTouchStart = (e) => {
      startY = e?.touches?.[0]?.clientY;
      isScrolling = false;
    };

    const handleTouchMove = (e) => {
      if (!isScrolling) {
        currentY = e?.touches?.[0]?.clientY;
        const diff = currentY - startY;
        
        if (diff > 100 && window.scrollY === 0) {
          isScrolling = true;
          handleRefresh();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleRefresh]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/authentication-screen');
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <NavigationHeader
        currentProfile={currentProfile}
        profiles={profiles}
        onProfileChange={handleProfileChange}
        onSearch={handleSearch}
      />
      {/* Bulk Action Bar */}
      {bulkSelectMode && (
        <BulkActionBar
          selectedCount={selectedTransactions?.length}
          totalCount={filteredTransactions?.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkExport={() => setIsExportOpen(true)}
          onCancel={() => {
            setBulkSelectMode(false);
            setSelectedTransactions([]);
          }}
        />
      )}
      {/* Main Content */}
      <main className={`pt-16 md:pt-32 pb-20 md:pb-6 ${bulkSelectMode ? 'pt-28 md:pt-44' : ''}`}>
        {/* Search and Filter Bar */}
        <div className="sticky top-16 md:top-32 bg-background/95 backdrop-blur-sm border-b border-border z-50">
          <div className="flex items-center gap-3 p-4">
            {/* Search Input - Mobile */}
            <div className="md:hidden flex-1">
              <Input
                type="search"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="w-full"
              />
            </div>

            {/* Search Input - Desktop */}
            <div className="hidden md:block flex-1 max-w-md">
              <div className="relative">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search expenses, memos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFilterOpen(true)}
                className="relative"
              >
                <Icon name="Filter" size={18} />
                {hasActiveFilters() && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
              >
                <Icon name={bulkSelectMode ? "X" : "CheckSquare"} size={18} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsExportOpen(true)}
              >
                <Icon name="Download" size={18} />
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />
        </div>

        {/* Refresh Indicator */}
        {isRefreshing && (
          <div className="flex items-center justify-center py-4 border-b border-border">
            <div className="flex items-center space-x-2 text-accent">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Refreshing...</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4">
          {filteredTransactions?.length === 0 ? (
            <EmptyState 
              hasFilters={hasActiveFilters()} 
              onClearFilters={handleClearAllFilters}
            />
          ) : (
            <div className="space-y-6 py-4">
              {sortedGroups?.map((group) => (
                <div key={`${group?.year}-${group?.month}`} className="space-y-3">
                  <MonthlyGroupHeader
                    month={group?.month}
                    year={group?.year}
                    totalAmount={group?.total}
                    transactionCount={group?.transactions?.length}
                  />
                  
                  <div className="space-y-3">
                    {group?.transactions?.map((transaction) => (
                      <TransactionCard
                        key={transaction?.id}
                        transaction={transaction}
                        onEdit={handleTransactionEdit}
                        onDelete={handleTransactionDelete}
                        onDuplicate={handleTransactionDuplicate}
                        isSelected={selectedTransactions?.includes(transaction?.id)}
                        onSelect={handleBulkSelect}
                        showSelection={bulkSelectMode}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {!isLoading && filteredTransactions?.length >= 10 && (
                <div className="flex justify-center py-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 1000);
                    }}
                    loading={isLoading}
                  >
                    Load More Transactions
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
        onApplyFilters={() => setIsFilterOpen(false)}
        onClearFilters={handleClearAllFilters}
      />
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        selectedTransactions={selectedTransactions}
      />
      {/* Bottom Navigation */}
      <BottomNavigation />
      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};

export default ExpenseHistoryScreen;