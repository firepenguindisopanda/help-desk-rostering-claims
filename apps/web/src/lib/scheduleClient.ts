/**
 * Schedule Client - Simple wrapper for API v2 schedule operations
 */

import { apiFetch } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

// Types based on the task requirements
export interface GenerateScheduleRequest {
  start_date: string;
  end_date: string;
}

export interface GenerateScheduleResponse {
  schedule_id: number;
  schedule_type: 'helpdesk' | 'lab';
}

export interface Assistant {
  id: string;
  name: string;
}

export interface Shift {
  time: string;
  assistants: Assistant[];
}

export interface Day {
  name: string;
  shifts: Shift[];
}

export interface Schedule {
  days: Day[];
}

export interface ScheduleDetailsResponse {
  schedule: Schedule;
}

export class ScheduleHttpError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ScheduleHttpError';
  }
}

/**
 * Enhanced API fetch for v2 endpoints with proper error handling
 */
async function apiV2Fetch<T>(url: string, init?: RequestInit): Promise<{ success: true; data: T; message?: string }> {
  // Rely on api.ts API_BASE_URL which already includes '/api/v2'.
  // Only ensure the path starts with a single '/'.
  const fullUrl = url.startsWith('/') ? url : `/${url}`;
  
  try {
    const response = await apiFetch<ApiResponse<T>>(fullUrl, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok || body?.success === false) {
      const message = body?.message || getErrorMessage(response.status);
      throw new ScheduleHttpError(response.status, message, body);
    }

    // Handle both envelope and direct data responses
    if (body?.success === true) {
      return body as { success: true; data: T; message?: string };
    }

    // Assume direct data if no envelope structure
    return { success: true, data: body as T };
  } catch (error) {
    if (error instanceof ScheduleHttpError) {
      throw error;
    }
    
    // Network or other errors
    throw new ScheduleHttpError(0, error instanceof Error ? error.message : 'Network error');
  }
}

/**
 * Map HTTP status codes to user-friendly messages
 */
function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'You are not authorized. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'The provided data is invalid. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Schedule API Client for simple operations
 */
export class ScheduleClient {
  /**
   * Generate a new schedule with just start and end dates
   */
  async generateSchedule(request: GenerateScheduleRequest): Promise<GenerateScheduleResponse> {
    const response = await apiV2Fetch<GenerateScheduleResponse>('/admin/schedule/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.data;
  }

  /**
   * Get schedule details by ID
   */
  async getScheduleDetails(scheduleId: number): Promise<ScheduleDetailsResponse> {
    const response = await apiV2Fetch<ScheduleDetailsResponse>(`/admin/schedule/details?id=${scheduleId}`);

    return response.data;
  }

  /**
   * Generate and fetch schedule in one operation
   */
  async generateAndFetchSchedule(request: GenerateScheduleRequest): Promise<Schedule> {
    // Step 1: Generate the schedule
    const generateResponse = await this.generateSchedule(request);
    
    // Step 2: Fetch the schedule details
    const detailsResponse = await this.getScheduleDetails(generateResponse.schedule_id);
    
    return detailsResponse.schedule;
  }
}

// Export singleton instance
export const scheduleClient = new ScheduleClient();