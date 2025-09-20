"use client";

import { useState, useEffect } from "react";
import { RequireRole } from "@/components/RequireRole";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar,
  Download,
  Save,
  Trash2,
  Plus,
  X,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import "./schedule.css";
import { 
  useScheduleAPI, 
  useStaffAvailability, 
  useStaffSearch, 
  useDragAndDrop
} from "@/hooks/useSchedule";

// Import types from the hook file
import type { 
  StaffMember,
  ShiftAssignment,
  ScheduleData
} from "@/hooks/useSchedule";

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
  availabilityCache: Record<string, boolean>;
}

function ScheduleCell({ 
  day, 
  time, 
  shift, 
  onAddStaff, 
  onRemoveStaff, 
  onDrop, 
  onDragOver,
  onDragStart,
  draggedStaff,
  availabilityCache 
}: ScheduleCellProps) {
  const [dragOver, setDragOver] = useState(false);
  const staffCount = shift?.assistants?.length || 0;
  const maxStaff = shift?.maxStaff || 3;
  
  const getDragHighlight = () => {
    if (!draggedStaff || !dragOver) return '';
    
    const availabilityKey = `${draggedStaff.id}-${day}-${time}`;
    const isAvailable = availabilityCache[availabilityKey];
    const isAlreadyAssigned = shift?.assistants?.some(a => a.id === draggedStaff.id);
    
    if (isAlreadyAssigned) return 'duplicate-assignment';
    if (isAvailable === false) return 'not-available';
    if (isAvailable === true) return 'droppable';
    return 'droppable'; // Default to droppable if unknown
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(e, day, time);
  };

  return (
    <td 
      className={`schedule-cell border border-border p-2 min-h-[120px] relative ${getDragHighlight()}`}
      data-day={day}
      data-time={time}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="staff-container space-y-1">
        <div className="staff-slot-indicator text-xs text-muted-foreground mb-2">
          Staff: {staffCount}/{maxStaff}
        </div>
        
        {shift?.assistants?.map(assistant => (
          <button 
            key={assistant.id}
            className="staff-name bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs flex items-center justify-between cursor-move w-full text-left"
            draggable
            onDragStart={(e) => {
              onDragStart(e, assistant);
            }}
          >
            <span className="truncate">{assistant.name}</span>
            <button 
              className="remove-staff ml-1 hover:text-destructive flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveStaff(day, time, assistant.id);
              }}
              aria-label={`Remove ${assistant.name} from this shift`}
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        ))}
        
        {staffCount < maxStaff && (
          <button 
            className="add-staff-btn w-full text-xs bg-muted hover:bg-muted/80 border border-dashed border-muted-foreground/30 rounded px-2 py-1 flex items-center justify-center gap-1"
            onClick={() => onAddStaff(day, time)}
          >
            <Plus className="h-3 w-3" />
            Add Staff
          </button>
        )}
      </div>
    </td>
  );
}

// Legend component
function ScheduleLegend() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Schedule Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="legend-color w-4 h-4 border-2 border-dashed border-blue-400 bg-blue-50 rounded"></div>
            <span>Available for assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="legend-color w-4 h-4 border-2 border-dashed border-red-400 bg-red-50 rounded"></div>
            <span>Staff not available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="legend-color w-4 h-4 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded"></div>
            <span>Already assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="legend-color w-4 h-4 border-2 border-green-400 bg-green-50 rounded"></div>
            <span>Currently hovering</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSchedulePage() {
  // Hook usage
  const { loading: scheduleLoading, schedule, setSchedule, generateSchedule, saveSchedule, clearSchedule, downloadPDF } = useScheduleAPI();
  const { availabilityCache, checkStaffAvailability } = useStaffAvailability();
  const { loading: staffLoading, searchAvailableStaff } = useStaffSearch();
  const { draggedStaff, handleDragStart, handleDragEnd, handleDragOver, parseDragData } = useDragAndDrop();

  // Local state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: string, time: string} | null>(null);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loading = scheduleLoading || staffLoading;

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

  const handleGenerateSchedule = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      await generateSchedule(startDate, endDate);
      toast.success("Schedule generated successfully!");
    } catch (error) {
      toast.error("Failed to generate schedule");
      console.error(error);
    }
  };

  const handleClearSchedule = async () => {
    try {
      await clearSchedule();
      setShowClearModal(false);
    } catch (error) {
      toast.error("Failed to clear schedule");
      console.error(error);
    }
  };

  const handleSaveSchedule = async () => {
    if (!schedule) return;

    try {
      await saveSchedule(schedule);
    } catch (error) {
      toast.error("Failed to save schedule");
      console.error(error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!schedule) return;

    try {
      await downloadPDF(schedule);
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error(error);
    }
  };

  const openStaffModal = async (day: string, time: string) => {
    setSelectedCell({ day, time });
    setSearchTerm('');
    
    try {
      const staff = await searchAvailableStaff(day, time);
      setAvailableStaff(staff);
      setShowStaffModal(true);
    } catch (error) {
      toast.error("Failed to load available staff");
      console.error(error);
    }
  };

  const addStaffToShift = (staff: StaffMember) => {
    if (!schedule || !selectedCell) return;

    const { day, time } = selectedCell;
    const updatedShifts = schedule.shifts.map(shift => {
      if (shift.day === day && shift.time === time) {
        const isAlreadyAssigned = shift.assistants.some(a => a.id === staff.id);
        if (isAlreadyAssigned) {
          toast.warning(`${staff.name} is already assigned to this shift`);
          return shift;
        }
        if (shift.assistants.length >= shift.maxStaff) {
          toast.warning("Maximum staff limit reached for this shift");
          return shift;
        }
        return {
          ...shift,
          assistants: [...shift.assistants, staff]
        };
      }
      return shift;
    });

    setSchedule({ ...schedule, shifts: updatedShifts });
    setShowStaffModal(false);
    toast.success(`${staff.name} added to ${day} at ${time}`);
  };

  const removeStaffFromShift = (day: string, time: string, staffId: string) => {
    if (!schedule) return;

    const updatedShifts = schedule.shifts.map(shift => {
      if (shift.day === day && shift.time === time) {
        return {
          ...shift,
          assistants: shift.assistants.filter(a => a.id !== staffId)
        };
      }
      return shift;
    });

    setSchedule({ ...schedule, shifts: updatedShifts });
    
    const removedStaff = schedule.shifts
      .find(s => s.day === day && s.time === time)
      ?.assistants.find(a => a.id === staffId);
    
    if (removedStaff) {
      toast.success(`${removedStaff.name} removed from ${day} at ${time}`);
    }
  };

  const handleDrop = async (e: React.DragEvent, day: string, time: string) => {
    try {
      const staffData = parseDragData(e);
      if (!staffData) return;
      
      // Check if already assigned
      const shift = schedule?.shifts.find(s => s.day === day && s.time === time);
      if (shift?.assistants.some(a => a.id === staffData.id)) {
        toast.warning(`${staffData.name} is already assigned to this time slot`);
        return;
      }

      // Check availability (mock implementation)
      const availabilityKey = `${staffData.id}-${day}-${time}`;
      const isAvailable = availabilityCache[availabilityKey] ?? true; // Default to available
      
      if (!isAvailable) {
        toast.warning(`${staffData.name} is not available at this time`);
        return;
      }

      // Add staff to shift
      addStaffToShift(staffData);
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Failed to assign staff');
    } finally {
      handleDragEnd();
    }
  };

  const getShiftByDayTime = (day: string, time: string) => {
    return schedule?.shifts.find(s => s.day === day && s.time === time);
  };

  const filteredStaff = availableStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateSchedule}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                  {schedule && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setShowClearModal(true)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSaveSchedule}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Table */}
          {schedule && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
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
                              availabilityCache={availabilityCache}
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
          {schedule && <ScheduleLegend />}

          {/* Staff Search Modal */}
          {showStaffModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <button 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={() => setShowStaffModal(false)}
                aria-label="Close modal"
              />
              <div className="relative bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[70vh] overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Add Staff</h2>
                      {selectedCell && (
                        <p className="text-sm text-muted-foreground">
                          {selectedCell.day} at {selectedCell.time}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowStaffModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <Input
                    placeholder="Search staff by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredStaff.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No staff found
                      </p>
                    ) : (
                      filteredStaff.map(staff => (
                        <button
                          key={staff.id}
                          className="w-full p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                          onClick={() => addStaffToShift(staff)}
                        >
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-muted-foreground">{staff.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clear Schedule Confirmation Modal */}
          {showClearModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <button 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={() => setShowClearModal(false)}
                aria-label="Close modal"
              />
              <div className="relative bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h2 className="text-lg font-semibold">Confirm Clear Schedule</h2>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Are you sure you want to clear the entire schedule?
                  </p>
                  <p className="text-sm text-destructive font-medium">
                    This action cannot be undone.
                  </p>
                  
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setShowClearModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleClearSchedule}>
                      Clear Schedule
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </RequireRole>
  );
}