import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceMetrics } from "@/lib/api/performance";
import { performanceUtils } from "@/lib/api/performance";
import { Activity, Clock, TrendingDown, Zap } from "lucide-react";

interface MetricsSummaryProps {
  metrics: PerformanceMetrics | null;
  loading?: boolean;
}

export function MetricsSummary({ metrics, loading }: MetricsSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['total-ops', 'avg-response', 'slow-ops', 'fast-ops'].map((key) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Metrics Unavailable</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">--</div>
            <p className="text-xs text-gray-400">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performanceLevel = performanceUtils.getPerformanceLevel(metrics.average_response_time);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_operations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            All operations tracked
          </p>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${performanceLevel.color}`}>
            {performanceUtils.formatDuration(metrics.average_response_time)}
          </div>
          <p className="text-xs text-muted-foreground">
            Performance: {performanceLevel.level}
          </p>
        </CardContent>
      </Card>

      {/* Slow Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Slow Operations</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.slow_operations.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {metrics.slow_operations.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.slow_operations.length > 0 ? 'Need optimization' : 'All operations fast'}
          </p>
        </CardContent>
      </Card>

      {/* Fastest Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fastest Operations</CardTitle>
          <Zap className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {/* {metrics.fastest_operations.length} */}
          </div>
          <p className="text-xs text-muted-foreground">
            High performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}