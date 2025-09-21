/**
 * API Service Layer for Schedule Management
 * Implements patterns: retry logic, error handling, logging
 */

import type { 
  ApiResponse,
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

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_VERSION = 'v2';
const SCHEDULE_ENDPOINT = `/api/${API_VERSION}/admin/schedule`;

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
 * Enhanced fetch with timeout, retry logic, and error handling
 */
class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get JWT token from storage or auth context
   */
  private getAuthToken(): string | null {
    try {
      // Reuse api.ts cookie reader to ensure consistency
      const { getToken } = require('@/lib/api');
      return getToken();
    } catch {
      return null;
    }
  }

  /**
   * Create request headers with authentication
   */
  private createHeaders(additionalHeaders: HeadersInit = {}): HeadersInit {
    const headers: HeadersInit = { ...this.defaultHeaders, ...additionalHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Enhanced fetch with timeout and retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.createHeaders(options.headers),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ScheduleApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.errors
        );
      }

      const data: ApiResponse<T> = await response.json();
      
      if (!data.success) {
        throw new ScheduleApiError(
          data.message || 'API request failed',
          response.status,
          data.errors
        );
      }

      return data.data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Don't retry on client errors (4xx) or auth failures
      if (error instanceof ScheduleApiError && error.statusCode < 500) {
        throw error;
      }

      // Retry on network errors or server errors
      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
          RETRY_CONFIG.maxDelay
        );

        console.warn(`API request failed, retrying in ${delay}ms (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }

      // Log final error
      this.logError('API Request Failed', {
        url,
        method: options.method || 'GET',
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error instanceof ScheduleApiError 
        ? error 
        : this.createNetworkError(error);
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
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.fetchWithRetry<T>(url.toString(), { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, { method: 'DELETE' });
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
    const response = await fetch(`${API_BASE_URL}${SCHEDULE_ENDPOINT}/export/pdf?format=${format}`, {
      headers: this.client['createHeaders'](),
    });

    if (!response.ok) {
      throw new ScheduleApiError(`Failed to export PDF: ${response.statusText}`, response.status);
    }

    return response.blob();
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