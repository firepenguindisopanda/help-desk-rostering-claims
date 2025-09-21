/**
 * TypeScript types for Schedule API v2
 * Based on Flask API documentation
 */

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Schedule Domain Types
export type ScheduleType = 'helpdesk' | 'lab';

export interface Staff {
  id: string;
  name: string;
  type?: 'student' | 'admin';
  email?: string;
}

export interface Shift {
  shift_id: number;
  time: string;
  assistants: Staff[];
  cell_id?: string;
  max_staff?: number;
}

export interface ScheduleDay {
  day: string;
  shifts: Shift[];
}

export interface Schedule {
  id: number;
  type: ScheduleType;
  start_date: string;
  end_date: string;
  days: ScheduleDay[];
  is_published?: boolean;
  statistics?: ScheduleStatistics;
}

export interface ScheduleStatistics {
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts?: number;
  total_staff_assignments?: number;
  coverage_percentage: number;
}

// API Request Types
export interface GenerateScheduleRequest {
  start_date: string;
  end_date: string;
}

export interface SaveScheduleRequest {
  start_date: string;
  end_date: string;
  schedule_type: ScheduleType;
  assignments: ScheduleAssignment[];
}

export interface ScheduleAssignment {
  day: string;
  time: string;
  cell_id: string;
  staff: Staff[];
}

export interface ClearScheduleRequest {
  schedule_type: ScheduleType;
  schedule_id: number;
}

export interface AvailabilityQuery {
  staff_id: string;
  day: string;
  time: string;
}

export interface BatchAvailabilityRequest {
  queries: AvailabilityQuery[];
}

export interface RemoveStaffRequest {
  staff_id: string;
  day: string;
  time: string;
  shift_id: number;
}

// API Response Types
export interface GenerateScheduleResponse {
  schedule_id: number;
  schedule_type: ScheduleType;
  start_date: string;
  end_date: string;
  shifts_generated: number;
  generation_time: string;
  optimization_status: string;
}

export interface CurrentScheduleResponse {
  schedule: Schedule;
  schedule_type: ScheduleType;
}

export interface ScheduleDetailsResponse {
  schedule: Schedule;
}

export interface SaveScheduleResponse {
  schedule_id: number;
  schedule_type: ScheduleType;
  assignments_processed: number;
  start_date: string;
  end_date: string;
  errors: string[] | null;
}

export interface ClearScheduleResponse {
  schedule_id: number;
  schedule_type: ScheduleType;
  cleared_at: string;
}

export interface PublishScheduleResponse {
  schedule_id: number;
  published_at: string;
  notifications_sent: number;
}

export interface AvailableStaffResponse {
  staff: Staff[];
  day: string;
  time: string;
  count: number;
}

export interface StaffAvailabilityResponse {
  staff_id: string;
  day: string;
  time: string;
  is_available: boolean;
}

export interface BatchAvailabilityResponse {
  results: StaffAvailabilityResponse[];
  total_queries: number;
  processed: number;
}

export interface RemoveStaffResponse {
  staff_id: string;
  day: string;
  time: string;
  shift_id: number;
  removed_at: string;
}

export interface ScheduleSummaryResponse {
  summary: {
    total_shifts: number;
    assigned_shifts: number;
    unassigned_shifts: number;
    total_staff_assignments: number;
    coverage_percentage: number;
    schedule_type: ScheduleType;
    schedule_id: number;
    start_date: string;
    end_date: string;
    is_published: boolean;
  };
  schedule_type: ScheduleType;
  generated_at: string;
}

// Frontend-specific types
export interface ScheduleCellData {
  day: string;
  time: string;
  shift?: Shift;
  assistants: Staff[];
  maxStaff: number;
  isAvailable?: boolean;
  isSelected?: boolean;
}

export interface DragDropState {
  draggedStaff: Staff | null;
  dragOverCell: string | null;
  availabilityCache: Record<string, boolean>;
}

export interface ScheduleFormData {
  startDate: string;
  endDate: string;
  scheduleType: ScheduleType;
}

// Error types
export class ScheduleApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ScheduleApiError';
  }
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Constants
export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
] as const;

export const WEEK_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
] as const;

export const MAX_STAFF_PER_SHIFT = 3;

export type TimeSlot = typeof TIME_SLOTS[number];
export type WeekDay = typeof WEEK_DAYS[number];