import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BudgetTemplateCard = ({ 
  template,
  onApply = () => {},
  className = ""
}) => {
  const getTemplateIcon = (type) => {
    const iconMap = {
      'student': 'GraduationCap',
      'family': 'Users',
      'professional': 'Briefcase',
      'minimalist': 'Minus',
      'entrepreneur': 'TrendingUp'
    };
    return iconMap?.[type] || 'Target';
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 hover:bg-card/80 transition-colors duration-150 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon 
            name={getTemplateIcon(template?.type)} 
            size={18} 
            className="text-accent" 
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">{template?.name}</h3>
          <p className="text-xs text-muted-foreground">{template?.description}</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {template?.categories?.slice(0, 3)?.map((category, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{category?.name}</span>
            <span className="font-mono text-foreground">{category?.percentage}%</span>
          </div>
        ))}
        {template?.categories?.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{template?.categories?.length - 3} more categories
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs">
          <span className="text-muted-foreground">Total Budget</span>
          <p className="font-mono text-foreground">${template?.totalBudget}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onApply(template)}
          iconName="Download"
          iconPosition="left"
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default BudgetTemplateCard;