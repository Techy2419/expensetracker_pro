import React from 'react';
import Icon from '../../../components/AppIcon';

const MonthlyGroupHeader = ({ month, year, totalAmount, transactionCount }) => {
  const formatMonth = (month, year) => {
    const date = new Date(year, month - 1);
    return date?.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Calendar" size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {formatMonth(month, year)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-foreground">
            -${totalAmount?.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            Total spent
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyGroupHeader;