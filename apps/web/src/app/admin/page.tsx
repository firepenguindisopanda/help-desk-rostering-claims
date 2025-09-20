"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, TrendingUp } from "lucide-react";
import { ApiV2 } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AdminDashboardData = {
  totalUsers?: number;
  totalAssistants?: number;
  totalAdmins?: number;
  openShifts?: number;
  filledShifts?: number;
  avgCoverageRate?: number;
  hoursLoggedToday?: number;
  currentSchedule?: {
    id: string;
    title: string;
    status: string;
    coverage: number;
  };
  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
    priority?: string;
  }>;
  activeStaff?: Array<{
    id: string;
    name: string;
    status: string;
    currentShift?: string;
    hoursToday: number;
  }>;
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function fetchDashboardData() {
      try {
        const result = await ApiV2.getAdminDashboard();
        if (!mounted) return;
        
        if (result.success) {
          setData(result.data || {});
        }
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (user?.role === "admin") {
      fetchDashboardData();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <RequireRole role="admin">
        <AdminLayout>
          <div className="space-y-6">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {["total-staff", "active-shifts", "coverage-rate", "hours-logged"].map((cardType) => (
                <Card key={cardType}>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </AdminLayout>
      </RequireRole>
    );
  }

  return (
    <RequireRole role="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the Help Desk Rostering administration panel
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalUsers ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data.totalAssistants ?? 0} assistants, {data.totalAdmins ?? 0} admins
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.filledShifts ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data.openShifts ?? 0} shifts open
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.avgCoverageRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Weekly average
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours Logged Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.hoursLoggedToday ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all staff
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Content */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest schedule changes and requests in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data.recentActivity || [
                    { id: "SC-1234", type: "schedule", description: "Shift swap request approved", user: "john@example.com", timestamp: "2h ago", priority: "High" },
                    { id: "SC-1235", type: "timeoff", description: "Time off request submitted", user: "jane@example.com", timestamp: "4h ago", priority: "Medium" },
                    { id: "SC-1236", type: "schedule", description: "Schedule updated for next week", user: "admin", timestamp: "6h ago", priority: "Low" },
                  ]).map((activity) => {
                    let priorityClass = "";
                    if (activity.priority === "High") {
                      priorityClass = "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
                    } else if (activity.priority === "Medium") {
                      priorityClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
                    } else {
                      priorityClass = "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
                    }
                    return (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.user} • {activity.timestamp}</p>
                        </div>
                        {activity.priority && (
                          <span className={`px-2 py-1 text-xs rounded ${priorityClass}`}>
                            {activity.priority}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Active Staff */}
            <Card>
              <CardHeader>
                <CardTitle>Active Staff</CardTitle>
                <CardDescription>
                  Currently on-duty schedule assistants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data.activeStaff || [
                    { id: "1", name: "Alice Johnson", status: "On Shift", currentShift: "Morning Help Desk", hoursToday: 5 },
                    { id: "2", name: "Bob Smith", status: "Break", currentShift: "Afternoon Support", hoursToday: 8 },
                    { id: "3", name: "Carol Davis", status: "On Shift", currentShift: "IT Help Desk", hoursToday: 3 },
                  ]).map((assistant) => {
                    const getStatusColor = (status: string) => {
                      if (status === "On Shift") return "bg-green-500";
                      if (status === "Break") return "bg-yellow-500";
                      return "bg-gray-500";
                    };

                    return (
                      <div key={assistant.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(assistant.status)}`} />
                          <div>
                            <p className="text-sm font-medium">{assistant.name}</p>
                            {assistant.currentShift && (
                              <p className="text-xs text-muted-foreground">{assistant.currentShift}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {assistant.hoursToday}h today
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Schedule Overview */}
          {data.currentSchedule && (
            <Card>
              <CardHeader>
                <CardTitle>Current Schedule</CardTitle>
                <CardDescription>
                  Overview of today's schedule status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{data.currentSchedule.title}</h3>
                    <p className="text-sm text-muted-foreground">Status: {data.currentSchedule.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{data.currentSchedule.coverage}%</p>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </RequireRole>
  );
}