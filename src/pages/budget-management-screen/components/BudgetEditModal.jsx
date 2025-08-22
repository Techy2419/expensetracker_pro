import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { CategorySelector, predefinedCategories } from '../../expense-entry-screen/components/CategorySelector';

const BudgetEditModal = ({ 
  isOpen = false,
  category = null,
  onClose = () => {},
  onSave = () => {},
  className = ""
}) => {
  const [formData, setFormData] = useState({
    category: null,
    budget: '',
    alertThreshold: '80',
    rollover: false,
    period: 'monthly'
  });

  useEffect(() => {
    if (category) {
      const catObj = predefinedCategories.find(c => c.id === (category.category || category.id)) || null;
      setFormData({
        category: catObj,
        budget: category?.amount?.toString() || '',
        alertThreshold: category?.alertThreshold?.toString() || '80',
        rollover: category?.rollover || false,
        period: category?.period || 'monthly'
      });
    } else {
      setFormData({
        category: null,
        budget: '',
        alertThreshold: '80',
        rollover: false,
        period: 'monthly'
      });
    }
  }, [category]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategorySelect = (cat) => {
    setFormData(prev => ({ ...prev, category: cat }));
  };

  const handleSave = () => {
    if (!formData.category) return;
    const updatedCategory = {
      ...category,
      ...formData,
      category: formData.category.id, // ENUM value for DB
      categoryLabel: formData.category.name, // for display
      categoryIcon: formData.category.icon,
      categoryColor: formData.category.color,
      budget: parseFloat(formData?.budget) || 0,
      alertThreshold: parseInt(formData?.alertThreshold) || 80
    };
    onSave(updatedCategory);
    onClose();
  };

  const periodOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className={`bg-popover border border-border rounded-lg shadow-modal w-full max-w-2xl animate-slide-in mt-20 md:mt-32 max-h-[90vh] overflow-y-auto ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-popover-foreground">
            {category ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <CategorySelector
            selectedCategory={formData.category}
            onCategorySelect={handleCategorySelect}
            compact={true}
          />

          <Input
            label="Budget Amount"
            type="number"
            value={formData?.budget}
            onChange={(e) => handleInputChange('budget', e?.target?.value)}
            placeholder="0.00"
            required
          />

          <Select
            label="Budget Period"
            options={periodOptions}
            value={formData?.period}
            onChange={(value) => handleInputChange('period', value)}
          />

          <Input
            label="Alert Threshold (%)"
            type="number"
            value={formData?.alertThreshold}
            onChange={(e) => handleInputChange('alertThreshold', e?.target?.value)}
            placeholder="80"
            description="Get notified when spending reaches this percentage"
            min="1"
            max="100"
          />

          <Checkbox
            label="Enable Rollover"
            description="Unused budget carries over to next period"
            checked={formData?.rollover}
            onChange={(e) => handleInputChange('rollover', e?.target?.checked)}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            iconName="Save"
            iconPosition="left"
          >
            Save Budget
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetEditModal;