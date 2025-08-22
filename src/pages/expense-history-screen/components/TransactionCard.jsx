import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionCard = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  onDuplicate,
  isSelected,
  onSelect,
  showSelection = false
}) => {
  const [showActions, setShowActions] = useState(false);

  const getCategoryIcon = (category) => {
    const iconMap = {
      food: 'UtensilsCrossed',
      transport: 'Car',
      shopping: 'ShoppingBag',
      entertainment: 'Film',
      bills: 'Receipt',
      healthcare: 'Heart',
      education: 'BookOpen',
      travel: 'Plane',
      groceries: 'ShoppingCart',
      other: 'MoreHorizontal'
    };
    return iconMap?.[category] || 'MoreHorizontal';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      food: 'text-orange-500',
      transport: 'text-blue-500',
      shopping: 'text-purple-500',
      entertainment: 'text-pink-500',
      bills: 'text-red-500',
      healthcare: 'text-green-500',
      education: 'text-indigo-500',
      travel: 'text-cyan-500',
      groceries: 'text-emerald-500',
      other: 'text-gray-500'
    };
    return colorMap?.[category] || 'text-gray-500';
  };

  const getPaymentMethodIcon = (method) => {
    const iconMap = {
      cash: 'Banknote',
      credit_card: 'CreditCard',
      debit_card: 'CreditCard',
      bank_transfer: 'Building2',
      digital_wallet: 'Smartphone'
    };
    return iconMap?.[method] || 'CreditCard';
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date)?.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  return (
    <>
      <div 
        className={`
          bg-card border border-border rounded-lg p-4 
          transition-all duration-150 hover:shadow-card
          ${isSelected ? 'ring-2 ring-accent border-accent' : ''}
          ${showSelection ? 'cursor-pointer' : ''}
        `}
        onClick={() => showSelection && onSelect && onSelect(transaction?.id)}
        onContextMenu={(e) => {
          e?.preventDefault();
          handleLongPress();
        }}
      >
        <div className="flex items-start justify-between">
          {/* Left Section */}
          <div className="flex items-start space-x-3 flex-1">
            {/* Selection Checkbox */}
            {showSelection && (
              <div className="pt-1">
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  ${isSelected ? 'bg-accent border-accent' : 'border-border'}
                `}>
                  {isSelected && <Icon name="Check" size={12} color="white" />}
                </div>
              </div>
            )}

            {/* Category Icon */}
            <div className={`
              w-10 h-10 rounded-full bg-muted flex items-center justify-center
              ${getCategoryColor(transaction?.category)}
            `}>
              <Icon name={getCategoryIcon(transaction?.category)} size={20} />
            </div>

            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {transaction?.description}
                </h3>
                <span className="text-lg font-semibold text-foreground ml-2">
                  -${transaction?.amount?.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground capitalize">
                  {transaction?.category?.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center space-x-1">
                  <Icon 
                    name={getPaymentMethodIcon(transaction?.payment_method)} 
                    size={12} 
                    className="text-muted-foreground"
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {transaction?.payment_method?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(transaction?.expense_date)} at {formatTime(transaction?.expense_date)}
                </span>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e?.stopPropagation();
                      onEdit && onEdit(transaction);
                    }}
                    className="h-6 w-6"
                  >
                    <Icon name="Edit2" size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e?.stopPropagation();
                      setShowActions(true);
                    }}
                    className="h-6 w-6"
                  >
                    <Icon name="MoreVertical" size={12} />
                  </Button>
                </div>
              </div>

              {/* Memo */}
              {transaction?.memo && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {transaction?.memo}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Action Menu */}
      {showActions && (
        <>
          <div 
            className="fixed inset-0 z-400" 
            onClick={() => setShowActions(false)}
          />
          <div className="fixed bottom-4 left-4 right-4 bg-popover border border-border rounded-lg shadow-modal z-500 animate-slide-in">
            <div className="p-2">
              <Button
                variant="ghost"
                onClick={() => {
                  onEdit && onEdit(transaction);
                  setShowActions(false);
                }}
                className="w-full justify-start"
              >
                <Icon name="Edit2" size={16} className="mr-3" />
                Edit Transaction
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onDuplicate && onDuplicate(transaction);
                  setShowActions(false);
                }}
                className="w-full justify-start"
              >
                <Icon name="Copy" size={16} className="mr-3" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onDelete && onDelete(transaction?.id);
                  setShowActions(false);
                }}
                className="w-full justify-start text-error hover:text-error"
              >
                <Icon name="Trash2" size={16} className="mr-3" />
                Delete
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TransactionCard;