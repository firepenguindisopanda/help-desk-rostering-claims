"use client";

import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { SlowOperationsTable } from "@/components/admin/performance/SlowOperationsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSlowOperations } from "@/hooks/usePerformance";
import { Lightbulb, RefreshCw, ArrowLeft, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { routes } from "@/lib/routes";

export default function PerformanceOptimization() {
  const {
    data: slowOps,
    loading,
    error,
    lastUpdated,
    actions
  } = useSlowOperations({
    refreshInterval: 60000,
    autoRefresh: false,
    enableToastOnError: true
  });

  const handleRefresh = async () => {
    try {
      await actions.refresh();
      toast.success('Optimization data refreshed');
    } catch (error) {
      console.error('Failed to refresh optimization data:', error);
      toast.error('Failed to refresh optimization data');
    }
  };

  const priorityOperations = slowOps?.slow_operations || [];
  const criticalOps = priorityOperations.filter(op => op.avg_duration > 5);
  const highPriorityOps = priorityOperations.filter(op => op.avg_duration > 2 && op.avg_duration <= 5);
  const mediumPriorityOps = priorityOperations.filter(op => op.avg_duration <= 2);

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
                  <Lightbulb className="h-8 w-8 text-yellow-600" />
                  Performance Optimization
                </h1>
                <p className="text-muted-foreground mt-1">
                  Detailed analysis and recommendations for improving system performance
                </p>
              </div>
            </div>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>

          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{criticalOps.length}</div>
                <p className="text-xs text-muted-foreground">
                  Operations {'>'} 5 seconds
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{highPriorityOps.length}</div>
                <p className="text-xs text-muted-foreground">
                  Operations 2-5 seconds
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
                <TrendingDown className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mediumPriorityOps.length}</div>
                <p className="text-xs text-muted-foreground">
                  Operations under 2 seconds
                </p>
              </CardContent>
            </Card>
          </div>

          {/* General Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                General Performance Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Database Optimization</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Add database indexes for frequently queried columns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Use connection pooling to reduce connection overhead</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Implement query caching for expensive operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Consider read replicas for heavy read workloads</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Application Optimization</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Implement response caching for static data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Use background job processing for heavy tasks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Optimize API payload sizes and pagination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Monitor memory usage and implement cleanup</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Operations Analysis */}
          <SlowOperationsTable initialData={slowOps} loading={loading} />

          {/* Performance Monitoring Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Regular Reviews</h4>
                  <p className="text-sm text-muted-foreground">
                    Review performance metrics weekly to identify trends and potential issues before they impact users.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Set Thresholds</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure alerting thresholds based on your application's performance requirements and user expectations.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Track Changes</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor performance after deployments to quickly identify regressions and measure optimization impact.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated Info */}
          {lastUpdated && (
            <div className="text-center py-4 border-t">
              <p className="text-xs text-muted-foreground">
                Analysis last updated: {lastUpdated.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </RequireRole>
  );
}