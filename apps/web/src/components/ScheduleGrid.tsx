/**
 * Schedule Grid Component - Pure presentational component for rendering schedules
 */

import React from 'react';
import type { Schedule, Day, Shift } from '@/lib/scheduleClient';

interface ScheduleGridProps {
  readonly schedule: Schedule;
  readonly className?: string;
}

export function ScheduleGrid({ schedule, className = '' }: Readonly<ScheduleGridProps>) {
  // Get all unique time slots across all days
  const timeSlots = React.useMemo(() => {
    const times = new Set<string>();
    schedule.days.forEach(day => {
      day.shifts.forEach(shift => {
        times.add(shift.time);
      });
    });
    return Array.from(times).sort((a, b) => a.localeCompare(b));
  }, [schedule]);

  // Helper function to find shift for a specific day and time
  const findShift = (day: Day, time: string): Shift | undefined => {
    return day.shifts.find(shift => shift.time === time);
  };

  if (!schedule.days.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No schedule data available
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-3 text-left font-medium">
              Time
            </th>
            {schedule.days.map(day => (
              <th key={day.name} className="border border-border p-3 text-left font-medium">
                {day.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time} className="hover:bg-muted/50">
              <td className="border border-border p-3 font-medium bg-muted/20">
                {formatTime(time)}
              </td>
              {schedule.days.map(day => {
                const shift = findShift(day, time);
                return (
                  <td key={`${day.name}-${time}`} className="border border-border p-3 min-w-[150px]">
                    {shift?.assistants?.length ? (
                      <div className="space-y-1">
                        {shift.assistants.map(assistant => (
                          <div
                            key={assistant.id}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-2 py-1 text-sm"
                          >
                            {assistant.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Format time string for display
 * Converts 24-hour format to a more readable format
 */
function formatTime(time: string): string {
  try {
    // Handle various time formats
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const min = minutes || '00';
      
      if (hour === 0) return `12:${min} AM`;
      if (hour < 12) return `${hour}:${min} AM`;
      if (hour === 12) return `12:${min} PM`;
      return `${hour - 12}:${min} PM`;
    }
    
    // Return as-is if not in expected format
    return time;
  } catch {
    return time;
  }
}

/**
 * Empty state component for when no schedule is available
 */
export function EmptyScheduleState() {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="text-muted-foreground mb-6">
          <svg
            className="mx-auto h-16 w-16 mb-4 text-blue-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7h8M8 7l-3 9h14l-3-9"
            />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No Schedule Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first schedule for the help desk.
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium mb-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How to get started
          </div>
          <ol className="text-left space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>1. Select your start and end dates above</li>
            <li>2. Click the blue "Generate Schedule" button</li>
            <li>3. Review and customize staff assignments</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state component for schedule generation
 */
export function ScheduleLoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center space-x-2 text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Generating schedule...</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        This may take a few moments to optimize staff assignments.
      </p>
    </div>
  );
}

/**
 * Error state component for schedule generation failures
 */
interface ScheduleErrorStateProps {
  readonly error: string;
  readonly onRetry?: () => void;
}

export function ScheduleErrorState({ error, onRetry }: Readonly<ScheduleErrorStateProps>) {
  return (
    <div className="text-center py-12">
      <div className="text-destructive mb-4">
        <svg
          className="mx-auto h-12 w-12 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        Schedule Generation Failed
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}