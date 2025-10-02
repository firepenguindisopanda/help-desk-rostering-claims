import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthStatus } from "@/lib/api/performance";
import { performanceUtils } from "@/lib/api/performance";
import { Activity, Database, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface HealthStatusCardProps {
  health: HealthStatus | null;
  loading?: boolean;
}

export function HealthStatusCard({ health, loading }: HealthStatusCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['database', 'operations', 'slow-ops', 'errors'].map((key) => (
              <div key={key} className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-gray-400" />
            <CardTitle className="text-gray-500">System Status Unavailable</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to retrieve system health status</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Performance Degraded';
      case 'unhealthy':
        return 'System Issues Detected';
      default:
        return 'Status Unknown';
    }
  };

  const statusColorClass = performanceUtils.getHealthStatusColor(health.status);

  return (
    <Card className={`border-l-4 ${statusColorClass}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(health.status)}
            <CardTitle className="text-lg font-semibold">
              System Status: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {getStatusText(health.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-xs text-muted-foreground capitalize">{health.database}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium">Total Operations</p>
            <p className="text-lg font-bold">{health.total_operations.toLocaleString()}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">Slow Operations</p>
            <p className={`text-lg font-bold ${health.slow_operations_count > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {health.slow_operations_count}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium">Error Operations</p>
            <p className={`text-lg font-bold ${health.error_operations_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {health.error_operations_count}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}