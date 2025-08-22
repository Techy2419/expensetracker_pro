import React from 'react';
import Icon from '../../../components/AppIcon';

const AchievementNotifications = ({ achievements = [], className = "" }) => {
  // Remove mockAchievements and fallback logic
  const newAchievements = achievements?.filter(achievement => achievement?.isNew);
  const totalPoints = achievements?.reduce((sum, achievement) => sum + achievement?.points, 0);

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-card-foreground">Achievements</h3>
            {newAchievements?.length > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                {newAchievements?.length} New
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Zap" size={16} className="text-warning" />
            <span className="text-sm font-medium text-card-foreground">{totalPoints} pts</span>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {achievements?.slice(0, 3)?.map((achievement) => (
          <div 
            key={achievement?.id} 
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-150 ${
              achievement?.isNew ? 'bg-accent/10 border border-accent/20' : 'hover:bg-muted/30'
            }`}
          >
            {/* Achievement Icon */}
            <div className={`w-10 h-10 ${achievement?.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <Icon name={achievement?.icon} size={18} color="white" strokeWidth={2.5} />
            </div>

            {/* Achievement Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-card-foreground truncate">
                  {achievement?.title}
                </h4>
                {achievement?.isNew && (
                  <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {achievement?.description}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  Earned {formatDate(achievement?.earnedDate)}
                </span>
                <div className="flex items-center space-x-1">
                  <Icon name="Zap" size={12} className="text-warning" />
                  <span className="text-xs font-medium text-warning">
                    +{achievement?.points} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* View All Button */}
        <button className="w-full py-3 text-sm text-accent hover:text-accent/80 transition-colors duration-150 border-t border-border mt-4 pt-4">
          View All Achievements
        </button>
      </div>
      {achievements?.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Trophy" size={24} className="text-muted-foreground" />
          </div>
          <h4 className="font-medium text-card-foreground mb-2">No achievements yet</h4>
          <p className="text-sm text-muted-foreground">
            Start tracking expenses to earn your first badge!
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementNotifications;