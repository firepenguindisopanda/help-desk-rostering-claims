import { z } from 'zod';

const availabilitySlotSchema = z.object({
  day: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format"),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format")
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export const registrationSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").refine((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, "Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  degree: z.enum(["BSc", "MSc", "PhD"], {
    message: "Please select a degree"
  }),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/\d/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirm_password: z.string(),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
  terms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  courses: z.array(z.string()).min(1, "Select at least one course"),
  availability: z.array(availabilitySlotSchema).min(1, "Select at least one availability slot"),
  profile_picture: z.custom<File>((file) => {
    if (!file || !(file instanceof File)) return false;
    if (file.size > MAX_FILE_SIZE) return false;
    return ACCEPTED_IMAGE_TYPES.includes(file.type);
  }, {
    message: "Profile picture is required (max 5MB, JPEG/PNG/WebP only)"
  }),
  transcript: z.custom<File>((file) => {
    if (!file || !(file instanceof File)) return false;
    if (file.size > MAX_FILE_SIZE) return false;
    return ACCEPTED_DOCUMENT_TYPES.includes(file.type);
  }, {
    message: "Transcript is required (max 5MB, PDF/DOC/DOCX only)"
  })
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;