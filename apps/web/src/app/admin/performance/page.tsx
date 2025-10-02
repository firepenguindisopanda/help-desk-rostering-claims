"use client";

import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { HealthStatusCard } from "@/components/admin/performance/HealthStatusCard";
import { MetricsSummary } from "@/components/admin/performance/MetricsSummary";
import { SlowOperationsTable } from "@/components/admin/performance/SlowOperationsTable";
import { PerformanceBreakdown } from "@/components/admin/performance/PerformanceBreakdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePerformanceData } from "@/hooks/usePerformance";
import { RefreshCw, Settings, TrendingUp, Play } from "lucide-react";
import { toast } from "sonner";

export default function PerformanceDashboard() {
  const {
    metrics,
    health,
    slowOperations,
    refreshAll,
    isLoading
  } = usePerformanceData({
    refreshInterval: 30000,
    autoRefresh: true,
    enableToastOnError: true
  });

  const handleRefreshAll = async () => {
    try {
      await refreshAll();
      toast.success('Performance data refreshed');
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
      toast.error('Failed to refresh performance data');
    }
  };

  const handleTriggerLogSummary = async () => {
    try {
      await metrics.actions.triggerLogSummary();
    } catch (error) {
      console.error('Failed to trigger log summary:', error);
      toast.error('Failed to trigger log summary');
    }
  };

  return (
    <RequireRole role="admin">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                Performance Monitoring
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor system performance, track operation metrics, and identify optimization opportunities
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.isAutoRefreshEnabled && (
                <Badge variant="secondary" className="text-green-600 bg-green-50">
                  Auto-refresh enabled
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerLogSummary}
                disabled={metrics.loading}
              >
                <Play className="h-4 w-4 mr-2" />
                Log Summary
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => metrics.actions.toggleAutoRefresh()}
              >
                <Settings className="h-4 w-4 mr-2" />
                {metrics.isAutoRefreshEnabled ? 'Disable' : 'Enable'} Auto-refresh
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
            </div>
          </div>

          {/* Health Status */}
          <HealthStatusCard health={health.data} loading={health.loading} />

          {/* Metrics Summary */}
          <MetricsSummary metrics={metrics.data} loading={metrics.loading} />

          {/* Performance Breakdown */}
          <PerformanceBreakdown initialData={metrics.data} loading={metrics.loading} />

          {/* Slow Operations Table */}
          <SlowOperationsTable initialData={slowOperations.data} loading={slowOperations.loading} />

          {/* Last Updated Info */}
          {(metrics.lastUpdated || health.lastUpdated) && (
            <div className="text-center py-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated: {
                  metrics.lastUpdated 
                    ? metrics.lastUpdated.toLocaleString()
                    : health.lastUpdated?.toLocaleString() || 'Never'
                }
                {metrics.isAutoRefreshEnabled && (
                  <span className="ml-2">• Auto-refresh every 30 seconds</span>
                )}
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </RequireRole>
  );
}