import React from 'react';
import Icon from '../../../components/AppIcon';

const MonthlyOverview = ({ 
  currentSpending = 0, 
  monthlyBudget = 0, 
  remainingBudget = 0,
  transactionCount = null,
  avgPerDay = null,
  topCategory = null,
  className = "" 
}) => {
  const spentPercentage = monthlyBudget > 0 ? (currentSpending / monthlyBudget) * 100 : 0;
  const isOverBudget = currentSpending > monthlyBudget;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-error';
    if (spentPercentage > 80) return 'bg-warning';
    return 'bg-accent';
  };

  return (
    <div className={`bg-card rounded-lg p-6 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">This Month</h2>
        <div className="flex items-center space-x-2">
          <Icon name="Calendar" size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">This Month</span>
        </div>
      </div>
      {/* Current Spending */}
      <div className="mb-6">
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-card-foreground">
            {formatCurrency(currentSpending)}
          </span>
          <span className="text-sm text-muted-foreground">spent</span>
        </div>
        
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Budget: {formatCurrency(monthlyBudget)}
            </span>
            <span className={`font-medium ${isOverBudget ? 'text-error' : 'text-accent'}`}>
              {isOverBudget ? 'Over by ' : 'Remaining: '}
              {formatCurrency(Math.abs(remainingBudget))}
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{spentPercentage?.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-card-foreground">{transactionCount !== null ? transactionCount : '-'}</div>
          <div className="text-xs text-muted-foreground">Transactions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-accent">{avgPerDay !== null ? formatCurrency(avgPerDay) : '-'}</div>
          <div className="text-xs text-muted-foreground">Avg/Day</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-warning">{topCategory !== null ? formatCurrency(topCategory) : '-'}</div>
          <div className="text-xs text-muted-foreground">Top Category</div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyOverview;