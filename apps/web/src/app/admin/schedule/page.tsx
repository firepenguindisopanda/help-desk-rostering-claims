"use client";

import { useState, useEffect } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Calendar,
  Download,
  Save,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Zap,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import "./schedule.css";

// Import schedule client for simple operations
import { scheduleClient, ScheduleHttpError } from '@/lib/scheduleClient';
import type { Schedule } from '@/lib/scheduleClient';

// Import existing components
import { ScheduleGenerationForm } from "@/components/ScheduleGenerationForm";
import { ScheduleGrid, EmptyScheduleState, ScheduleLoadingState, ScheduleErrorState } from '@/components/ScheduleGrid';

import { 
  useScheduleManagement, 
  useAvailableStaff, 
  useOptimisticScheduleUpdate 
} from "@/hooks/useScheduleQueries";

// Import types from the API types file
import type { 
  Staff as StaffMember,
  Shift as ShiftAssignment
} from "@/types/schedule";

import type { GenerateScheduleFormData } from "@/lib/validation/scheduleSchemas";

// Schedule cell component
interface ScheduleCellProps {
  day: string;
  time: string;
  shift?: ShiftAssignment;
  onAddStaff: (day: string, time: string) => void;
  onRemoveStaff: (day: string, time: string, staffId: string) => void;
  onDrop: (e: React.DragEvent, day: string, time: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  draggedStaff: StaffMember | null;
}

function ScheduleCell(props: Readonly<ScheduleCellProps>) {
  const { 
    day, 
    time, 
    shift, 
    onAddStaff, 
    onRemoveStaff, 
    onDrop, 
    onDragOver, 
    onDragStart, 
    draggedStaff 
  } = props;
  
  const assistants = shift?.assistants || [];
  const maxStaff = shift?.max_staff || 3;
  
  const getDragClass = () => {
    if (!draggedStaff) return '';
    
    if (assistants.some(a => a.id === draggedStaff.id)) {
      return 'drag-invalid';
    }
    
    if (assistants.length >= maxStaff) {
      return 'drag-full';
    }
    
    return 'drag-valid';
  };

  return (
    <td
      className={`schedule-cell border border-border p-2 min-h-[100px] relative ${getDragClass()}`}
      onDrop={(e) => onDrop(e, day, time)}
      onDragOver={onDragOver}
    >
      <div className="h-full flex flex-col">
        {/* Staff List */}
        <div className="flex-1 space-y-1">
          {assistants.map((staff) => (
            <div
              key={staff.id}
              className="staff-item bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-2 py-1 text-xs flex justify-between items-center"
            >
              <button
                className="truncate flex-1 cursor-move text-left bg-transparent border-none p-0"
                draggable
                onDragStart={(e) => onDragStart(e, staff)}
                aria-label={`Drag ${staff.name} to reassign`}
                type="button"
              >
                {staff.name}
              </button>
              <button
                onClick={() => onRemoveStaff(day, time, staff.id)}
                className="ml-1 hover:bg-red-200 dark:hover:bg-red-800 rounded p-0.5"
                title="Remove staff"
                aria-label={`Remove ${staff.name} from this shift`}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Staff Button */}
        {assistants.length < maxStaff && (
          <button
            onClick={() => onAddStaff(day, time)}
            className="add-staff-btn mt-2 w-full py-1 px-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Staff
          </button>
        )}

        {/* Staff Count Indicator */}
        <div className="staff-count text-xs text-muted-foreground mt-1 text-center">
          {assistants.length}/{maxStaff}
        </div>
      </div>
    </td>
  );
}

// Legend component
function ScheduleLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 border rounded"></div>
          <span>Staff Assignment</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900 border rounded"></div>
          <span>Available Slot</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900 border rounded"></div>
          <span>Conflict/Full</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Drag and drop to reassign staff between time slots
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSchedulePage() {
  // Professional React Query hooks
  const scheduleManager = useScheduleManagement();
  const optimistic = useOptimisticScheduleUpdate();

  // Local state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: string, time: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedStaff, setDraggedStaff] = useState<StaffMember | null>(null);

  // Simple schedule generation state
  const [simpleLoading, setSimpleLoading] = useState(false);
  const [simpleSchedule, setSimpleSchedule] = useState<Schedule | null>(null);
  const [simpleError, setSimpleError] = useState<string | null>(null);

  // Conditional hooks for staff availability when modal is open
  const staffQuery = useAvailableStaff(
    selectedCell?.day || '',
    selectedCell?.time || '',
    showStaffModal && !!selectedCell
  );

  const loading = scheduleManager.isLoading;
  const schedule = scheduleManager.currentSchedule;
  const availableStaff = staffQuery.data?.staff || [];

  // Initialize default dates
  useEffect(() => {
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    setStartDate(monday.toISOString().split('T')[0]);
    setEndDate(friday.toISOString().split('T')[0]);
  }, []);

  // Time slots for helpdesk (9 AM - 5 PM)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Days of the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Simple schedule generation (API v2)
  const handleSimpleGenerateSchedule = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setSimpleLoading(true);
    setSimpleError(null);

    try {
      const schedule = await scheduleClient.generateAndFetchSchedule({
        start_date: startDate,
        end_date: endDate,
      });

      setSimpleSchedule(schedule);
      toast.success('Schedule generated successfully');
    } catch (error) {
      console.error('Schedule generation error:', error);
      const errorMessage = error instanceof ScheduleHttpError 
        ? error.message 
        : 'Failed to generate schedule. Please try again.';
      setSimpleError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSimpleLoading(false);
    }
  };

  // Advanced schedule generation (existing system)
  const handleGenerateSchedule = async (data: GenerateScheduleFormData) => {
    try {
      // Clear simple schedule when generating advanced one
      setSimpleSchedule(null);
      setSimpleError(null);
      
      await scheduleManager.generateSchedule.mutateAsync(data);
      toast.success('Advanced schedule generated successfully');
    } catch (error) {
      console.error('Advanced schedule generation error:', error);
      toast.error('Failed to generate advanced schedule');
    }
  };

  const handleClearSchedule = () => {
    if (!schedule?.schedule?.id) return;
    
    // Clear both simple and advanced schedules
    setSimpleSchedule(null);
    setSimpleError(null);
    
    scheduleManager.clearSchedule.mutate({
      schedule_type: 'helpdesk',
      schedule_id: schedule.schedule.id
    });
    setShowClearModal(false);
  };

  const handleSaveSchedule = () => {
    if (!schedule?.schedule) return;

    // Convert current schedule to save format
    const assignments = schedule.schedule.days.flatMap(day => 
      day.shifts.map(shift => ({
        day: day.day,
        time: shift.time,
        cell_id: shift.cell_id || `${day.day}-${shift.time}`,
        staff: shift.assistants
      }))
    );

    scheduleManager.saveSchedule.mutate({
      start_date: schedule.schedule.start_date,
      end_date: schedule.schedule.end_date,
      schedule_type: 'helpdesk',
      assignments
    });
  };

  const handleDownloadPDF = () => {
    scheduleManager.exportPDF.mutate('standard');
  };

  const openStaffModal = (day: string, time: string) => {
    setSelectedCell({ day, time });
    setSearchTerm('');
    setShowStaffModal(true);
  };

  const addStaffToShift = (staff: StaffMember) => {
    if (!selectedCell) return;

    const { day, time } = selectedCell;
    
    // Check if staff is already assigned
    const currentShift = getShiftByDayTime(day, time);
    if (currentShift?.assistants.some(a => a.id === staff.id)) {
      toast.warning(`${staff.name} is already assigned to this shift`);
      return;
    }
    
    if (currentShift && currentShift.assistants.length >= (currentShift.max_staff || 3)) {
      toast.warning("Maximum staff limit reached for this shift");
      return;
    }
    
    // Optimistic update
    optimistic.addStaffOptimistically(day, time, staff);
    
    setShowStaffModal(false);
    toast.success(`${staff.name} added to ${day} at ${time}`);
  };

  const removeStaffFromShift = (day: string, time: string, staffId: string) => {
    if (!schedule?.schedule?.days) return;

    // Find staff name for toast
    const removedStaff = schedule.schedule.days
      .find(d => d.day === day)
      ?.shifts.find(s => s.time === time)
      ?.assistants.find(a => a.id === staffId);

    // Optimistic update
    optimistic.removeStaffOptimistically(day, time, staffId);
    
    toast.success(`${removedStaff?.name || 'Staff member'} removed from ${day} at ${time}`);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, staff: StaffMember) => {
    setDraggedStaff(staff);
    e.dataTransfer.setData('application/json', JSON.stringify(staff));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedStaff(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, day: string, time: string) => {
    e.preventDefault();
    
    try {
      const staffData = JSON.parse(e.dataTransfer.getData('application/json')) as StaffMember;
      
      // Check if already assigned
      const shift = getShiftByDayTime(day, time);
        
      if (shift?.assistants.some(a => a.id === staffData.id)) {
        toast.warning(`${staffData.name} is already assigned to this shift`);
        return;
      }

      if (shift && shift.assistants.length >= (shift.max_staff || 3)) {
        toast.warning("Maximum staff limit reached for this shift");
        return;
      }

      // Optimistic update
      optimistic.addStaffOptimistically(day, time, staffData);
      toast.success(`${staffData.name} assigned to ${day} at ${time}`);
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Failed to assign staff');
    } finally {
      handleDragEnd();
    }
  };

  const getShiftByDayTime = (day: string, time: string) => {
    return schedule?.schedule?.days
      ?.find(d => d.day === day)
      ?.shifts.find(s => s.time === time);
  };

  // Helper function to render schedule content
  const renderScheduleContent = () => {
    if (simpleLoading) {
      return <ScheduleLoadingState />;
    }
    
    if (simpleError) {
      return (
        <ScheduleErrorState 
          error={simpleError} 
          onRetry={handleSimpleGenerateSchedule} 
        />
      );
    }
    
    if (simpleSchedule) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Generated Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleGrid schedule={simpleSchedule} />
          </CardContent>
        </Card>
      );
    }
    
    if (!schedule) {
      return <EmptyScheduleState />;
    }
    
    return null;
  };

  const filteredStaff = availableStaff.filter((staff: StaffMember) =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RequireRole role="admin">
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Help Desk Schedule</h1>
            <p className="text-muted-foreground">
              Manage staff assignments and weekly scheduling
            </p>
          </div>

          {/* Date Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
                  <DatePicker
                    id="start-date"
                    value={startDate}
                    onChange={(v) => setStartDate(v)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
                  <DatePicker
                    id="end-date"
                    value={endDate}
                    onChange={(v) => setEndDate(v)}
                    min={startDate}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSimpleGenerateSchedule}
                    disabled={!startDate || !endDate || simpleLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {simpleLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Schedule
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowGenerationForm(true)}
                    disabled={loading || scheduleManager.generateSchedule.isPending}
                    variant="outline"
                    className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Generate with Options
                  </Button>
                  {(schedule || simpleSchedule) && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setShowClearModal(true)}
                        disabled={scheduleManager.clearSchedule.isPending}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSaveSchedule}
                        disabled={scheduleManager.saveSchedule.isPending}
                        className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {scheduleManager.saveSchedule.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        disabled={scheduleManager.exportPDF.isPending}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {scheduleManager.exportPDF.isPending ? "Exporting..." : "PDF"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Content */}
          {renderScheduleContent()}

          {/* Existing Schedule Table */}
          {schedule && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule (Advanced)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="schedule-table-container overflow-x-auto">
                  <table className="schedule-table w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-border p-3 bg-muted font-medium">Time</th>
                        {weekDays.map(day => (
                          <th key={day} className="border border-border p-3 bg-muted font-medium min-w-[150px]">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(time => (
                        <tr key={time}>
                          <td className="border border-border p-3 bg-muted/50 font-medium text-center">
                            {time}
                          </td>
                          {weekDays.map(day => (
                            <ScheduleCell
                              key={`${day}-${time}`}
                              day={day}
                              time={time}
                              shift={getShiftByDayTime(day, time)}
                              onAddStaff={openStaffModal}
                              onRemoveStaff={removeStaffFromShift}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragStart={handleDragStart}
                              draggedStaff={draggedStaff}
                            />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          {(schedule || simpleSchedule) && <ScheduleLegend />}

          {/* Staff Modal */}
          <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Add Staff to {selectedCell?.day} at {selectedCell?.time}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {(() => {
                    if (staffQuery.isLoading) {
                      return <div className="text-center py-4">Loading available staff...</div>;
                    }
                    
                    if (filteredStaff.length === 0) {
                      return (
                        <div className="text-center py-4 text-muted-foreground">
                          No available staff found
                        </div>
                      );
                    }
                    
                    return filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        className="w-full flex items-center justify-between p-3 border border-border rounded hover:bg-muted cursor-pointer text-left"
                        onClick={() => addStaffToShift(staff)}
                        type="button"
                      >
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          {staff.email && (
                            <div className="text-sm text-muted-foreground">{staff.email}</div>
                          )}
                        </div>
                        <Plus className="h-4 w-4" />
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Clear Schedule Modal */}
          <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  Clear Schedule
                </DialogTitle>
              </DialogHeader>
              
              <p className="text-muted-foreground">
                Are you sure you want to clear the current schedule? This action cannot be undone.
              </p>
              
              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowClearModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleClearSchedule}
                  disabled={scheduleManager.clearSchedule.isPending}
                >
                  {scheduleManager.clearSchedule.isPending ? "Clearing..." : "Clear Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Schedule Generation Form */}
          <ScheduleGenerationForm
            isOpen={showGenerationForm}
            onClose={() => setShowGenerationForm(false)}
            onSubmit={handleGenerateSchedule}
            isSubmitting={scheduleManager.generateSchedule.isPending}
            initialData={{
              start_date: startDate,
              end_date: endDate,
            }}
          />
        </div>
      </AdminLayout>
    </RequireRole>
  );
}