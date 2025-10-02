import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PerformanceMetrics } from "@/lib/api/performance";
import { performanceAPI, performanceUtils } from "@/lib/api/performance";
import { RefreshCw, AlertCircle, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";

interface PerformanceBreakdownProps {
  initialData?: PerformanceMetrics | null;
  loading?: boolean;
}

export function PerformanceBreakdown({ initialData, loading }: PerformanceBreakdownProps) {
  const [data, setData] = useState<PerformanceMetrics | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(loading || false);

  useEffect(() => {
    if (!initialData && !loading) {
      loadMetrics();
    }
  }, [initialData, loading]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const result = await performanceAPI.getMetrics();
      setData(result);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {['errors', 'fast-ops'].map((key) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['item1', 'item2', 'item3'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-2 border rounded">
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Error Operations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error Operations
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!data || data.error_operations.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-green-600 mb-2">
                <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-green-600 font-medium">No error operations</p>
              <p className="text-xs text-muted-foreground">All operations are running successfully</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.error_operations.map((operation) => (
                <div
                  key={operation.name}
                  className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium text-red-800">{operation.name}</p>
                    <p className="text-xs text-red-600 mt-1" title={operation.last_error}>
                      {operation.last_error.length > 50 
                        ? `${operation.last_error.substring(0, 50)}...` 
                        : operation.last_error}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-bold text-red-600">{operation.error_count}</div>
                    <div className="text-xs text-red-500">errors</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fast Operations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Fastest Operations
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 font-medium">No fast operations data</p>
              <p className="text-xs text-muted-foreground">Performance data not available</p>
            </div>
          ) : (
            <div className="space-y-3">
                Fastest Operation will be displayed here
              {/* {data.fastest_operations.map((operation) => (
                <div
                  key={operation.name}
                  className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium text-green-800">{operation.name}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {operation.call_count} calls
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-bold text-green-600">
                      {performanceUtils.formatDuration(operation.avg_duration)}
                    </div>
                    <div className="text-xs text-green-500">avg time</div>
                  </div>
                </div>
              ))} */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}