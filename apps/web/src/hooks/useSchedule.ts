import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch as apiFetchRaw } from '@/lib/api';
import { scheduleApi } from '@/services/scheduleApi';
import { retryWithBackoff } from '@/lib/utils';

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
      const res = await apiFetchRaw(`/admin/schedule/generate`, {
        method: 'POST',
        body: JSON.stringify({ start_date: startDate, end_date: endDate })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) {
        const err: any = new Error(body?.message || 'Failed to generate schedule');
        err.status = res.status;
        throw err;
      }
      const scheduleData: ScheduleData = body?.data?.schedule || body?.schedule || body?.data;
      toast.success(body?.message || 'Schedule generated');
      setSchedule(scheduleData);
      return scheduleData;
    } catch (e) {
      const anyErr: any = e as any;
      if (typeof anyErr?.status === 'number') {
        if (anyErr.status === 422 || anyErr.status === 400) {
          toast.warning(anyErr.message);
        } else if (anyErr.status >= 500) {
          toast.error('Could not generate schedule. Retrying…');
          const retried = await retryWithBackoff(async () => {
            const r = await apiFetchRaw(`/admin/schedule/generate`, {
              method: 'POST',
              body: JSON.stringify({ start_date: startDate, end_date: endDate })
            });
            const b = await r.json().catch(() => ({}));
            if (!r.ok || b?.success === false) {
              const err: any = new Error(b?.message || 'Failed to generate schedule');
              err.status = r.status;
              throw err;
            }
            return b;
          });
          const scheduleData2: ScheduleData = retried?.data?.schedule || retried?.schedule || retried?.data;
          toast.success(retried?.message || 'Schedule generated');
          setSchedule(scheduleData2);
          return scheduleData2;
        }
      } else {
        toast.error('Network error. Check your connection.');
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSchedule = useCallback(async (scheduleData: ScheduleData): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetchRaw(`/admin/schedule/save`, {
        method: 'POST',
        body: JSON.stringify({ schedule: scheduleData })
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        const err: any = new Error(b?.message || 'Save failed.');
        err.status = res.status;
        throw err;
      }
      toast.success('Schedule saved successfully');
    } catch (e) {
      const anyErr: any = e as any;
      if (anyErr?.status === 409) toast.warning('Someone else changed this schedule. Please refresh.');
      else toast.error(anyErr?.message || 'Save failed.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSchedule = useCallback(async (): Promise<void> => {
    try {
      const res = await apiFetchRaw(`/admin/schedule/clear`, { method: 'POST' });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        const err: any = new Error(b?.message || 'Failed to clear schedule');
        err.status = res.status;
        throw err;
      }
      setSchedule(null);
      toast.success('Schedule cleared successfully');
    } catch (e) {
      const anyErr: any = e as any;
      toast.error(anyErr?.message || 'Failed to clear schedule');
      throw e;
    }
  }, []);

  const downloadPDF = useCallback(async (scheduleData: ScheduleData): Promise<void> => {
    try {
      const blob = await scheduleApi.exportSchedulePDF('standard');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${scheduleData.startDate}-${scheduleData.endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Schedule downloaded as PDF!');
    } catch (error: any) {
      console.error('Download PDF error:', error);
      toast.error(error?.message || 'Failed to export PDF');
      throw error;
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
      const res = await apiFetchRaw(
        `/admin/schedule/staff/check-availability?staff_id=${encodeURIComponent(staffId)}&day=${encodeURIComponent(day)}&time=${encodeURIComponent(time)}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) throw new Error(body?.message || 'Failed');
      const isAvailable = body?.data?.is_available ?? body?.is_available;
      setAvailabilityCache(prev => ({ ...prev, [cacheKey]: isAvailable }));
      return isAvailable;
    } catch (e) {
      toast.error('Could not check availability');
      throw e;
    }
  }, [availabilityCache]);

  const batchCheckAvailability = useCallback(async (queries: AvailabilityQuery[]): Promise<Record<string, boolean>> => {
    setLoading(true);
    try {
      const res = await apiFetchRaw(
        `/admin/schedule/staff/check-availability/batch`,
        { method: 'POST', body: JSON.stringify({ queries: queries.map(q => ({ staff_id: q.staffId, day: q.day, time: q.time })) }) }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.success === false) throw new Error(body?.message || 'Failed');
      const results: Record<string, boolean> = {};
      (body?.data?.results || body?.results || []).forEach((result: any) => {
        const cacheKey = `${result.staff_id}-${result.day}-${result.time}`;
        results[cacheKey] = result.is_available;
      });
      setAvailabilityCache(prev => ({ ...prev, ...results }));
      return results;
    } catch (e) {
      toast.error('Could not load availability. Cells will remain droppable.');
      throw e;
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
  const params = new URLSearchParams({ day, time, search: searchTerm });
  const res = await apiFetchRaw(`/admin/schedule/staff/available?${params.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) throw new Error(body?.message || 'Failed to fetch available staff');
  const staff = body?.data?.staff || body?.staff || [];
  setAvailableStaff(staff);
  return staff;
    } catch (e) {
      toast.error('Failed to fetch available staff');
      throw e;
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