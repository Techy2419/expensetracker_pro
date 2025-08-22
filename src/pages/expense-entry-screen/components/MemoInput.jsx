import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const MemoInput = ({ 
  value = '', 
  onChange = () => {},
  className = '' 
}) => {
  const [charCount, setCharCount] = useState(value?.length);
  const maxLength = 200;

  const handleChange = (e) => {
    const newValue = e?.target?.value;
    setCharCount(newValue?.length);
    onChange(newValue);
  };

  const quickMemos = [
    "Lunch with colleagues",
    "Grocery shopping",
    "Gas for car",
    "Coffee break",
    "Online subscription",
    "Parking fee",
    "Taxi ride",
    "Dinner out"
  ];

  const handleQuickMemoSelect = (memo) => {
    onChange(memo);
    setCharCount(memo?.length);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Memo</h3>
        <span className="text-sm text-muted-foreground">
          {charCount}/{maxLength}
        </span>
      </div>
      {/* Memo Input */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={value}
            onChange={handleChange}
            placeholder="Add a note about this expense (optional)"
            maxLength={maxLength}
            rows={3}
            className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
          />
          {value && (
            <button
              onClick={() => {
                onChange('');
                setCharCount(0);
              }}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>

        {/* Quick Memo Suggestions */}
        {!value && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Quick suggestions</p>
            <div className="flex flex-wrap gap-2">
              {quickMemos?.map((memo, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMemoSelect(memo)}
                  className="px-3 py-1 text-sm bg-card border border-border rounded-full text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                >
                  {memo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Character count warning */}
        {charCount > maxLength * 0.8 && (
          <div className="flex items-center space-x-2 text-warning">
            <Icon name="AlertTriangle" size={16} />
            <span className="text-sm">
              {charCount >= maxLength ? 'Character limit reached' : 'Approaching character limit'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoInput;