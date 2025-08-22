import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const QuickExpenseEntry = ({ onExpenseAdd = () => {}, className = "", categories = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async () => {
    if (!amount || !category) return;

    setIsSubmitting(true);
    
    const expense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category,
      memo: memo || '',
      date: new Date()?.toISOString(),
      timestamp: new Date()
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onExpenseAdd(expense);
    
    // Reset form
    setAmount('');
    setCategory('');
    setMemo('');
    setIsExpanded(false);
    setIsSubmitting(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setAmount('');
    setCategory('');
    setMemo('');
  };

  return (
    <div className={`bg-card rounded-lg border border-border transition-all duration-300 ${className}`}>
      {!isExpanded ? (
        // Collapsed Quick Entry
        (<button
          onClick={handleExpand}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors duration-150 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <Icon name="Plus" size={20} color="white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-card-foreground">Quick Add Expense</h3>
              <p className="text-sm text-muted-foreground">Tap to add a new expense</p>
            </div>
          </div>
          <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
        </button>)
      ) : (
        // Expanded Form
        (<div className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-card-foreground">Add New Expense</h3>
            <button
              onClick={handleCollapse}
              className="p-1 hover:bg-muted rounded-full transition-colors duration-150"
            >
              <Icon name="X" size={18} className="text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Amount Input */}
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e?.target?.value)}
              required
              min="0"
              step="0.01"
            />

            {/* Category Select */}
            <Select
              label="Category"
              placeholder="Select category"
              options={categories}
              value={category}
              onChange={setCategory}
              required
            />

            {/* Memo Input */}
            <Input
              label="Memo (Optional)"
              type="text"
              placeholder="Add a note..."
              value={memo}
              onChange={(e) => setMemo(e?.target?.value)}
            />

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCollapse}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleQuickAdd}
                loading={isSubmitting}
                disabled={!amount || !category}
                className="flex-1"
                iconName="Plus"
                iconPosition="left"
              >
                Add Expense
              </Button>
            </div>
          </div>
        </div>)
      )}
    </div>
  );
};

export default QuickExpenseEntry;