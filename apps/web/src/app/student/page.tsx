"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AssistantLayout } from "@/components/layouts/AssistantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { ApiV2 } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type StudentDashboardData = {
  upcomingShifts?: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    course?: string;
    status: string;
  }>;
  currentShift?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    timeRemaining?: string;
  };
  weeklySchedule?: Array<{
    day: string;
    date: string;
    shifts: Array<{
      id: string;
      title: string;
      time: string;
      duration: string;
      location?: string;
      status: string;
    }>;
  }>;
  stats?: {
    hoursThisWeek?: number;
    hoursThisMonth?: number;
    totalShifts?: number;
    upcomingShifts?: number;
  };
};

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function fetchDashboardData() {
      try {
        const result = await ApiV2.getStudentDashboard();
        if (!mounted) return;
        
        if (result.success) {
          setData(result.data || {});
        }
      } catch (error) {
        console.error('Failed to fetch student dashboard data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (user?.role === "assistant") {
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
      <RequireRole role="assistant">
        <AssistantLayout>
          <div className="space-y-6">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {["hours-week", "hours-month", "total-shifts", "upcoming"].map((cardType) => (
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
        </AssistantLayout>
      </RequireRole>
    );
  }

  const defaultStats = {
    hoursThisWeek: 12,
    hoursThisMonth: 48,
    totalShifts: 8,
    upcomingShifts: 3,
  };

  const stats = data.stats || defaultStats;

  return (
    <RequireRole role="assistant">
      <AssistantLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your Help Desk Assistant dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.hoursThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Out of 20 scheduled
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.hoursThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  Hours worked
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalShifts}</div>
                <p className="text-xs text-muted-foreground">
                  This semester
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingShifts}</div>
                <p className="text-xs text-muted-foreground">
                  Shifts scheduled
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Status and Upcoming */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Shift */}
            {data.currentShift ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Current Shift
                  </CardTitle>
                  <CardDescription>You are currently on duty</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{data.currentShift.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {data.currentShift.start_time} - {data.currentShift.end_time}
                    </div>
                    {data.currentShift.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {data.currentShift.location}
                      </div>
                    )}
                    {data.currentShift.timeRemaining && (
                      <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                        <strong>Time remaining:</strong> {data.currentShift.timeRemaining}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Current Shift</CardTitle>
                  <CardDescription>Your active shift status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground">No active shift</p>
                    <p className="text-sm text-muted-foreground mt-1">Your next shift will appear here</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Shifts */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Shifts</CardTitle>
                <CardDescription>Your scheduled shifts for the next few days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(data.upcomingShifts || [
                    {
                      id: "1",
                      title: "IT Help Desk",
                      start_time: "09:00",
                      end_time: "13:00",
                      location: "Computer Lab A",
                      course: "COMP 1600",
                      status: "confirmed"
                    },
                    {
                      id: "2", 
                      title: "Student Support",
                      start_time: "14:00",
                      end_time: "17:00",
                      location: "Library - Level 2",
                      course: "COMP 1601",
                      status: "pending"
                    },
                    {
                      id: "3",
                      title: "Math Tutoring",
                      start_time: "10:00", 
                      end_time: "12:00",
                      location: "Math Center",
                      course: "MATH 1115",
                      status: "confirmed"
                    }
                  ]).map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{shift.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {shift.start_time} - {shift.end_time}
                          </div>
                          {shift.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shift.location}
                            </div>
                          )}
                        </div>
                        {shift.course && (
                          <p className="text-xs text-muted-foreground">{shift.course}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        shift.status === "confirmed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {shift.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Your schedule for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {(data.weeklySchedule || [
                  {
                    day: "Monday",
                    date: "Dec 16",
                    shifts: [
                      { id: "1", title: "IT Help", time: "09:00", duration: "4h", location: "Lab A", status: "confirmed" }
                    ]
                  },
                  {
                    day: "Tuesday", 
                    date: "Dec 17",
                    shifts: [
                      { id: "2", title: "Student Support", time: "14:00", duration: "3h", location: "Library", status: "confirmed" }
                    ]
                  },
                  {
                    day: "Wednesday",
                    date: "Dec 18", 
                    shifts: []
                  },
                  {
                    day: "Thursday",
                    date: "Dec 19",
                    shifts: [
                      { id: "3", title: "Math Tutoring", time: "10:00", duration: "2h", location: "Math Center", status: "pending" }
                    ]
                  },
                  {
                    day: "Friday",
                    date: "Dec 20",
                    shifts: [
                      { id: "4", title: "IT Help", time: "09:00", duration: "4h", location: "Lab B", status: "confirmed" }
                    ]
                  }
                ]).map((day) => (
                  <div key={day.day} className="space-y-2">
                    <div className="text-center">
                      <h4 className="font-medium text-sm">{day.day}</h4>
                      <p className="text-xs text-muted-foreground">{day.date}</p>
                    </div>
                    <div className="space-y-2">
                      {day.shifts.length === 0 ? (
                        <div className="h-16 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No shifts</span>
                        </div>
                      ) : (
                        day.shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`p-2 rounded text-xs ${
                              shift.status === "confirmed"
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-yellow-50 border border-yellow-200"
                            }`}
                          >
                            <div className="font-medium">{shift.title}</div>
                            <div className="text-muted-foreground">{shift.time}</div>
                            <div className="text-muted-foreground">{shift.duration}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AssistantLayout>
    </RequireRole>
  );
}