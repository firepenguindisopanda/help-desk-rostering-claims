import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SlowOperationsAnalysis } from "@/lib/api/performance";
import { performanceAPI, performanceUtils } from "@/lib/api/performance";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface SlowOperationsTableProps {
  initialData?: SlowOperationsAnalysis | null;
  loading?: boolean;
}

export function SlowOperationsTable({ initialData, loading }: SlowOperationsTableProps) {
  const [data, setData] = useState<SlowOperationsAnalysis | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(loading || false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!initialData && !loading) {
      loadSlowOperations();
    }
  }, [initialData, loading]);

  const loadSlowOperations = async () => {
    try {
      setIsLoading(true);
      const result = await performanceAPI.getSlowOperations();
      setData(result);
    } catch (error) {
      console.error('Failed to load slow operations:', error);
      toast.error('Failed to load slow operations data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRowExpansion = (operationName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(operationName)) {
      newExpanded.delete(operationName);
    } else {
      newExpanded.add(operationName);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
            </div>
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['op1', 'op2', 'op3'].map((key) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Operations Needing Optimization
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data ? `${data.count} operations exceeding ${data.threshold}` : 'Operations requiring performance attention'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSlowOperations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.slow_operations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-600 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-600 mb-1">All Operations Performing Well!</h3>
            <p className="text-sm text-muted-foreground">
              No operations are currently exceeding the performance threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.slow_operations.map((operation) => (
              <div
                key={operation.name}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleRowExpansion(operation.name)}
                        className="flex items-center gap-1 text-sm font-mono font-medium hover:text-blue-600 transition-colors"
                      >
                        {expandedRows.has(operation.name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {operation.name}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Average Duration:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {performanceUtils.formatDuration(operation.avg_duration)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Call Count:</span>
                        <span className="ml-2 font-medium">{operation.call_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Called:</span>
                        <span className="ml-2 font-medium">
                          {performanceUtils.formatRelativeTime(operation.last_called)}
                        </span>
                      </div>
                    </div>

                    {expandedRows.has(operation.name) && operation.recommendations && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Optimization Recommendations</span>
                        </div>
                        <ul className="space-y-1 text-sm text-blue-700">
                          {operation.recommendations.map((recommendation, index) => (
                            <li key={`${operation.name}-rec-${index}`} className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 text-right">
                    <div className="text-lg font-bold text-red-600">
                      {(() => {
                        if (operation.avg_duration > 5) return 'Critical';
                        if (operation.avg_duration > 2) return 'High';
                        return 'Medium';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">Priority</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}