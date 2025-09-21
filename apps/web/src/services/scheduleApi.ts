/**
 * API Service Layer for Schedule Management
 * Implements patterns: retry logic, error handling, logging
 */

import type { 
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  CurrentScheduleResponse,
  ScheduleDetailsResponse,
  SaveScheduleRequest,
  SaveScheduleResponse,
  ClearScheduleRequest,
  ClearScheduleResponse,
  PublishScheduleResponse,
  AvailableStaffResponse,
  StaffAvailabilityResponse,
  BatchAvailabilityRequest,
  BatchAvailabilityResponse,
  RemoveStaffRequest,
  RemoveStaffResponse,
  ScheduleSummaryResponse,
} from '@/types/schedule';

import { ScheduleApiError } from '@/types/schedule';
import { apiFetch, HttpError } from '@/lib/apiClient';

// Configuration

const SCHEDULE_ENDPOINT = `/admin/schedule`;

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

// Request timeout
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * uses the centralized apiFetch from apiClient.ts
 */
class ApiClient {

  /**
   * Enhanced fetch with timeout and retry logic
   */
  private async fetchWithRetry<T>(url: string, options: RequestInit = {}, attempt: number = 1): Promise<T> {
    try {
      const res = await apiFetch<T>(url, options);
      return res.data;
    } catch (error) {
      if (error instanceof HttpError && error.status < 500) {
        throw new ScheduleApiError(error.message, error.status, (error.body as any)?.errors);
      }
      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
          RETRY_CONFIG.maxDelay
        );
        console.warn(`API request failed, retrying in ${delay}ms (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`);
        await new Promise(r => setTimeout(r, delay));
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }
      if (error instanceof HttpError) {
        throw new ScheduleApiError(error.message, error.status, (error.body as any)?.errors);
      }
      throw this.createNetworkError(error);
    }
  }

  /**
   * Create network error with proper message
   */
  private createNetworkError(error: unknown): ScheduleApiError {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new ScheduleApiError(`Network error: ${message}`, 0);
  }

  /**
   * Logger with structured data
   */
  private logError(message: string, data: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(message, data);
    }
    
    // In production, send to monitoring service
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(new Error(message), { extra: data });
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    return this.fetchWithRetry<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { 
      method: 'POST',
      ...(data ? { body: JSON.stringify(data) } : {})
    };
    return this.fetchWithRetry<T>(endpoint, options);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { 
      method: 'PUT',
      ...(data ? { body: JSON.stringify(data) } : {})
    };
    return this.fetchWithRetry<T>(endpoint, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Schedule API Service
 * Professional service layer with proper separation of concerns
 */
export class ScheduleApiService {
  private readonly client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  /**
   * Generate a new schedule
   */
  async generateSchedule(request: GenerateScheduleRequest): Promise<GenerateScheduleResponse> {
    this.validateDateRange(request.start_date, request.end_date);
    
    return this.client.post<GenerateScheduleResponse>(`${SCHEDULE_ENDPOINT}/generate`, request);
  }

  /**
   * Get current active schedule
   */
  async getCurrentSchedule(): Promise<CurrentScheduleResponse> {
    return this.client.get<CurrentScheduleResponse>(`${SCHEDULE_ENDPOINT}/current`);
  }

  /**
   * Get schedule details by ID
   */
  async getScheduleDetails(scheduleId: number): Promise<ScheduleDetailsResponse> {
    return this.client.get<ScheduleDetailsResponse>(`${SCHEDULE_ENDPOINT}/details`, {
      id: scheduleId.toString(),
    });
  }

  /**
   * Save schedule with assignments
   */
  async saveSchedule(request: SaveScheduleRequest): Promise<SaveScheduleResponse> {
    this.validateDateRange(request.start_date, request.end_date);
    this.validateAssignments(request.assignments);
    
    return this.client.post<SaveScheduleResponse>(`${SCHEDULE_ENDPOINT}/save`, request);
  }

  /**
   * Clear existing schedule
   */
  async clearSchedule(request: ClearScheduleRequest): Promise<ClearScheduleResponse> {
    return this.client.post<ClearScheduleResponse>(`${SCHEDULE_ENDPOINT}/clear`, request);
  }

  /**
   * Publish schedule
   */
  async publishSchedule(scheduleId: number): Promise<PublishScheduleResponse> {
    return this.client.post<PublishScheduleResponse>(`${SCHEDULE_ENDPOINT}/${scheduleId}/publish`);
  }

  /**
   * Get available staff for specific day/time
   */
  async getAvailableStaff(day: string, time: string): Promise<AvailableStaffResponse> {
    return this.client.get<AvailableStaffResponse>(`${SCHEDULE_ENDPOINT}/staff/available`, {
      day,
      time,
    });
  }

  /**
   * Check single staff availability
   */
  async checkStaffAvailability(
    staffId: string, 
    day: string, 
    time: string
  ): Promise<StaffAvailabilityResponse> {
    return this.client.get<StaffAvailabilityResponse>(`${SCHEDULE_ENDPOINT}/staff/check-availability`, {
      staff_id: staffId,
      day,
      time,
    });
  }

  /**
   * Batch check staff availability
   */
  async batchCheckAvailability(request: BatchAvailabilityRequest): Promise<BatchAvailabilityResponse> {
    if (request.queries.length > 500) {
      throw new ScheduleApiError('Maximum 500 queries allowed per batch', 400);
    }

    return this.client.post<BatchAvailabilityResponse>(`${SCHEDULE_ENDPOINT}/staff/check-availability/batch`, request);
  }

  /**
   * Remove staff from shift
   */
  async removeStaffFromShift(request: RemoveStaffRequest): Promise<RemoveStaffResponse> {
    return this.client.post<RemoveStaffResponse>(`${SCHEDULE_ENDPOINT}/staff/remove`, request);
  }

  /**
   * Export schedule as PDF
   */
  async exportSchedulePDF(format: string = 'standard'): Promise<Blob> {
    const endpoint = `${SCHEDULE_ENDPOINT}/export/pdf?format=${format}`;
    
    try {
      const res = await apiFetch<Blob>(endpoint, { method: 'GET' });
      // For blob responses, we need to handle this differently
      // Since apiFetch expects JSON, we'll use direct fetch for blob responses
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new ScheduleApiError(`Failed to export PDF: ${response.statusText}`, response.status);
      }

      return response.blob();
    } catch (error) {
      if (error instanceof HttpError) {
        throw new ScheduleApiError(error.message, error.status, (error.body as any)?.errors);
      }
      throw new ScheduleApiError(`Failed to export PDF: ${error}`, 500);
    }
  }

  /**
   * Get schedule summary statistics
   */
  async getScheduleSummary(): Promise<ScheduleSummaryResponse> {
    return this.client.get<ScheduleSummaryResponse>(`${SCHEDULE_ENDPOINT}/summary`);
  }

  /**
   * Validation helpers
   */
  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ScheduleApiError('Invalid date format. Use YYYY-MM-DD', 400);
    }

    if (start > end) {
      throw new ScheduleApiError('Start date must be before or equal to end date', 400);
    }

    if (end > oneYearFromNow) {
      throw new ScheduleApiError('End date cannot be more than 1 year in the future', 400);
    }
  }

  private validateAssignments(assignments: any[]): void {
    if (!Array.isArray(assignments)) {
      throw new ScheduleApiError('Assignments must be an array', 400);
    }

    assignments.forEach((assignment, index) => {
      if (!assignment.day || !assignment.time || !assignment.cell_id) {
        throw new ScheduleApiError(`Assignment ${index}: missing required fields (day, time, cell_id)`, 400);
      }

      if (!Array.isArray(assignment.staff)) {
        throw new ScheduleApiError(`Assignment ${index}: staff must be an array`, 400);
      }
    });
  }
}

// Export singleton instance
export const scheduleApi = new ScheduleApiService();

// Export for testing
export { ApiClient };