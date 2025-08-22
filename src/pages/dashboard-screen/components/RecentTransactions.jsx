import React from 'react';
import Icon from '../../../components/AppIcon';

const RecentTransactions = ({ transactions = [], className = "" }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatDate = (date) => {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes < 5) return 'Just now';
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return transactionDate?.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (!transactions.length) {
    return <div className={className + " text-center text-muted-foreground py-8"}>No recent transactions.</div>;
  }

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-card-foreground">Recent Transactions</h3>
          <button className="text-sm text-accent hover:text-accent/80 transition-colors duration-150">
            View All
          </button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {transactions?.map((transaction) => (
          <div key={transaction?.id} className="p-4 hover:bg-muted/30 transition-colors duration-150">
            <div className="flex items-center space-x-3">
              {/* Category Icon */}
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{transaction?.categoryIcon}</span>
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-card-foreground truncate">
                    {transaction?.memo || transaction?.categoryLabel}
                  </h4>
                  <span className="text-lg font-semibold text-error ml-2">
                    -{formatCurrency(transaction?.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">
                    {transaction?.categoryLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(transaction?.date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;