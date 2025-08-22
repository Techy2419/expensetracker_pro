import React from 'react';
import Icon from '../../../components/AppIcon';

const AddProfileCard = ({ 
  onClick = () => {},
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 bg-card border-2 border-dashed border-border 
        hover:border-accent hover:bg-card/80 
        transition-all duration-200 text-center group
        rounded-lg min-h-[280px] flex flex-col items-center justify-center
        ${className}
      `}
    >
      {/* Plus Icon */}
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors duration-200">
        <Icon 
          name="Plus" 
          size={32} 
          className="text-muted-foreground group-hover:text-accent transition-colors duration-200" 
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors duration-200">
          Add New Profile
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Create a separate profile for different expense categories or family members
        </p>
      </div>

      {/* Features List */}
      <div className="mt-6 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Icon name="Check" size={12} className="text-accent" />
          <span>Separate budgets & goals</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Check" size={12} className="text-accent" />
          <span>Individual expense tracking</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Check" size={12} className="text-accent" />
          <span>Custom categories</span>
        </div>
      </div>
    </button>
  );
};

export default AddProfileCard;