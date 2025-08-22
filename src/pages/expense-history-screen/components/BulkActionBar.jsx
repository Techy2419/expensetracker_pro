import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionBar = ({ 
  selectedCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkDelete, 
  onBulkExport,
  onCancel,
  totalCount 
}) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed top-16 md:top-32 left-0 right-0 bg-accent text-accent-foreground shadow-modal z-100 animate-slide-in">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-accent-foreground hover:bg-accent-foreground/10"
          >
            <Icon name="X" size={20} />
          </Button>
          <span className="font-medium">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-accent-foreground hover:bg-accent-foreground/10"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onBulkExport}
            className="text-accent-foreground hover:bg-accent-foreground/10"
          >
            <Icon name="Download" size={18} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onBulkDelete}
            className="text-accent-foreground hover:bg-red-500/20"
          >
            <Icon name="Trash2" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;