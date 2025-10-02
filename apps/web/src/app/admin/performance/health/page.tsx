"use client";

import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { HealthStatusCard } from "@/components/admin/performance/HealthStatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHealthStatus } from "@/hooks/usePerformance";
import { Activity, RefreshCw, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { routes } from "@/lib/routes";

// Helper function for status styling
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'healthy':
    case 'connected':
      return 'bg-green-100 text-green-800';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800';
    case 'unhealthy':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function HealthMonitoring() {
  const {
    data: health,
    loading,
    error,
    lastUpdated,
    isAutoRefreshEnabled,
    actions
  } = useHealthStatus({
    refreshInterval: 10000, // 10 seconds for health monitoring
    autoRefresh: true,
    enableToastOnError: false
  });

  const handleRefresh = async () => {
    try {
      await actions.refresh();
      toast.success('Health status refreshed');
    } catch (error) {
      console.error('Failed to refresh health status:', error);
      toast.error('Failed to refresh health status');
    }
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
                  <Activity className="h-8 w-8 text-green-600" />
                  System Health Monitoring
                </h1>
                <p className="text-muted-foreground mt-1">
                  Real-time system health status and diagnostics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.toggleAutoRefresh()}
              >
                <Clock className="h-4 w-4 mr-2" />
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

          {/* Health Status Card */}
          <HealthStatusCard health={health} loading={loading} />

          {/* Detailed Health Information */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* System Status Details */}
            <Card>
              <CardHeader>
                <CardTitle>System Status Details</CardTitle>
              </CardHeader>
              <CardContent>
                {health ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">Overall Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(health.status)}`}>
                        {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">Database Connection</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(health.database)}`}>
                        {health.database.charAt(0).toUpperCase() + health.database.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">Total Operations</span>
                      <span className="text-lg font-bold">{health.total_operations.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">Operations with Issues</span>
                      <span className="text-lg font-bold text-red-600">
                        {health.slow_operations_count + health.error_operations_count}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {loading ? 'Loading health status...' : 'Health status unavailable'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Auto-refresh Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isAutoRefreshEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isAutoRefreshEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAutoRefreshEnabled 
                        ? 'Health status updates every 10 seconds' 
                        : 'Manual refresh only'}
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Last Updated</span>
                      <span className="text-sm font-mono">
                        {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Latest health check timestamp
                    </p>
                  </div>
                  
                  {error && (
                    <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-red-800">Connection Error</span>
                      </div>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Health Endpoint</span>
                      <span className="text-xs text-green-600 font-medium">PUBLIC</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This endpoint is accessible without authentication for external monitoring
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status History Note */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium mb-1">Enhanced Monitoring Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Historical health data, uptime tracking, and alert notifications will be available in future updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireRole>
  );
}