import { z } from 'zod';

// Base validation schemas
export const dateStringSchema = z
  .string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && parsedDate >= new Date('2020-01-01');
  }, 'Please provide a valid date');

export const timeStringSchema = z
  .string()
  .min(1, 'Time is required')
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24-hour)');

export const staffIdSchema = z
  .string()
  .min(1, 'Staff ID is required')
  .max(50, 'Staff ID is too long');

export const scheduleTypeSchema = z.enum(['helpdesk', 'lab'], {
  message: 'Schedule type must be either helpdesk or lab',
});

// Staff validation schema
export const staffSchema = z.object({
  id: staffIdSchema,
  name: z
    .string()
    .min(1, 'Staff name is required')
    .max(100, 'Staff name is too long'),
  type: z.enum(['student', 'admin']).optional(),
  email: z
    .string()
    .email('Please provide a valid email address')
    .optional()
    .or(z.literal('')),
});

// Schedule generation form schema
export const generateScheduleSchema = z
  .object({
    start_date: dateStringSchema,
    end_date: dateStringSchema,
    schedule_type: scheduleTypeSchema.default('helpdesk'),
    constraints: z
      .object({
        min_staff_per_shift: z
          .number()
          .int('Must be a whole number')
          .min(0, 'Minimum staff cannot be negative')
          .max(10, 'Minimum staff cannot exceed 10'),
        max_staff_per_shift: z
          .number()
          .int('Must be a whole number')
          .min(1, 'Maximum staff must be at least 1')
          .max(20, 'Maximum staff cannot exceed 20'),
        preferred_staff_per_shift: z
          .number()
          .int('Must be a whole number')
          .min(1, 'Preferred staff must be at least 1')
          .max(15, 'Preferred staff cannot exceed 15'),
        break_duration_minutes: z
          .number()
          .int('Must be a whole number')
          .min(0, 'Break duration cannot be negative')
          .max(120, 'Break duration cannot exceed 2 hours')
          .optional(),
        max_consecutive_hours: z
          .number()
          .int('Must be a whole number')
          .min(1, 'Must allow at least 1 consecutive hour')
          .max(12, 'Cannot exceed 12 consecutive hours')
          .optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate >= startDate;
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 365; // Max 1 year
    },
    {
      message: 'Schedule period cannot exceed 1 year',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.constraints) {
        return data.constraints.max_staff_per_shift >= data.constraints.min_staff_per_shift;
      }
      return true;
    },
    {
      message: 'Maximum staff must be greater than or equal to minimum staff',
      path: ['constraints', 'max_staff_per_shift'],
    }
  );

// Schedule assignment schema
export const scheduleAssignmentSchema = z.object({
  day: z
    .string()
    .min(1, 'Day is required')
    .refine(
      (day) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day),
      'Invalid day of week'
    ),
  time: timeStringSchema,
  cell_id: z.string().min(1, 'Cell ID is required'),
  staff: z
    .array(staffSchema)
    .min(0, 'Staff list cannot be negative')
    .max(10, 'Cannot assign more than 10 staff to a single shift'),
});

// Save schedule form schema
export const saveScheduleSchema = z.object({
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  schedule_type: scheduleTypeSchema,
  assignments: z
    .array(scheduleAssignmentSchema)
    .min(1, 'At least one assignment is required'),
  save_options: z
    .object({
      overwrite_existing: z.boolean().default(false),
      notify_staff: z.boolean().default(true),
      publish_immediately: z.boolean().default(false),
      backup_previous: z.boolean().default(true),
    })
    .optional(),
});

// Clear schedule form schema
export const clearScheduleSchema = z.object({
  schedule_type: scheduleTypeSchema,
  schedule_id: z
    .number()
    .int('Schedule ID must be a whole number')
    .positive('Schedule ID must be positive'),
  confirm: z
    .boolean()
    .refine((val) => val === true, 'You must confirm the clear operation'),
  backup_before_clear: z.boolean().default(true),
});

// Staff search and filter schema
export const staffSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query is too long')
    .optional(),
  day: z
    .string()
    .optional()
    .refine(
      (day) => !day || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day),
      'Invalid day of week'
    ),
  time: timeStringSchema.optional(),
  availability_only: z.boolean().default(true),
  staff_type: z.enum(['student', 'admin', 'all']).default('all'),
});

// Batch availability check schema
export const batchAvailabilitySchema = z.object({
  queries: z
    .array(
      z.object({
        staff_id: staffIdSchema,
        day: z.string().min(1, 'Day is required'),
        time: timeStringSchema,
      })
    )
    .min(1, 'At least one availability query is required')
    .max(100, 'Cannot check more than 100 availability queries at once'),
});

// Export schedule options schema
export const exportScheduleSchema = z.object({
  format: z.enum(['pdf', 'csv', 'excel']).default('pdf'),
  include_staff_details: z.boolean().default(true),
  include_statistics: z.boolean().default(true),
  date_range: z
    .object({
      start_date: dateStringSchema,
      end_date: dateStringSchema,
    })
    .optional(),
  template: z.enum(['standard', 'minimal', 'detailed']).default('standard'),
});

// Schedule settings schema
export const scheduleSettingsSchema = z.object({
  default_schedule_type: scheduleTypeSchema.default('helpdesk'),
  default_shift_duration: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Shift duration must be at least 30 minutes')
    .max(480, 'Shift duration cannot exceed 8 hours')
    .default(60),
  working_days: z
    .array(
      z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    )
    .min(1, 'At least one working day must be selected')
    .default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  working_hours: z.object({
    start_time: timeStringSchema.default('09:00'),
    end_time: timeStringSchema.default('17:00'),
  }),
  notification_settings: z
    .object({
      email_notifications: z.boolean().default(true),
      advance_notice_days: z
        .number()
        .int('Must be a whole number')
        .min(1, 'Advance notice must be at least 1 day')
        .max(30, 'Advance notice cannot exceed 30 days')
        .default(7),
      reminder_frequency: z.enum(['daily', 'weekly', 'none']).default('weekly'),
    })
    .optional(),
});

// Type exports for TypeScript integration
export type GenerateScheduleFormData = z.infer<typeof generateScheduleSchema>;
export type SimpleGenerateScheduleFormData = z.infer<typeof simpleGenerateScheduleSchema>;
export type SaveScheduleFormData = z.infer<typeof saveScheduleSchema>;
export type ClearScheduleFormData = z.infer<typeof clearScheduleSchema>;
export type StaffSearchFormData = z.infer<typeof staffSearchSchema>;
export type BatchAvailabilityFormData = z.infer<typeof batchAvailabilitySchema>;
export type ExportScheduleFormData = z.infer<typeof exportScheduleSchema>;
export type ScheduleSettingsFormData = z.infer<typeof scheduleSettingsSchema>;
export type StaffFormData = z.infer<typeof staffSchema>;
export type ScheduleAssignmentFormData = z.infer<typeof scheduleAssignmentSchema>;

// Form field validation helpers
export const validateScheduleDateRange = (startDate: string, endDate: string) => {
  try {
    const result = generateScheduleSchema.pick({ start_date: true, end_date: true }).parse({
      start_date: startDate,
      end_date: endDate,
    });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: { general: ['Validation failed'] } };
  }
};

export const validateStaffAssignment = (assignment: unknown) => {
  try {
    const result = scheduleAssignmentSchema.parse(assignment);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, errors: { general: ['Validation failed'] } };
  }
};

// Simple schedule generation schema (only start_date and end_date)
export const simpleGenerateScheduleSchema = z
  .object({
    start_date: dateStringSchema,
    end_date: dateStringSchema,
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate >= startDate;
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 365; // Max 1 year
    },
    {
      message: 'Schedule period cannot exceed 1 year',
      path: ['end_date'],
    }
  );

// Default form values
export const defaultGenerateScheduleValues: Partial<GenerateScheduleFormData> = {
  schedule_type: 'helpdesk',
  constraints: {
    min_staff_per_shift: 1,
    max_staff_per_shift: 3,
    preferred_staff_per_shift: 2,
  },
};

export const defaultSimpleGenerateScheduleValues: Partial<SimpleGenerateScheduleFormData> = {
  start_date: '',
  end_date: '',
};

export const defaultScheduleSettingsValues: ScheduleSettingsFormData = {
  default_schedule_type: 'helpdesk',
  default_shift_duration: 60,
  working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  working_hours: {
    start_time: '09:00',
    end_time: '17:00',
  },
  notification_settings: {
    email_notifications: true,
    advance_notice_days: 7,
    reminder_frequency: 'weekly',
  },
};

export const defaultStaffSearchValues: StaffSearchFormData = {
  query: '',
  availability_only: true,
  staff_type: 'all',
};