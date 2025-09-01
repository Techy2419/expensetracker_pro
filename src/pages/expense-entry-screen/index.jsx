import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import all components
import AmountInput from './components/AmountInput';
import CategorySelector from './components/CategorySelector';
import DateTimePicker from './components/DateTimePicker';
import MemoInput from './components/MemoInput';
import AdvancedOptions from './components/AdvancedOptions';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import ExpenseFormActions from './components/ExpenseFormActions';

import { expenseService } from '../../services/expenseService';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { realTimeService } from '../../services/realTimeService';

const ExpenseEntryScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { error: showError, info: showInfo } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: null,
    date: '',
    time: '',
    memo: '',
    paymentMethod: null
  });

  // Advanced options state
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [recurringData, setRecurringData] = useState({});
  const [splitData, setSplitData] = useState({});
  const [attachments, setAttachments] = useState([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  // Add state for payment methods if not present
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [userId, setUserId] = useState(null);

  // Fetch profiles from Supabase
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Get current user
        const { data: user, error: userError } = await authService.getCurrentUser();
        if (userError || !user) return;
        
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
      } catch (error) {
        console.error('Error fetching profiles in expense entry:', error);
      }
    };
    
    if (user && !authLoading) {
      fetchProfiles();
    }
  }, [user, authLoading]);

  // Real-time subscription for expense updates
  useEffect(() => {
    if (!currentProfile?.id || !user?.id) return;

    console.log('🔔 Setting up real-time subscription for expense entry screen, profile:', currentProfile.id);

    const subscription = realTimeService.subscribeToProfileExpenses(currentProfile.id, async (payload) => {
      console.log('📡 Real-time update received in expense entry screen:', payload);
      
      // Only show notifications for changes made by other users
      if (payload.new && payload.new.user_id !== user?.id) {
        if (payload.table === 'expenses') {
          if (payload.eventType === 'INSERT') {
            showInfo(`💰 New expense added: $${payload.new.amount} for ${payload.new.category}`);
          } else if (payload.eventType === 'UPDATE') {
            showInfo(`✏️ Expense updated: $${payload.new.amount} for ${payload.new.category}`);
          } else if (payload.eventType === 'DELETE') {
            showInfo(`🗑️ Expense removed: $${payload.old.amount} for ${payload.old.category}`);
          }
        } else if (payload.table === 'expense_profiles') {
          showInfo(`📊 Profile updated: Balance changed to $${payload.new.balance}`);
        } else if (payload.table === 'budgets') {
          if (payload.eventType === 'INSERT') {
            showInfo(`💰 New budget set: $${payload.new.amount} for ${payload.new.category}`);
          } else if (payload.eventType === 'UPDATE') {
            showInfo(`💰 Budget updated: $${payload.new.amount} for ${payload.new.category}`);
          }
        }
      }
    });

    // Cleanup subscription when component unmounts or profile changes
    return () => {
      console.log('🔕 Cleaning up real-time subscription in expense entry screen for profile:', currentProfile.id);
      realTimeService.unsubscribeFromProfileExpenses(currentProfile.id);
    };
  }, [currentProfile?.id, user?.id, showInfo]);

  // Fetch payment methods from Supabase or your backend (add this to your data fetching logic)
  useEffect(() => {
    // Example: fetch payment methods for the current profile
    const fetchPaymentMethods = async () => {
      if (!currentProfile) return;
      // Replace this with your real fetch logic
      let methods = [];
      // e.g., const { data } = await expenseService.getPaymentMethods(currentProfile.id);
      // methods = data || [];
      // For now, just set to empty array if not implemented
      setPaymentMethods(methods);
    };
    fetchPaymentMethods();
  }, [currentProfile]);

  // Fetch user ID from Supabase Auth
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUserId();
  }, []);

  // Filter out Visa Credit Card
  const filteredPaymentMethods = paymentMethods.filter(
    (method) => method.name !== 'Visa Credit Card'
  );

  // Initialize form with current date/time
  useEffect(() => {
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      date: now?.toISOString()?.split('T')?.[0],
      time: now?.toTimeString()?.slice(0, 5)
    }));
  }, []);

  // Auto-save draft functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData?.amount || formData?.memo) {
        localStorage.setItem('expenseDraft', JSON.stringify({
          ...formData,
          recurringData,
          splitData,
          attachments,
          timestamp: Date.now()
        }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, recurringData, splitData, attachments]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('expenseDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Only load if draft is less than 24 hours old
        if (Date.now() - parsedDraft?.timestamp < 24 * 60 * 60 * 1000) {
          setFormData(parsedDraft);
          setRecurringData(parsedDraft?.recurringData || {});
          setSplitData(parsedDraft?.splitData || {});
          setAttachments(parsedDraft?.attachments || []);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.amount || parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData?.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData?.date) {
      newErrors.date = 'Please select a date';
    }
    
    if (!formData?.time) {
      newErrors.time = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const isFormValid = () => {
    return formData?.amount && 
           parseFloat(formData?.amount) > 0 && 
           formData?.category && 
           formData?.date && 
           formData?.time;
  };

  // Form handlers
  const handleAmountChange = (amount) => {
    setFormData(prev => ({ ...prev, amount }));
    if (errors?.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
    if (errors?.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date }));
    if (errors?.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  const handleTimeChange = (time) => {
    setFormData(prev => ({ ...prev, time }));
    if (errors?.time) {
      setErrors(prev => ({ ...prev, time: '' }));
    }
  };

  const handleMemoChange = (memo) => {
    setFormData(prev => ({ ...prev, memo }));
  };

  const handlePaymentMethodSelect = (method) => {
    setFormData(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleAddPaymentMethod = (newMethod) => {
    setPaymentMethods((prev) => [...prev, newMethod]);
  };

  const handleAttachmentAdd = (attachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const handleAttachmentRemove = (attachmentId) => {
    setAttachments(prev => prev?.filter(att => att?.id !== attachmentId));
  };

  // Remove getPaymentMethodEnum and revert to previous logic

  // Save handlers
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    // Save to Supabase with correct schema mapping
    const { data, error } = await expenseService.createExpense({
      profile_id: currentProfile?.id,
      user_id: userId,
      amount: formData.amount,
      category: formData.category?.id || formData.category,
      payment_method: formData.paymentMethod?.id || formData.paymentMethod,
      description: formData.memo,
      memo: formData.memo,
      expense_date: formData.date
    });

    if (error) {
      setIsSaving(false);
      showError('Failed to save expense: ' + error);
      return;
    }

    localStorage.removeItem('expenseDraft');
    setIsSaving(false);
    setShowSuccessModal(true);
  };

  const handleSaveAndAdd = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    // Save to Supabase with correct schema mapping
    const { data, error } = await expenseService.createExpense({
      profile_id: currentProfile?.id,
      user_id: userId,
      amount: formData.amount,
      category: formData.category?.id || formData.category,
      payment_method: formData.paymentMethod?.id || formData.paymentMethod,
      description: formData.memo,
      memo: formData.memo,
      expense_date: formData.date
    });

    if (error) {
      setIsSaving(false);
      showError('Failed to save expense: ' + error);
      return;
    }

    // Clear form but keep some defaults
    const now = new Date();
    setFormData({
      amount: '',
      category: null,
      date: now?.toISOString()?.split('T')?.[0],
      time: now?.toTimeString()?.slice(0, 5),
      memo: '',
      paymentMethod: formData?.paymentMethod
    });

    setRecurringData({});
    setSplitData({});
    setAttachments([]);
    setErrors({});

    localStorage.removeItem('expenseDraft');
    setIsSaving(false);
  };

  const handleCancel = () => {
    // Clear draft
    localStorage.removeItem('expenseDraft');
    navigate('/dashboard-screen');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/dashboard-screen');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/authentication-screen');
    }
  }, [user, authLoading, navigate]);

  // Handle profile change from navigation header
  const handleProfileChange = async (newProfile) => {
    console.log('🔄 Profile changed in expense entry to:', newProfile.name, newProfile.id);
    
    // Update current profile
    setCurrentProfile(newProfile);
    
    // Save to localStorage
    localStorage.setItem('current_profile', JSON.stringify(newProfile));
    
    // Refresh payment methods for new profile
    if (newProfile) {
      try {
        // You can add logic here to fetch profile-specific payment methods
        // For now, we'll just update the state
        setPaymentMethods([]);
      } catch (error) {
        console.error('Error updating payment methods for new profile:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <NavigationHeader
        currentProfile={currentProfile}
        profiles={profiles}
        onProfileChange={handleProfileChange}
        onSearch={(query) => console.log('Search:', query)}
        onUserMenuClick={() => console.log('User menu clicked')}
      />
      {/* Main Content */}
      <main className="pt-20 md:pt-36 pb-20 md:pb-8 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard-screen')}
                className="p-2 hover:bg-card rounded-lg transition-colors duration-200 md:hidden"
              >
                <Icon name="ArrowLeft" size={20} className="text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Add Expense</h1>
                <p className="text-sm text-muted-foreground">
                  Record a new transaction for {currentProfile?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Amount Input */}
              <div className="bg-card border border-border rounded-lg p-6">
                <AmountInput
                  value={formData?.amount}
                  onChange={handleAmountChange}
                  error={errors?.amount}
                />
              </div>

              {/* Category Selection */}
              <div className="bg-card border border-border rounded-lg p-6">
                <CategorySelector
                  selectedCategory={formData?.category}
                  onCategorySelect={handleCategorySelect}
                />
                {errors?.category && (
                  <p className="text-error text-sm mt-2 flex items-center space-x-1">
                    <Icon name="AlertCircle" size={16} />
                    <span>{errors?.category}</span>
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div className="bg-card border border-border rounded-lg p-6">
                <DateTimePicker
                  date={formData?.date}
                  time={formData?.time}
                  onDateChange={handleDateChange}
                  onTimeChange={handleTimeChange}
                />
                {(errors?.date || errors?.time) && (
                  <div className="mt-2 space-y-1">
                    {errors?.date && (
                      <p className="text-error text-sm flex items-center space-x-1">
                        <Icon name="AlertCircle" size={16} />
                        <span>{errors?.date}</span>
                      </p>
                    )}
                    {errors?.time && (
                      <p className="text-error text-sm flex items-center space-x-1">
                        <Icon name="AlertCircle" size={16} />
                        <span>{errors?.time}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Memo */}
              <div className="bg-card border border-border rounded-lg p-6">
                <MemoInput
                  value={formData?.memo}
                  onChange={handleMemoChange}
                />
              </div>

              {/* Advanced Options */}
              <AdvancedOptions
                isExpanded={advancedExpanded}
                onToggle={() => setAdvancedExpanded(!advancedExpanded)}
                recurringData={recurringData}
                onRecurringChange={setRecurringData}
                splitData={splitData}
                onSplitChange={setSplitData}
                attachments={attachments}
                onAttachmentAdd={handleAttachmentAdd}
                onAttachmentRemove={handleAttachmentRemove}
              />
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Payment Method */}
              <div className="bg-card border border-border rounded-lg p-6">
                <PaymentMethodSelector
                  selectedMethod={formData?.paymentMethod}
                  onMethodSelect={handlePaymentMethodSelect}
                />
              </div>

              {/* Form Actions */}
              <div className="bg-card border border-border rounded-lg p-6">
                <ExpenseFormActions
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onSaveAndAdd={handleSaveAndAdd}
                  isValid={isFormValid()}
                  isSaving={isSaving}
                />
              </div>

              {/* Expense Summary */}
              {isFormValid() && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="text-foreground font-mono text-lg">
                        ${parseFloat(formData?.amount)?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Category:</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 ${formData?.category?.color} rounded-full`}></div>
                        <span className="text-foreground">{formData?.category?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="text-foreground">
                        {new Date(formData.date)?.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {formData?.paymentMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="text-foreground">{formData?.paymentMethod?.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-200">
          <div className="bg-popover rounded-lg p-6 w-full max-w-md animate-slide-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-semibold text-popover-foreground mb-2">
                Expense Saved Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your expense of ${parseFloat(formData?.amount)?.toFixed(2)} has been recorded.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset form for new expense
                    const now = new Date();
                    setFormData({
                      amount: '',
                      category: null,
                      date: now?.toISOString()?.split('T')?.[0],
                      time: now?.toTimeString()?.slice(0, 5),
                      memo: '',
                      paymentMethod: null
                    });
                  }}
                  className="flex-1"
                >
                  Add Another
                </Button>
                <Button
                  onClick={handleSuccessModalClose}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bottom Navigation */}
      <BottomNavigation />
      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};

export default ExpenseEntryScreen;