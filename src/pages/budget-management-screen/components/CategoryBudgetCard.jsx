import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CategoryBudgetCard = ({ 
  category,
  onEdit = () => {},
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Food & Dining': 'UtensilsCrossed',
      'Transportation': 'Car',
      'Shopping': 'ShoppingBag',
      'Entertainment': 'Gamepad2',
      'Bills & Utilities': 'Receipt',
      'Healthcare': 'Heart',
      'Travel': 'Plane',
      'Education': 'GraduationCap',
      'Groceries': 'ShoppingCart',
      'Personal Care': 'User'
    };
    return iconMap?.[categoryName] || 'DollarSign';
  };

  const categoryLabelMap = {
    food: 'Food & Dining',
    transport: 'Transportation',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills & Utilities',
    health: 'Healthcare',
    travel: 'Travel',
    other: 'Other',
  };

  const displayName = categoryLabelMap[category?.category || category?.name] || category?.name || 'Other';

  return (
    <div className={`bg-card border border-border rounded-lg p-4 hover:bg-card/80 transition-colors duration-150 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon 
              name={getCategoryIcon(displayName)} 
              size={18} 
              className="text-accent" 
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              ${category?.spent} of ${category?.budget}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getStatusColor(category?.status)}`}>
            {category?.percentage}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8"
          >
            <Icon 
              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
              size={16} 
            />
          </Button>
        </div>
      </div>
      <div className="mb-3">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(category?.status)}`}
            style={{ width: `${Math.min(category?.percentage, 100)}%` }}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-border animate-slide-in">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Remaining</span>
              <p className={`font-mono ${getStatusColor(category?.status)}`}>
                ${category?.remaining}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Expense</span>
              <p className="font-mono text-foreground">${category?.lastExpense}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Transactions</span>
              <p className="font-mono text-foreground">{category?.transactions}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Avg/Day</span>
              <p className="font-mono text-foreground">${category?.avgPerDay}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
              iconName="Edit"
              iconPosition="left"
              className="flex-1"
            >
              Edit Budget
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="TrendingUp"
              iconPosition="left"
              className="flex-1"
            >
              View Trends
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBudgetCard;