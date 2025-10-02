/**
 * Performance Monitoring API Client
 * Implements the performance endpoints as defined in PERFORMANCE_API_FRONTEND_GUIDE.md
 */

import { apiFetch } from "../apiClient";

// Performance Data Types
export interface PerformanceMetrics {
  total_operations: number;
  average_response_time: number;
  slow_operations: SlowOperation[];
  error_operations: ErrorOperation[];
  fastest_operations: FastOperation[];
}

export interface SlowOperation {
  name: string;
  avg_duration: number;
  call_count: number;
  last_called: string;
  recommendations?: string[];
}

export interface ErrorOperation {
  name: string;
  error_count: number;
  last_error: string;
}

export interface FastOperation {
  name: string;
  avg_duration: number;
  call_count: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: string;
  total_operations: number;
  slow_operations_count: number;
  error_operations_count: number;
}

export interface RawMetricsData {
  operations: Record<string, {
    durations: number[];
    timestamps: string[];
    errors: string[];
    metadata: {
      database_queries: number;
      solver_iterations: number;
    };
  }>;
  system_metrics: {
    memory_usage: string;
    cpu_usage: string;
    active_connections: number;
  };
}

export interface SlowOperationsAnalysis {
  slow_operations: SlowOperation[];
  count: number;
  threshold: string;
}

export interface LogSummaryResponse {
  status: string;
  message: string;
  data: PerformanceMetrics;
}

/**
 * Performance API client with all endpoints from the guide
 */
export const performanceAPI = {
  /**
   * GET /admin/performance/metrics - Performance Summary
   * Get summarized performance metrics for dashboard overview
   */
  getMetrics: async (): Promise<PerformanceMetrics> => {
    const response = await apiFetch<PerformanceMetrics>('/admin/performance/metrics');
    return response.data;
  },

  /**
   * GET /admin/performance/metrics/raw - Raw Metrics Data
   * Get detailed raw performance data for advanced analysis
   */
  getRawMetrics: async (): Promise<RawMetricsData> => {
    const response = await apiFetch<RawMetricsData>('/admin/performance/metrics/raw');
    return response.data;
  },

  /**
   * GET /admin/performance/health - System Health Check
   * Quick health status for system monitoring dashboards
   * Note: This is a public endpoint (no auth required)
   */
  getHealth: async (): Promise<HealthStatus> => {
    const response = await apiFetch<HealthStatus>('/admin/performance/health');
    return response.data;
  },

  /**
   * GET /admin/performance/slow-operations - Slow Operations Analysis
   * Get operations that need optimization with recommendations
   */
  getSlowOperations: async (): Promise<SlowOperationsAnalysis> => {
    const response = await apiFetch<SlowOperationsAnalysis>('/admin/performance/slow-operations');
    return response.data;
  },

  /**
   * POST /admin/performance/log-summary - Trigger Manual Logging
   * Manually trigger performance summary logging
   */
  triggerLogSummary: async (): Promise<LogSummaryResponse> => {
    const response = await apiFetch<LogSummaryResponse>('/admin/performance/log-summary', {
      method: 'POST',
    });
    return response.data;
  },
};

// Helper functions for performance data processing
export const performanceUtils = {
  /**
   * Format duration in seconds to human readable format
   */
  formatDuration: (seconds: number): string => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    return `${seconds}s`;
  },

  /**
   * Get status color class based on health status
   */
  getHealthStatusColor: (status: HealthStatus['status']): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  /**
   * Get performance level based on average response time
   */
  getPerformanceLevel: (avgResponseTime: number): { level: string; color: string } => {
    console.log('response time from parameter: ', avgResponseTime);
    if (avgResponseTime < 1) {
      return { level: 'Excellent', color: 'text-green-600' };
    } else if (avgResponseTime < 2) {
      return { level: 'Good', color: 'text-blue-600' };
    } else if (avgResponseTime < 5) {
      return { level: 'Fair', color: 'text-yellow-600' };
    } else {
      return { level: 'Poor', color: 'text-red-600' };
    }
  },

  /**
   * Format timestamp to relative time
   */
  formatRelativeTime: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  },

  /**
   * Calculate percentage change
   */
  calculatePercentageChange: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },
};