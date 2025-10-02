"use client";

import { useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { MetricsSummary } from "@/components/admin/performance/MetricsSummary";
import { PerformanceBreakdown } from "@/components/admin/performance/PerformanceBreakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePerformanceMetrics } from "@/hooks/usePerformance";
import { BarChart3, RefreshCw, ArrowLeft, Download, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { performanceUtils } from "@/lib/api/performance";

export default function DetailedMetrics() {
  const [rawDataVisible, setRawDataVisible] = useState(false);
  
  const {
    data: metrics,
    loading,
    error,
    lastUpdated,
    isAutoRefreshEnabled,
    actions
  } = usePerformanceMetrics({
    refreshInterval: 30000,
    autoRefresh: true,
    enableToastOnError: true
  });

  const handleRefresh = async () => {
    try {
      await actions.refresh();
      toast.success('Metrics data refreshed');
    } catch (error) {
      console.error('Failed to refresh metrics data:', error);
      toast.error('Failed to refresh metrics data');
    }
  };

  const handleExportData = () => {
    if (!metrics) {
      toast.error('No data available to export');
      return;
    }

    const dataToExport = {
      exportDate: new Date().toISOString(),
      metrics,
      summary: {
        total_operations: metrics.total_operations,
        average_response_time: metrics.average_response_time,
        performance_level: performanceUtils.getPerformanceLevel(metrics.average_response_time),
        slow_operations_count: metrics.slow_operations.length,
        error_operations_count: metrics.error_operations.length,
        fast_operations_count: metrics.fastest_operations.length
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Performance data exported successfully');
  };

  return (
    <RequireRole role="admin">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={routes.admin.performance}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  Detailed Performance Metrics
                </h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive performance analysis and operational insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={!metrics}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.toggleAutoRefresh()}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isAutoRefreshEnabled ? 'Disable' : 'Enable'} Auto-refresh
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Metrics Overview */}
          <MetricsSummary metrics={metrics} loading={loading} />

          {/* Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3">System Performance Level</h4>
                    <div className="p-4 border rounded-lg">
                      {(() => {
                        const level = performanceUtils.getPerformanceLevel(metrics.average_response_time);
                        return (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-lg font-bold ${level.color}`}>{level.level}</div>
                              <div className="text-sm text-muted-foreground">
                                Average: {performanceUtils.formatDuration(metrics.average_response_time)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Operations</div>
                              <div className="text-lg font-bold">{metrics.total_operations}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Operation Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Fast Operations</span>
                        <span className="font-medium text-green-600">{metrics.fastest_operations.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Slow Operations</span>
                        <span className="font-medium text-yellow-600">{metrics.slow_operations.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Error Operations</span>
                        <span className="font-medium text-red-600">{metrics.error_operations.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? 'Loading performance analysis...' : 'Performance data unavailable'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operations Breakdown */}
          <PerformanceBreakdown initialData={metrics} loading={loading} />

          {/* Raw Data Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Raw Metrics Data</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRawDataVisible(!rawDataVisible)}
                >
                  {rawDataVisible ? 'Hide' : 'Show'} Raw Data
                </Button>
              </div>
            </CardHeader>
            {rawDataVisible && (
              <CardContent>
                {metrics ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(metrics, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No raw data available
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Monitoring Information */}
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Auto-refresh Status</h4>
                  <p className={`text-sm ${isAutoRefreshEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {isAutoRefreshEnabled ? 'Enabled (30s interval)' : 'Disabled'}
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Last Updated</h4>
                  <p className="text-sm text-muted-foreground">
                    {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Data Source</h4>
                  <p className="text-sm text-muted-foreground">
                    /admin/performance/metrics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <div className="font-medium mb-1">Error Loading Metrics</div>
                  <div className="text-sm">{error}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </RequireRole>
  );
}