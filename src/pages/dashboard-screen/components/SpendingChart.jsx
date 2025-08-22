import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SpendingChart = ({ data = [], className = "" }) => {
  // Remove mockData and fallback logic
  if (!data.length) {
    return <div className={className + " text-center text-muted-foreground py-8"}>No spending data.</div>;
  }
  const totalSpending = data?.reduce((sum, item) => sum + item?.value, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0];
      const percentage = ((data?.value / totalSpending) * 100)?.toFixed(1);
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{data?.payload?.icon}</span>
            <span className="font-medium text-popover-foreground">{data?.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(data?.value)} ({percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry?.color }}
            />
            <span className="text-xs">{entry?.payload?.icon}</span>
            <span className="text-card-foreground truncate">{entry?.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-card-foreground">Spending by Category</h3>
        <span className="text-sm text-muted-foreground">This Month</span>
      </div>
      {data?.length > 0 ? (
        <div>
          {/* Chart Container */}
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry?.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total in Center */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-card-foreground">
              {formatCurrency(totalSpending)}
            </div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {data?.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item?.color }}
                />
                <span className="text-xs">{item?.icon}</span>
                <span className="text-card-foreground truncate flex-1">{item?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(item?.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h4 className="font-medium text-card-foreground mb-2">No spending data</h4>
          <p className="text-sm text-muted-foreground">
            Add some expenses to see your spending breakdown
          </p>
        </div>
      )}
    </div>
  );
};

export default SpendingChart;