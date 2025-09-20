"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AssistantLayout } from "@/components/layouts/AssistantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, MessageSquare, Clock, User } from "lucide-react";
import { ApiV2 } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type StudentDash = {
  myOpenTickets?: number;
  resolvedToday?: number;
  avgResponseTimeHours?: number;
};

export default function AssistantDashboard() {
  const [dash, setDash] = useState<StudentDash | null>(null);
  const { user, loading } = useAuth();
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (loading) return;
      const token = ApiV2.getToken?.();
      if (!token) return; // avoid unauthorized calls that redirect to /login
      // Allow admins to view assistant dashboard too, but only fetch if on assistant route
      if (!user) return;
      const res = await ApiV2.getStudentDashboard();
      if (!mounted) return;
      if (res?.success) {
        setDash(res.data || res);
      }
    })();
    return () => { mounted = false; };
  }, [user, loading]);
  return (
    <RequireRole role="assistant">
      <AssistantLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Schedule Assistant Dashboard</h1>
            <p className="text-muted-foreground">
              Track your shifts and manage your schedule
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Shifts This Week</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dash?.myOpenTickets ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  3 upcoming, 2 completed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours Logged Today</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dash?.resolvedToday ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  On schedule today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Coverage</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dash?.avgResponseTimeHours ?? 0}%</div>
                <p className="text-xs text-muted-foreground">
                  This week's average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* My Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Current Schedule</CardTitle>
                  <CardDescription>
                    Your upcoming shifts and assignments
                  </CardDescription>
                </div>
                <Button size="sm">
                  View Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    id: "S-1234", 
                    title: "Morning coverage", 
                    time: "9:00 AM - 1:00 PM",
                    date: "Today",
                    status: "Active",
                    location: "Helpdesk Station 1"
                  },
                  { 
                    id: "S-1235", 
                    title: "Lab supervision", 
                    time: "2:00 PM - 6:00 PM",
                    date: "Tomorrow",
                    status: "Scheduled",
                    location: "Computer Lab B"
                  },
                  { 
                    id: "S-1236", 
                    title: "Evening support", 
                    time: "6:00 PM - 10:00 PM",
                    date: "Friday",
                    status: "Scheduled",
                    location: "Remote Support"
                  },
                ].map((shift) => {
                  let statusClass = "";
                  if (shift.status === "Active") {
                    statusClass = "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
                  } else if (shift.status === "Scheduled") {
                    statusClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
                  } else {
                    statusClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
                  }

                  return (
                    <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{shift.title}</p>
                          <span className={`px-2 py-1 text-xs rounded ${statusClass}`}>
                            {shift.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {shift.location}
                          </span>
                          <span>{shift.time}</span>
                          <span>{shift.date}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common schedule and time tracking tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col">
                  <Ticket className="h-6 w-6 mb-2" />
                  Log Time Entry
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Request Schedule Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AssistantLayout>
    </RequireRole>
  );
}