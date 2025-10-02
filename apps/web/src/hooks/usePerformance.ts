import { useState, useEffect, useCallback, useRef } from "react";
import type { 
  PerformanceMetrics, 
  HealthStatus, 
  SlowOperationsAnalysis
} from "@/lib/api/performance";
import { performanceAPI } from "@/lib/api/performance";
import { toast } from "sonner";

const IS_DEV = process.env.NODE_ENV !== "production";

function logPerformanceDebug(message: string, payload?: unknown) {
  if (!IS_DEV) return;
  if (payload === undefined) {
    console.debug(`[Performance] ${message}`);
    return;
  }
  console.debug(`[Performance] ${message}`, payload);
}

export interface UsePerformanceDataOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  enableToastOnError?: boolean;
}

export interface PerformanceDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface PerformanceActions {
  refresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
  triggerLogSummary: () => Promise<void>;
}

/**
 * Hook for managing performance metrics with auto-refresh capability
 */
export function usePerformanceMetrics(options: UsePerformanceDataOptions = {}) {
  const {
    refreshInterval = 30000,
    autoRefresh = true,
    enableToastOnError = true
  } = options;

  const [state, setState] = useState<PerformanceDataState<PerformanceMetrics>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logPerformanceDebug('metrics request → start', { timestamp: new Date().toISOString() });
      const data = await performanceAPI.getMetrics();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      logPerformanceDebug('metrics request ← success', {
        lastUpdated: new Date().toISOString(),
        totalOperations: data.total_operations,
        averageResponseTime: data.average_response_time,
        slowOperations: data.slow_operations?.length ?? 0,
        errorOperations: data.error_operations?.length ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch performance metrics';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      logPerformanceDebug('metrics request ← error', {
        message: errorMessage,
        raw: error instanceof Error ? { name: error.name, stack: error.stack } : error,
      });
      
      if (enableToastOnError) {
        toast.error(errorMessage);
      }
    }
  }, [enableToastOnError]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  const triggerLogSummary = useCallback(async () => {
    try {
      logPerformanceDebug('trigger log summary → start');
      const result = await performanceAPI.triggerLogSummary();
      toast.success(result.message || 'Performance summary logged successfully');
      logPerformanceDebug('trigger log summary ← success', result);
      await fetchData(); // Refresh data after logging
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to trigger log summary';
      logPerformanceDebug('trigger log summary ← error', {
        message: errorMessage,
        raw: error instanceof Error ? { name: error.name, stack: error.stack } : error,
      });
      if (enableToastOnError) {
        toast.error(errorMessage);
      }
    }
  }, [fetchData, enableToastOnError]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actions: PerformanceActions = {
    refresh,
    toggleAutoRefresh,
    triggerLogSummary
  };

  return {
    ...state,
    isAutoRefreshEnabled,
    actions
  };
}

/**
 * Hook for managing health status with auto-refresh capability
 */
export function useHealthStatus(options: UsePerformanceDataOptions = {}) {
  const {
    refreshInterval = 15000, // More frequent for health status
    autoRefresh = true,
    enableToastOnError = false // Less noisy for health checks
  } = options;

  const [state, setState] = useState<PerformanceDataState<HealthStatus>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: false, error: null })); // Don't show loading for health checks
      logPerformanceDebug('health request → start', { timestamp: new Date().toISOString() });
      const data = await performanceAPI.getHealth();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      logPerformanceDebug('health request ← success', {
        lastUpdated: new Date().toISOString(),
        status: data.status,
        totalOperations: data.total_operations,
        slowOperationsCount: data.slow_operations_count,
        errorOperationsCount: data.error_operations_count,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch health status';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      logPerformanceDebug('health request ← error', {
        message: errorMessage,
        raw: error instanceof Error ? { name: error.name, stack: error.stack } : error,
      });
      
      if (enableToastOnError) {
        toast.error(errorMessage);
      }
    }
  }, [enableToastOnError]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true })); // Show loading for manual refresh
    await fetchData();
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actions = {
    refresh,
    toggleAutoRefresh,
    triggerLogSummary: async () => {
      throw new Error('Log summary not available for health status');
    }
  };

  return {
    ...state,
    isAutoRefreshEnabled,
    actions
  };
}

/**
 * Hook for managing slow operations data
 */
export function useSlowOperations(options: UsePerformanceDataOptions = {}) {
  const {
    refreshInterval = 60000, // Less frequent for slow operations
    autoRefresh = false, // Manual refresh by default
    enableToastOnError = true
  } = options;

  const [state, setState] = useState<PerformanceDataState<SlowOperationsAnalysis>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logPerformanceDebug('slow operations request → start', { timestamp: new Date().toISOString() });
      const data = await performanceAPI.getSlowOperations();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      logPerformanceDebug('slow operations request ← success', {
        lastUpdated: new Date().toISOString(),
        count: data.count,
        threshold: data.threshold,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch slow operations';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      logPerformanceDebug('slow operations request ← error', {
        message: errorMessage,
        raw: error instanceof Error ? { name: error.name, stack: error.stack } : error,
      });
      
      if (enableToastOnError) {
        toast.error(errorMessage);
      }
    }
  }, [enableToastOnError]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actions = {
    refresh,
    toggleAutoRefresh,
    triggerLogSummary: async () => {
      throw new Error('Log summary not available for slow operations');
    }
  };

  return {
    ...state,
    isAutoRefreshEnabled,
    actions
  };
}

/**
 * Combined hook for all performance data
 */
export function usePerformanceData(options: UsePerformanceDataOptions = {}) {
  const metrics = usePerformanceMetrics(options);
  const health = useHealthStatus({ ...options, refreshInterval: 15000 });
  const slowOperations = useSlowOperations({ ...options, autoRefresh: false });

  const refreshAll = useCallback(async () => {
    logPerformanceDebug('refreshAll → start');
    await Promise.all([
      metrics.actions.refresh(),
      health.actions.refresh(),
      slowOperations.actions.refresh()
    ]);
    logPerformanceDebug('refreshAll ← complete');
  }, [metrics.actions, health.actions, slowOperations.actions]);

  const isLoading = metrics.loading || health.loading || slowOperations.loading;
  const hasError = Boolean(metrics.error || health.error || slowOperations.error);

  return {
    metrics,
    health,
    slowOperations,
    refreshAll,
    isLoading,
    hasError
  };
}