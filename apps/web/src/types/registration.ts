export interface AvailabilitySlot {
  day: number;        // 0=Monday, 1=Tuesday, etc.
  start_time: string; // "09:00:00"
  end_time: string;   // "10:00:00"
}

export interface Course {
  code: string;
  name: string;
}

export interface RegistrationFormData {
  student_id: string;        // Maps to 'username' in API
  name: string;              // Full name
  email: string;
  phone: string;             // Required in API v2
  degree: 'BSc' | 'MSc' | 'PhD';
  password: string;
  confirm_password: string;
  reason: string;            // Required
  terms: boolean;            // Must be true
  courses: string[];         // Array of course codes
  availability: AvailabilitySlot[]; // Array of availability slots
  profile_picture: File | null;     // Required file to be uploaded on submit
  transcript: File | null;          // Required file to be uploaded on submit
}

export interface RegistrationApiResponse {
  success: boolean;
  data?: {
    username: string;
  };
  message?: string;
  error?: string;
}