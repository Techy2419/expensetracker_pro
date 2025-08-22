import React from 'react';
import Icon from '../../../components/AppIcon';

const LoadingOverlay = ({ isVisible, message = "Authenticating..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-200">
      <div className="bg-card rounded-2xl p-8 shadow-modal border border-border text-center">
        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Icon name="Loader2" size={24} color="white" className="animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Please Wait</h3>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;