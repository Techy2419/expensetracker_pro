import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

export const predefinedCategories = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'bg-orange-600' },
  { id: 'transport', name: 'Transportation', icon: 'Car', color: 'bg-blue-600' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'bg-purple-600' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: 'bg-pink-600' },
  { id: 'health', name: 'Healthcare', icon: 'Heart', color: 'bg-red-600' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'Receipt', color: 'bg-yellow-600' },
  { id: 'education', name: 'Education', icon: 'BookOpen', color: 'bg-green-600' },
  { id: 'travel', name: 'Travel', icon: 'Plane', color: 'bg-indigo-600' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', color: 'bg-emerald-600' },
  { id: 'pets', name: 'Pets', icon: 'Heart', color: 'bg-amber-600' },
  { id: 'gifts', name: 'Gifts', icon: 'Gift', color: 'bg-rose-600' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: 'bg-gray-600' }
];

export const CategorySelector = ({ 
  selectedCategory = null, 
  onCategorySelect = () => {},
  className = '',
  compact = false
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-blue-600');

  const availableIcons = [
    'Tag', 'Coffee', 'Home', 'Briefcase', 'Music', 'Camera', 'Gamepad2',
    'Smartphone', 'Laptop', 'Book', 'Palette', 'Wrench', 'Zap'
  ];

  const availableColors = [
    'bg-red-600', 'bg-orange-600', 'bg-yellow-600', 'bg-green-600',
    'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600',
    'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 'bg-gray-600'
  ];

  const handleCreateCategory = () => {
    if (newCategoryName?.trim()) {
      const newCategory = {
        id: `custom_${Date.now()}`,
        name: newCategoryName?.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        isCustom: true
      };
      onCategorySelect(newCategory);
      setShowCreateModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('Tag');
      setNewCategoryColor('bg-blue-600');
    }
  };

  return (
    <div className={className}>
      <h3 className={`text-lg font-semibold text-foreground mb-4 ${compact ? 'text-base mb-2' : ''}`}>Category</h3>
      {/* Category Grid */}
      <div className={`grid ${compact ? 'grid-cols-4 gap-2 mb-2' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4'}`}>
        {predefinedCategories?.map((category) => (
          <button
            key={category?.id}
            onClick={() => onCategorySelect(category)}
            className={`flex flex-col items-center ${compact ? 'p-1 rounded border text-xs' : 'p-3 rounded-lg border-2'} transition-all duration-200 ${
              selectedCategory?.id === category?.id
                ? 'border-accent bg-accent/10' :'border-border hover:border-accent/50 hover:bg-card'
            }`}
          >
            <div className={`${compact ? 'w-7 h-7 mb-1' : 'w-10 h-10 mb-2'} ${category?.color} rounded-full flex items-center justify-center`}>
              <Icon name={category?.icon} size={compact ? 14 : 20} color="white" />
            </div>
            <span className={`text-center text-foreground font-medium leading-tight ${compact ? 'text-xs' : 'text-xs'}`}>{category?.name}</span>
          </button>
        ))}
        
        {/* Add Custom Category Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex flex-col items-center ${compact ? 'p-1 rounded border text-xs' : 'p-3 rounded-lg border-2 border-dashed'} border-border hover:border-accent/50 hover:bg-card transition-all duration-200`}
        >
          <div className={`${compact ? 'w-7 h-7 mb-1' : 'w-10 h-10 mb-2'} bg-muted rounded-full flex items-center justify-center`}>
            <Icon name="Plus" size={compact ? 14 : 20} className="text-muted-foreground" />
          </div>
          <span className={`text-center text-muted-foreground font-medium leading-tight ${compact ? 'text-xs' : 'text-xs'}`}>Add New</span>
        </button>
      </div>
      {/* Selected Category Display */}
      {selectedCategory && (
        <div className={`flex items-center space-x-3 p-3 bg-card rounded-lg border border-border ${compact ? 'mt-1' : ''}`}>
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} ${selectedCategory?.color} rounded-full flex items-center justify-center`}>
            <Icon name={selectedCategory?.icon} size={compact ? 12 : 16} color="white" />
          </div>
          <span className={`text-foreground font-medium ${compact ? 'text-xs' : ''}`}>{selectedCategory?.name}</span>
          {selectedCategory?.isCustom && (
            <span className={`text-xs bg-accent/20 text-accent px-2 py-1 rounded-full ${compact ? 'px-1 py-0.5' : ''}`}>Custom</span>
          )}
        </div>
      )}
      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-200">
          <div className="bg-popover rounded-lg p-6 w-full max-w-md animate-slide-in">
            <h4 className="text-lg font-semibold text-popover-foreground mb-4">
              Create Custom Category
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-popover-foreground mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e?.target?.value)}
                  placeholder="Enter category name"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-popover-foreground mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableIcons?.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => setNewCategoryIcon(iconName)}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                        newCategoryIcon === iconName
                          ? 'border-accent bg-accent/10' :'border-border hover:border-accent/50'
                      }`}
                    >
                      <Icon name={iconName} size={20} className="text-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-popover-foreground mb-2">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableColors?.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${color} ${
                        newCategoryColor === color
                          ? 'border-white scale-110' :'border-border hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border">
                <div className={`w-8 h-8 ${newCategoryColor} rounded-full flex items-center justify-center`}>
                  <Icon name={newCategoryIcon} size={16} color="white" />
                </div>
                <span className="text-foreground font-medium">
                  {newCategoryName || 'Category Name'}
                </span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName?.trim()}
                className="flex-1"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;