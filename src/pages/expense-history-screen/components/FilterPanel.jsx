import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';


const FilterPanel = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  onApplyFilters,
  onClearFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const categoryOptions = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transportation' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'bills', label: 'Bills & Utilities' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'travel', label: 'Travel' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'other', label: 'Other' }
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'digital_wallet', label: 'Digital Wallet' }
  ];

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      dateRange: { start: '', end: '' },
      categories: [],
      amountRange: { min: '', max: '' },
      paymentMethods: [],
      searchQuery: ''
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClearFilters();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div className="md:hidden fixed inset-0 bg-black/50 z-200" onClick={onClose} />
      {/* Filter Panel */}
      <div className={`
        fixed md:static inset-x-0 bottom-0 md:inset-auto
        bg-card md:bg-transparent border-t md:border-t-0 border-border
        rounded-t-xl md:rounded-none
        z-300 md:z-auto
        max-h-[80vh] md:max-h-none overflow-y-auto
        animate-slide-in
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border md:hidden">
          <h3 className="text-lg font-semibold text-foreground">Filter Expenses</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Date Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="From"
                value={localFilters?.dateRange?.start}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...localFilters?.dateRange,
                  start: e?.target?.value
                })}
              />
              <Input
                type="date"
                label="To"
                value={localFilters?.dateRange?.end}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...localFilters?.dateRange,
                  end: e?.target?.value
                })}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Categories</h4>
            <Select
              multiple
              searchable
              placeholder="Select categories"
              options={categoryOptions}
              value={localFilters?.categories}
              onChange={(value) => handleFilterChange('categories', value)}
            />
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Amount Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Min Amount"
                placeholder="0.00"
                value={localFilters?.amountRange?.min}
                onChange={(e) => handleFilterChange('amountRange', {
                  ...localFilters?.amountRange,
                  min: e?.target?.value
                })}
              />
              <Input
                type="number"
                label="Max Amount"
                placeholder="1000.00"
                value={localFilters?.amountRange?.max}
                onChange={(e) => handleFilterChange('amountRange', {
                  ...localFilters?.amountRange,
                  max: e?.target?.value
                })}
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Payment Methods</h4>
            <Select
              multiple
              placeholder="Select payment methods"
              options={paymentMethodOptions}
              value={localFilters?.paymentMethods}
              onChange={(value) => handleFilterChange('paymentMethods', value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              Clear All
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;