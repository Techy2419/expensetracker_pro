import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BudgetChart = ({ 
  data = [],
  className = ""
}) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="text-sm font-medium text-popover-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-4 text-xs">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry?.color }}
                />
                <span className="text-muted-foreground capitalize">{entry?.dataKey}</span>
              </div>
              <span className="font-mono text-popover-foreground">
                ${entry?.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Budget Performance</h3>
          <p className="text-sm text-muted-foreground">No budget data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Budget Performance</h3>
        <p className="text-sm text-muted-foreground">Monthly budget vs actual spending</p>
      </div>
      <div className="w-full h-80" aria-label="Budget Performance Chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="month" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#888888', fontSize: '12px' }}
            />
            <Bar 
              dataKey="budget" 
              fill="#10b981" 
              name="Budget"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="spent" 
              fill="#f59e0b" 
              name="Spent"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetChart;