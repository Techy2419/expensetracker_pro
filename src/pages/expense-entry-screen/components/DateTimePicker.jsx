import React from 'react';
import Input from '../../../components/ui/Input';

const DateTimePicker = ({ 
  date = '', 
  time = '', 
  onDateChange = () => {}, 
  onTimeChange = () => {},
  className = '' 
}) => {
  // Get current date and time as defaults
  const getCurrentDate = () => {
    const now = new Date();
    return now?.toISOString()?.split('T')?.[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now?.toTimeString()?.slice(0, 5);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date?.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr?.split(':');
    const date = new Date();
    date?.setHours(parseInt(hours), parseInt(minutes));
    return date?.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Date & Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Input
            type="date"
            label="Date"
            value={date || getCurrentDate()}
            onChange={(e) => onDateChange(e?.target?.value)}
            className="w-full"
          />
          {date && (
            <p className="text-sm text-muted-foreground">
              {formatDateDisplay(date)}
            </p>
          )}
        </div>

        {/* Time Picker */}
        <div className="space-y-2">
          <Input
            type="time"
            label="Time"
            value={time || getCurrentTime()}
            onChange={(e) => onTimeChange(e?.target?.value)}
            className="w-full"
          />
          {time && (
            <p className="text-sm text-muted-foreground">
              {formatTimeDisplay(time)}
            </p>
          )}
        </div>
      </div>
      {/* Quick Date Options */}
      <div className="mt-4">
        <p className="text-sm font-medium text-foreground mb-2">Quick Select</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              onDateChange(getCurrentDate());
              onTimeChange(getCurrentTime());
            }}
            className="px-3 py-1 text-sm bg-card border border-border rounded-full text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            Now
          </button>
          <button
            onClick={() => {
              const yesterday = new Date();
              yesterday?.setDate(yesterday?.getDate() - 1);
              onDateChange(yesterday?.toISOString()?.split('T')?.[0]);
            }}
            className="px-3 py-1 text-sm bg-card border border-border rounded-full text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              const lastWeek = new Date();
              lastWeek?.setDate(lastWeek?.getDate() - 7);
              onDateChange(lastWeek?.toISOString()?.split('T')?.[0]);
            }}
            className="px-3 py-1 text-sm bg-card border border-border rounded-full text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            Last Week
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;