import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ExpenseFormActions = ({ 
  onSave = () => {},
  onCancel = () => {},
  onSaveAndAdd = () => {},
  isValid = false,
  isSaving = false,
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Save Button */}
      <Button
        onClick={onSave}
        disabled={!isValid || isSaving}
        loading={isSaving}
        iconName="Check"
        iconPosition="left"
        className="w-full"
        size="lg"
      >
        {isSaving ? 'Saving...' : 'Save Expense'}
      </Button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={onSaveAndAdd}
          disabled={!isValid || isSaving}
          iconName="Plus"
          iconPosition="left"
          className="w-full"
        >
          Save & Add Another
        </Button>
        
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          iconName="X"
          iconPosition="left"
          className="w-full"
        >
          Cancel
        </Button>
      </div>

      {/* Form Validation Status */}
      {!isValid && (
        <div className="flex items-center space-x-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <Icon name="AlertTriangle" size={16} className="text-warning" />
          <p className="text-sm text-warning">
            Please fill in all required fields to save the expense
          </p>
        </div>
      )}

      {/* Auto-save Indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
        <Icon name="Save" size={12} />
        <span>Changes are automatically saved as drafts</span>
      </div>
    </div>
  );
};

export default ExpenseFormActions;