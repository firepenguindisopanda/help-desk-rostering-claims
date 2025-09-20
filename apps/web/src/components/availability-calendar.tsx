"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import type { AvailabilitySlot } from "@/types/registration";

interface AvailabilityCalendarProps {
  readonly selectedSlots: AvailabilitySlot[];
  readonly onSlotsChange: (slots: AvailabilitySlot[]) => void;
  readonly error?: string;
}

export function AvailabilityCalendar({ selectedSlots, onSlotsChange, error }: AvailabilityCalendarProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = Array.from({ length: 8 }, (_, i) => i + 9); // 9am-5pm
  
  const isSelected = (day: number, hour: number): boolean => {
    return selectedSlots.some(slot => 
      slot.day === day && 
      slot.start_time === `${hour.toString().padStart(2, '0')}:00:00`
    );
  };
  
  const toggleSlot = (day: number, hour: number) => {
    const newSlot: AvailabilitySlot = {
      day,
      start_time: `${hour.toString().padStart(2, '0')}:00:00`,
      end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`
    };
    
    const isCurrentlySelected = isSelected(day, hour);
    
    if (isCurrentlySelected) {
      // Remove slot
      const newSlots = selectedSlots.filter(slot => 
        !(slot.day === day && slot.start_time === newSlot.start_time)
      );
      onSlotsChange(newSlots);
    } else {
      // Add slot
      onSlotsChange([...selectedSlots, newSlot]);
    }
  };
  
  const formatTime = (hour: number): string => {
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return `${hour}:00 PM`;
    return `${hour - 12}:00 PM`;
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Weekly Availability *</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Click on the time slots when you are available to work at the help desk.
        </p>
      </div>
      
      <div className="grid grid-cols-6 gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
        {/* Headers */}
        <div></div>
        {days.map(day => (
          <div key={day} className="text-center font-medium py-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            {day}
          </div>
        ))}
        
        {/* Time slots */}
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400 py-2 pr-2">
              {formatTime(hour)}
            </div>
            {days.map((_, dayIndex) => (
              <button
                key={`${dayIndex}-${hour}`}
                type="button"
                className={`h-8 border rounded transition-colors text-xs ${
                  isSelected(dayIndex, hour)
                    ? 'bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600 hover:bg-blue-300 dark:hover:bg-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                }`}
                onClick={() => toggleSlot(dayIndex, hour)}
                aria-label={`Toggle availability for ${days[dayIndex]} at ${formatTime(hour)}`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      
      {selectedSlots.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected {selectedSlots.length} time slot{selectedSlots.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}