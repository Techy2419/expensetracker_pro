import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const BudgetAlerts = ({ 
  alerts = [],
  onUpdateAlert = () => {},
  className = ""
}) => {
  const [alertSettings, setAlertSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    monthlyReports: true,
    budgetExceeded: true,
    budgetWarning: true,
    unusualSpending: false
  });

  const getAlertIcon = (type) => {
    switch (type) {
      case 'exceeded':
        return 'AlertTriangle';
      case 'warning':
        return 'AlertCircle';
      default:
        return 'Info';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'exceeded':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-accent';
    }
  };

  const handleSettingChange = (setting, value) => {
    setAlertSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const alertList = alerts;
  if (!alertList.length) {
    return <div className={className + " text-center text-muted-foreground py-8"}>No alerts.</div>;
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Budget Alerts</h3>
          <p className="text-sm text-muted-foreground">Recent notifications and settings</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName="Settings"
          iconPosition="left"
        >
          Settings
        </Button>
      </div>
      {/* Recent Alerts */}
      <div className="space-y-3 mb-6">
        {alertList?.map((alert) => (
          <div 
            key={alert?.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors duration-150 ${
              alert?.isRead ? 'border-border bg-muted/20' : 'border-accent/20 bg-accent/5'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              alert?.type === 'exceeded' ? 'bg-error/10' : 
              alert?.type === 'warning' ? 'bg-warning/10' : 'bg-accent/10'
            }`}>
              <Icon 
                name={getAlertIcon(alert?.type)} 
                size={16} 
                className={getAlertColor(alert?.type)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-accent">{alert?.category}</span>
                <span className="text-xs text-muted-foreground">{alert?.timestamp}</span>
              </div>
              <p className="text-sm text-foreground mb-1">{alert?.message}</p>
              <p className="text-xs font-mono text-muted-foreground">{alert?.amount}</p>
            </div>
            {!alert?.isRead && (
              <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
      {/* Alert Settings */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Notification Preferences</h4>
        <div className="space-y-3">
          <Checkbox
            label="Email Notifications"
            description="Receive budget alerts via email"
            checked={alertSettings?.emailNotifications}
            onChange={(e) => handleSettingChange('emailNotifications', e?.target?.checked)}
          />
          <Checkbox
            label="Push Notifications"
            description="Get instant notifications on your device"
            checked={alertSettings?.pushNotifications}
            onChange={(e) => handleSettingChange('pushNotifications', e?.target?.checked)}
          />
          <Checkbox
            label="Budget Exceeded Alerts"
            description="Notify when spending exceeds budget"
            checked={alertSettings?.budgetExceeded}
            onChange={(e) => handleSettingChange('budgetExceeded', e?.target?.checked)}
          />
          <Checkbox
            label="Budget Warning Alerts"
            description="Notify when approaching budget limit"
            checked={alertSettings?.budgetWarning}
            onChange={(e) => handleSettingChange('budgetWarning', e?.target?.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetAlerts;