/**
 * React Query hooks for Schedule Management
 * Integrates with existing QueryClient
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { scheduleApi } from '@/services/scheduleApi';
import type {
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  CurrentScheduleResponse,
  SaveScheduleRequest,
  SaveScheduleResponse,
  ClearScheduleRequest,
  ClearScheduleResponse,
  BatchAvailabilityRequest,
  BatchAvailabilityResponse,
  RemoveStaffRequest,
  RemoveStaffResponse,
  ScheduleSummaryResponse,
} from '@/types/schedule';

const IS_DEV = process.env.NODE_ENV !== 'production';

function logScheduleDebug(message: string, payload?: unknown) {
  if (!IS_DEV) return;
  if (payload === undefined) {
    console.debug(`[ScheduleQuery] ${message}`);
    return;
  }
  console.debug(`[ScheduleQuery] ${message}`, payload);
}

// Query Keys - Centralized for consistency
const scheduleKeysBase = ['schedule'] as const;
const staffKeysBase = [...scheduleKeysBase, 'staff'] as const;

export const scheduleKeys = {
  all: scheduleKeysBase,
  current: () => [...scheduleKeysBase, 'current'] as const,
  details: (id: number) => [...scheduleKeysBase, 'details', id] as const,
  summary: () => [...scheduleKeysBase, 'summary'] as const,
  staff: {
    all: staffKeysBase,
    available: (day: string, time: string) => [...staffKeysBase, 'available', day, time] as const,
    availability: (staffId: string, day: string, time: string) => 
      [...staffKeysBase, 'availability', staffId, day, time] as const,
  },
} as const;

/**
 * Hook to get current active schedule
 */
export function useCurrentSchedule() {
  return useQuery<CurrentScheduleResponse>({
    queryKey: scheduleKeys.current(),
    queryFn: () => scheduleApi.getCurrentSchedule(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no current schedule)
      if (error?.statusCode === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to get schedule details by ID
 */
export function useScheduleDetails(scheduleId: number, enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.details(scheduleId),
    queryFn: () => scheduleApi.getScheduleDetails(scheduleId),
    enabled: enabled && scheduleId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get schedule summary statistics
 */
export function useScheduleSummary() {
  return useQuery<ScheduleSummaryResponse>({
    queryKey: scheduleKeys.summary(),
    queryFn: () => scheduleApi.getScheduleSummary(),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Hook to get available staff for a specific day/time
 */
export function useAvailableStaff(day: string, time: string, enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.staff.available(day, time),
    queryFn: () => scheduleApi.getAvailableStaff(day, time),
    enabled: enabled && !!day && !!time,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * Hook to check single staff availability
 */
export function useStaffAvailability(staffId: string, day: string, time: string, enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.staff.availability(staffId, day, time),
    queryFn: () => scheduleApi.checkStaffAvailability(staffId, day, time),
    enabled: enabled && !!staffId && !!day && !!time,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to generate a new schedule
 */
export function useGenerateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateScheduleRequest) => scheduleApi.generateSchedule(request),
    onSuccess: (data: GenerateScheduleResponse) => {
      // Invalidate and refetch current schedule
      queryClient.invalidateQueries({ queryKey: scheduleKeys.current() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.summary() });
      
      toast.success(`Schedule generated successfully! ${data.shifts_generated} shifts created in ${data.generation_time}`);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to generate schedule';
      toast.error(message);
      console.error('Generate schedule error:', error);
    },
  });
}

/**
 * Hook to save schedule with assignments
 */
export function useSaveSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SaveScheduleRequest) => scheduleApi.saveSchedule(request),
    onSuccess: (data: SaveScheduleResponse) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.current() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.summary() });
      if (data.schedule_id) {
        queryClient.invalidateQueries({ queryKey: scheduleKeys.details(data.schedule_id) });
      }

      const message = data.errors && data.errors.length > 0
        ? `Schedule saved with ${data.errors.length} warnings`
        : `Schedule saved successfully! ${data.assignments_processed} assignments processed`;
      
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to save schedule';
      toast.error(message);
      console.error('Save schedule error:', error);
    },
  });
}

/**
 * Hook to clear schedule
 */
export function useClearSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ClearScheduleRequest) => scheduleApi.clearSchedule(request),
    onSuccess: (data: ClearScheduleResponse) => {
      // Invalidate all schedule-related queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      
      toast.success('Schedule cleared successfully');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to clear schedule';
      toast.error(message);
      console.error('Clear schedule error:', error);
    },
  });
}

/**
 * Hook to publish schedule
 */
export function usePublishSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: number) => scheduleApi.publishSchedule(scheduleId),
    onSuccess: (data) => {
      // Invalidate schedule queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.current() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.summary() });
      
      toast.success(`Schedule published successfully! ${data.notifications_sent} notifications sent`);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to publish schedule';
      toast.error(message);
      console.error('Publish schedule error:', error);
    },
  });
}

/**
 * Hook to batch check staff availability
 */
export function useBatchCheckAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BatchAvailabilityRequest) => scheduleApi.batchCheckAvailability(request),
    onSuccess: (data: BatchAvailabilityResponse) => {
      // Update individual availability queries in cache
      data.results.forEach((result) => {
        queryClient.setQueryData(
          scheduleKeys.staff.availability(result.staff_id, result.day, result.time),
          result
        );
      });
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to check availability';
      toast.error(message);
      console.error('Batch availability error:', error);
    },
  });
}

/**
 * Hook to remove staff from shift
 */
export function useRemoveStaffFromShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RemoveStaffRequest) => scheduleApi.removeStaffFromShift(request),
    onSuccess: (data: RemoveStaffResponse, variables) => {
      // Invalidate current schedule and summary
      queryClient.invalidateQueries({ queryKey: scheduleKeys.current() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.summary() });
      
      // Invalidate staff availability for that time slot
      queryClient.invalidateQueries({ 
        queryKey: scheduleKeys.staff.available(variables.day, variables.time) 
      });

      toast.success(`Staff member removed from ${variables.day} at ${variables.time}`);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to remove staff from shift';
      toast.error(message);
      console.error('Remove staff error:', error);
    },
  });
}

/**
 * Hook to export schedule as PDF
 */
export function useExportSchedulePDF() {
  return useMutation({
    mutationFn: (format?: string) => scheduleApi.exportSchedulePDF(format || 'standard'),
    onSuccess: (blob: Blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Schedule exported successfully!');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to export schedule';
      toast.error(message);
      console.error('Export PDF error:', error);
    },
  });
}

/**
 * Helper functions for optimistic updates
 */
function addStaffToScheduleData(oldData: any, day: string, time: string, staff: any) {
  if (!oldData?.schedule?.days) return oldData;

  const updatedDays = oldData.schedule.days.map((scheduleDay: any) => {
    if (scheduleDay.day !== day) return scheduleDay;
    
    const updatedShifts = scheduleDay.shifts.map((shift: any) => {
      if (shift.time !== time) return shift;
      
      return {
        ...shift,
        assistants: [...(shift.assistants || []), staff],
      };
    });
    
    return { ...scheduleDay, shifts: updatedShifts };
  });

  return {
    ...oldData,
    schedule: {
      ...oldData.schedule,
      days: updatedDays,
    },
  };
}

function removeStaffFromScheduleData(oldData: any, day: string, time: string, staffId: string) {
  if (!oldData?.schedule?.days) return oldData;

  const updatedDays = oldData.schedule.days.map((scheduleDay: any) => {
    if (scheduleDay.day !== day) return scheduleDay;
    
    const updatedShifts = scheduleDay.shifts.map((shift: any) => {
      if (shift.time !== time) return shift;
      
      return {
        ...shift,
        assistants: (shift.assistants || []).filter((a: any) => a.id !== staffId),
      };
    });
    
    return { ...scheduleDay, shifts: updatedShifts };
  });

  return {
    ...oldData,
    schedule: {
      ...oldData.schedule,
      days: updatedDays,
    },
  };
}

/**
 * Hook for optimistic updates when adding staff to shifts
 * Provides immediate UI feedback before API confirmation
 */
export function useOptimisticScheduleUpdate() {
  const queryClient = useQueryClient();

  const addStaffOptimistically = (day: string, time: string, staff: any) => {
    queryClient.setQueryData(scheduleKeys.current(), (oldData: any) => 
      addStaffToScheduleData(oldData, day, time, staff)
    );
  };

  const removeStaffOptimistically = (day: string, time: string, staffId: string) => {
    queryClient.setQueryData(scheduleKeys.current(), (oldData: any) => 
      removeStaffFromScheduleData(oldData, day, time, staffId)
    );
  };

  return {
    addStaffOptimistically,
    removeStaffOptimistically,
  };
}

/**
 * Composite hook for schedule management
 * Provides all necessary functionality in one place
 */
export function useScheduleManagement() {
  const currentSchedule = useCurrentSchedule();
  const summary = useScheduleSummary();
  const generateSchedule = useGenerateSchedule();
  const saveSchedule = useSaveSchedule();
  const clearSchedule = useClearSchedule();
  const publishSchedule = usePublishSchedule();
  const exportPDF = useExportSchedulePDF();
  const removeStaff = useRemoveStaffFromShift();
  const batchCheckAvailability = useBatchCheckAvailability();
  const optimistic = useOptimisticScheduleUpdate();

  useEffect(() => {
    if (!IS_DEV) return;
    if (currentSchedule.data) {
      logScheduleDebug('current schedule success', {
        scheduleId: currentSchedule.data.schedule?.id,
        type: currentSchedule.data.schedule?.type,
        startDate: currentSchedule.data.schedule?.start_date,
        endDate: currentSchedule.data.schedule?.end_date,
        days: currentSchedule.data.schedule?.days?.length,
      });
    }
  }, [currentSchedule.data]);

  useEffect(() => {
    if (!IS_DEV) return;
    if (currentSchedule.error) {
      const error = currentSchedule.error as {
        message?: string;
        status?: number;
        statusCode?: number;
        body?: unknown;
        responseBody?: unknown;
      } | undefined;
      logScheduleDebug('current schedule error', {
        message: error?.message,
        status: error?.status ?? error?.statusCode,
        body: error?.body ?? error?.responseBody,
      });
    }
  }, [currentSchedule.error]);

  useEffect(() => {
    if (!IS_DEV) return;
    if (summary.data) {
      logScheduleDebug('schedule summary success', {
        scheduleId: summary.data.summary.schedule_id,
        totalShifts: summary.data.summary.total_shifts,
        assignedShifts: summary.data.summary.assigned_shifts,
        coverage: summary.data.summary.coverage_percentage,
        generatedAt: summary.data.generated_at,
      });
    }
  }, [summary.data]);

  useEffect(() => {
    if (!IS_DEV) return;
    if (summary.error) {
      const error = summary.error as {
        message?: string;
        status?: number;
        statusCode?: number;
        body?: unknown;
        responseBody?: unknown;
      } | undefined;
      logScheduleDebug('schedule summary error', {
        message: error?.message,
        status: error?.status ?? error?.statusCode,
        body: error?.body ?? error?.responseBody,
      });
    }
  }, [summary.error]);

  const isLoading = currentSchedule.isLoading || summary.isLoading;
  const hasSchedule = !!currentSchedule.data?.schedule;

  return {
    // Data
    currentSchedule: currentSchedule.data,
    summary: summary.data,
    isLoading,
    hasSchedule,
    
    // Mutations
    generateSchedule,
    saveSchedule,
    clearSchedule,
    publishSchedule,
    exportPDF,
    removeStaff,
    batchCheckAvailability,
    optimistic,
    
    // Refetch functions
    refetchSchedule: currentSchedule.refetch,
    refetchSummary: summary.refetch,
  };
}