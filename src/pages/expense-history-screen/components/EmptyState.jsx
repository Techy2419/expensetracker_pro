import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const EmptyState = ({ hasFilters, onClearFilters }) => {
  const navigate = useNavigate();

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon name="Search" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No expenses found
        </h3>
        <p className="text-muted-foreground text-center mb-6 max-w-sm">
          No expenses match your current filters. Try adjusting your search criteria or clear all filters.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
        <Icon name="Receipt" size={32} className="text-accent" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No expenses yet
      </h3>
      <p className="text-muted-foreground text-center mb-8 max-w-sm">
        Start tracking your expenses to see them here. Add your first expense to get started with better financial management.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => navigate('/expense-entry-screen')}
          iconName="Plus"
          iconPosition="left"
        >
          Add First Expense
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/dashboard-screen')}
        >
          View Dashboard
        </Button>
      </div>

      {/* Quick Tips */}
      <div className="mt-12 max-w-md">
        <h4 className="text-sm font-medium text-foreground mb-4 text-center">
          Quick Tips
        </h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Zap" size={12} className="text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">
              Use the + button to quickly add expenses on the go
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Target" size={12} className="text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">
              Set up budgets to track your spending goals
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="TrendingUp" size={12} className="text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">
              View analytics to understand your spending patterns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;