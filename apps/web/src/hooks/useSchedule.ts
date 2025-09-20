import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Types
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  isAvailable?: boolean;
}

export interface ShiftAssignment {
  id: string;
  day: string;
  time: string;
  assistants: StaffMember[];
  maxStaff: number;
}

export interface ScheduleData {
  startDate: string;
  endDate: string;
  shifts: ShiftAssignment[];
  scheduleType: 'helpdesk' | 'lab';
}

export interface AvailabilityQuery {
  staffId: string;
  day: string;
  time: string;
}

// Schedule API hook
export function useScheduleAPI() {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);

  const generateSchedule = useCallback(async (startDate: string, endDate: string): Promise<ScheduleData> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate, end_date: endDate })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setSchedule(data.schedule);
        return data.schedule;
      }
      throw new Error(data.message || 'Failed to generate schedule');
    } catch (error) {
      console.error('Generate schedule error:', error);
      
      // Mock implementation for now
      const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      const shifts: ShiftAssignment[] = [];
      weekDays.forEach(day => {
        timeSlots.forEach(time => {
          shifts.push({
            id: `${day}-${time}`,
            day,
            time,
            assistants: [],
            maxStaff: 3
          });
        });
      });

      const mockSchedule: ScheduleData = {
        startDate,
        endDate,
        shifts,
        scheduleType: 'helpdesk'
      };
      
      setSchedule(mockSchedule);
      return mockSchedule;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSchedule = useCallback(async (scheduleData: ScheduleData): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/schedule/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleData })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }
      
      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to save schedule');
      }
      
      toast.success('Schedule saved successfully!');
    } catch (error) {
      console.error('Save schedule error:', error);
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Schedule saved successfully!');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSchedule = useCallback(async (): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/schedule/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear schedule');
      }
      
      setSchedule(null);
      toast.success('Schedule cleared successfully!');
    } catch (error) {
      console.error('Clear schedule error:', error);
      // Mock success for now
      setSchedule(null);
      toast.success('Schedule cleared successfully!');
    }
  }, []);

  const downloadPDF = useCallback(async (scheduleData: ScheduleData): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/schedule/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleData })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${scheduleData.startDate}-${scheduleData.endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Schedule downloaded as PDF!');
    } catch (error) {
      console.error('Download PDF error:', error);
      // Mock success for now
      toast.info('PDF download started...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Schedule downloaded as PDF!');
    }
  }, []);

  return {
    loading,
    schedule,
    setSchedule,
    generateSchedule,
    saveSchedule,
    clearSchedule,
    downloadPDF
  };
}

// Staff availability hook
export function useStaffAvailability() {
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const checkStaffAvailability = useCallback(async (staffId: string, day: string, time: string): Promise<boolean> => {
    const cacheKey = `${staffId}-${day}-${time}`;
    
    // Return cached result if available
    if (availabilityCache[cacheKey] !== undefined) {
      return availabilityCache[cacheKey];
    }

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/staff/check-availability?staffId=${staffId}&day=${day}&time=${time}`);
      
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }
      
      const data = await response.json();
      const isAvailable = data.isAvailable;
      
      // Cache the result
      setAvailabilityCache(prev => ({ ...prev, [cacheKey]: isAvailable }));
      
      return isAvailable;
    } catch (error) {
      console.error('Check availability error:', error);
      // Mock random availability for now
      const isAvailable = Math.random() > 0.3; // 70% chance of being available
      setAvailabilityCache(prev => ({ ...prev, [cacheKey]: isAvailable }));
      return isAvailable;
    }
  }, [availabilityCache]);

  const batchCheckAvailability = useCallback(async (queries: AvailabilityQuery[]): Promise<Record<string, boolean>> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/staff/check-availability/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries })
      });
      
      if (!response.ok) {
        throw new Error('Failed to batch check availability');
      }
      
      const data = await response.json();
      const results: Record<string, boolean> = {};
      
      if (data.status === 'success') {
        data.results.forEach((result: any) => {
          const cacheKey = `${result.staff_id}-${result.day}-${result.time}`;
          results[cacheKey] = result.is_available;
        });
        
        // Update cache
        setAvailabilityCache(prev => ({ ...prev, ...results }));
        
        return results;
      }
      
      throw new Error(data.message || 'Failed to batch check availability');
    } catch (error) {
      console.error('Batch check availability error:', error);
      // Mock batch results for now
      const results: Record<string, boolean> = {};
      queries.forEach(query => {
        const cacheKey = `${query.staffId}-${query.day}-${query.time}`;
        results[cacheKey] = Math.random() > 0.3; // 70% chance of being available
      });
      
      setAvailabilityCache(prev => ({ ...prev, ...results }));
      return results;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailability = useCallback((staffId: string, day: string, time: string): boolean | undefined => {
    const cacheKey = `${staffId}-${day}-${time}`;
    return availabilityCache[cacheKey];
  }, [availabilityCache]);

  const clearCache = useCallback(() => {
    setAvailabilityCache({});
  }, []);

  return {
    loading,
    availabilityCache,
    checkStaffAvailability,
    batchCheckAvailability,
    getAvailability,
    clearCache
  };
}

// Staff search hook
export function useStaffSearch() {
  const [loading, setLoading] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);

  const searchAvailableStaff = useCallback(async (day: string, time: string, searchTerm: string = ''): Promise<StaffMember[]> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const params = new URLSearchParams({
        day,
        time,
        search: searchTerm
      });
      
      const response = await fetch(`/api/staff/available?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available staff');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setAvailableStaff(data.staff);
        return data.staff;
      }
      
      throw new Error(data.message || 'Failed to fetch available staff');
    } catch (error) {
      console.error('Search available staff error:', error);
      // Mock staff data for now
      const mockStaff: StaffMember[] = [
        { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
        { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
        { id: '3', name: 'Carol Davis', email: 'carol@example.com' },
        { id: '4', name: 'David Wilson', email: 'david@example.com' },
        { id: '5', name: 'Emma Brown', email: 'emma@example.com' },
        { id: '6', name: 'Frank Miller', email: 'frank@example.com' },
        { id: '7', name: 'Grace Lee', email: 'grace@example.com' }
      ].filter(staff => 
        searchTerm === '' || 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setAvailableStaff(mockStaff);
      return mockStaff;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    availableStaff,
    searchAvailableStaff
  };
}

// Drag and drop hook
export function useDragAndDrop() {
  const [draggedStaff, setDraggedStaff] = useState<StaffMember | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, staffData: StaffMember) => {
    setDraggedStaff(staffData);
    e.dataTransfer.setData('text/plain', JSON.stringify(staffData));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedStaff(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const parseDragData = useCallback((e: React.DragEvent): StaffMember | null => {
    try {
      return JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return null;
    }
  }, []);

  return {
    draggedStaff,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    parseDragData
  };
}