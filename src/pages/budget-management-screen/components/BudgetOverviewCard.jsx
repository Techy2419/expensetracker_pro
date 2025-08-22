import React from 'react';
import Icon from '../../../components/AppIcon';

const BudgetOverviewCard = ({ 
  title, 
  amount, 
  spent, 
  remaining, 
  percentage, 
  status = 'on-track',
  icon = 'DollarSign',
  className = ""
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'bg-error';
      case 'warning':
        return 'bg-warning';
      default:
        return 'bg-success';
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Icon name={icon} size={16} color="white" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
        <div className={`text-xs font-medium ${getStatusColor(status)}`}>
          {percentage}%
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Budget</span>
          <span className="text-sm font-mono text-foreground">${amount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Spent</span>
          <span className="text-sm font-mono text-foreground">${spent}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Remaining</span>
          <span className={`text-sm font-mono ${getStatusColor(status)}`}>
            ${remaining}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(status)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetOverviewCard;