"use client";

import React from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, Settings, AlertTriangle } from "lucide-react";
import { 
  generateScheduleSchema, 
  type GenerateScheduleFormData,
  defaultGenerateScheduleValues 
} from "@/lib/validation/scheduleSchemas";

interface ScheduleGenerationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenerateScheduleFormData) => Promise<void>;
  initialData?: Partial<GenerateScheduleFormData>;
  isSubmitting?: boolean;
}

export function ScheduleGenerationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: Readonly<ScheduleGenerationFormProps>) {
  const form = useForm({
    defaultValues: {
      ...defaultGenerateScheduleValues,
      ...initialData,
    } as GenerateScheduleFormData,
    onSubmit: async ({ value }) => {
      // Validate with Zod before submitting
      try {
        const validatedData = generateScheduleSchema.parse(value);
        await onSubmit(validatedData);
        onClose();
      } catch (error) {
        console.error('Form validation error:', error);
        // Handle validation errors appropriately
      }
    },
  });

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate default end date (1 week from start date)
  const getDefaultEndDate = (startDate: string) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + 6); // 1 week duration
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate Schedule with Advanced Options
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="start_date">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Start Date *</Label>
                      <DatePicker
                        id={field.name}
                        value={field.state.value || ''}
                        min={today}
                        onChange={(val) => {
                          field.handleChange(val);
                          const endDateField = form.getFieldValue('end_date');
                          if (!endDateField && val) {
                            form.setFieldValue('end_date', getDefaultEndDate(val));
                          }
                        }}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="end_date">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>End Date *</Label>
                      <DatePicker
                        id={field.name}
                        value={field.state.value || ''}
                        min={form.getFieldValue('start_date') || today}
                        onChange={(val) => field.handleChange(val)}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Schedule Type */}
              <form.Field name="schedule_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Schedule Type *</Label>
                    <Select
                      value={field.state.value || 'helpdesk'}
                      onValueChange={(value) => field.handleChange(value as 'helpdesk' | 'lab')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="helpdesk">Help Desk</SelectItem>
                        <SelectItem value="lab">Computer Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Advanced Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Staffing Constraints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <form.Field name="constraints.min_staff_per_shift">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Minimum Staff</Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
                        max={10}
                        value={field.state.value || 1}
                        onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="constraints.preferred_staff_per_shift">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Preferred Staff</Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        max={15}
                        value={field.state.value || 2}
                        onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 1)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="constraints.max_staff_per_shift">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Maximum Staff</Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        max={20}
                        value={field.state.value || 3}
                        onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 1)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="constraints.break_duration_minutes">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Break Duration (minutes)</Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
                        max={120}
                        step={15}
                        value={field.state.value || 30}
                        onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="constraints.max_consecutive_hours">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Max Consecutive Hours</Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        max={12}
                        value={field.state.value || 4}
                        onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 1)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  These constraints will be used to automatically generate an optimized schedule. 
                  The system will attempt to balance staff workload while meeting minimum requirements.
                </p>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isFormSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isFormSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSubmitting || isFormSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    'Generate Schedule'
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}