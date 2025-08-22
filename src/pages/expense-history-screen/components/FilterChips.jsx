import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FilterChips = ({ filters, onRemoveFilter, onClearAll }) => {
  const getActiveFilters = () => {
    const active = [];

    // Date range
    if (filters?.dateRange?.start || filters?.dateRange?.end) {
      const start = filters?.dateRange?.start ? new Date(filters.dateRange.start)?.toLocaleDateString() : '';
      const end = filters?.dateRange?.end ? new Date(filters.dateRange.end)?.toLocaleDateString() : '';
      active?.push({
        key: 'dateRange',
        label: `Date: ${start || 'Any'} - ${end || 'Any'}`,
        value: filters?.dateRange
      });
    }

    // Categories
    if (filters?.categories?.length > 0) {
      filters?.categories?.forEach(category => {
        active?.push({
          key: 'category',
          label: category?.label || category,
          value: category,
          removable: true
        });
      });
    }

    // Amount range
    if (filters?.amountRange?.min || filters?.amountRange?.max) {
      const min = filters?.amountRange?.min || '0';
      const max = filters?.amountRange?.max || '∞';
      active?.push({
        key: 'amountRange',
        label: `Amount: $${min} - $${max}`,
        value: filters?.amountRange
      });
    }

    // Payment methods
    if (filters?.paymentMethods?.length > 0) {
      filters?.paymentMethods?.forEach(method => {
        active?.push({
          key: 'paymentMethod',
          label: method?.label || method?.replace('_', ' '),
          value: method,
          removable: true
        });
      });
    }

    // Search query
    if (filters?.searchQuery) {
      active?.push({
        key: 'search',
        label: `Search: "${filters?.searchQuery}"`,
        value: filters?.searchQuery
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters?.length === 0) {
    return null;
  }

  const handleRemoveFilter = (filter) => {
    if (filter?.key === 'dateRange') {
      onRemoveFilter('dateRange', { start: '', end: '' });
    } else if (filter?.key === 'amountRange') {
      onRemoveFilter('amountRange', { min: '', max: '' });
    } else if (filter?.key === 'search') {
      onRemoveFilter('searchQuery', '');
    } else if (filter?.key === 'category') {
      const updatedCategories = filters?.categories?.filter(cat => 
        (cat?.value || cat) !== (filter?.value?.value || filter?.value)
      );
      onRemoveFilter('categories', updatedCategories);
    } else if (filter?.key === 'paymentMethod') {
      const updatedMethods = filters?.paymentMethods?.filter(method => 
        (method?.value || method) !== (filter?.value?.value || filter?.value)
      );
      onRemoveFilter('paymentMethods', updatedMethods);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 border-b border-border">
      <div className="flex items-center space-x-2 mr-2">
        <Icon name="Filter" size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {activeFilters?.length} filter{activeFilters?.length !== 1 ? 's' : ''} applied
        </span>
      </div>
      <div className="flex flex-wrap gap-2 flex-1">
        {activeFilters?.map((filter, index) => (
          <div
            key={`${filter?.key}-${index}`}
            className="inline-flex items-center space-x-1 bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-xs"
          >
            <span className="truncate max-w-32">{filter?.label}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveFilter(filter)}
              className="h-4 w-4 hover:bg-accent/20 rounded-full"
            >
              <Icon name="X" size={10} />
            </Button>
          </div>
        ))}
      </div>
      {activeFilters?.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};

export default FilterChips;