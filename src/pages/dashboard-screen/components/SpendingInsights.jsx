import React from 'react';
import Icon from '../../../components/AppIcon';

const SpendingInsights = ({ insights = [], className = "" }) => {
  // Remove mockInsights and fallback logic
  if (!insights.length) {
    return (
      <div className={`bg-card rounded-lg border border-border ${className}`}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Lightbulb" size={24} className="text-muted-foreground" />
          </div>
          <h4 className="font-medium text-card-foreground mb-2">No insights available</h4>
          <p className="text-sm text-muted-foreground">
            Track more expenses to get personalized insights
          </p>
        </div>
      </div>
    );
  }

  const getInsightColor = (type, isPositive) => {
    if (type === 'alert') return 'border-warning/20 bg-warning/5';
    if (isPositive) return 'border-accent/20 bg-accent/5';
    return 'border-error/20 bg-error/5';
  };

  const getValueColor = (type, isPositive) => {
    if (type === 'alert') return 'text-warning';
    if (isPositive) return 'text-accent';
    return 'text-error';
  };

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-card-foreground">Spending Insights</h3>
          <button className="text-sm text-accent hover:text-accent/80 transition-colors duration-150">
            View More
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {insights?.map((insight) => (
          <div 
            key={insight?.id}
            className={`p-4 rounded-lg border transition-all duration-150 ${getInsightColor(insight?.type, insight?.isPositive)}`}
          >
            <div className="flex items-start space-x-3">
              {/* Insight Icon */}
              <div className={`w-10 h-10 ${insight?.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon name={insight?.icon} size={18} color="white" strokeWidth={2.5} />
              </div>

              {/* Insight Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-card-foreground">
                    {insight?.title}
                  </h4>
                  <span className={`text-lg font-bold ${getValueColor(insight?.type, insight?.isPositive)}`}>
                    {insight?.value}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {insight?.description}
                </p>

                {/* Action Button */}
                <button className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors duration-150 ${
                  insight?.type === 'alert' ?'bg-warning/10 text-warning hover:bg-warning/20' 
                    : insight?.isPositive
                      ? 'bg-accent/10 text-accent hover:bg-accent/20' :'bg-error/10 text-error hover:bg-error/20'
                }`}>
                  {insight?.action}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingInsights;