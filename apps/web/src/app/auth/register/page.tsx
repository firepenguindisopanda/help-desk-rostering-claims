"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { TranscriptUpload } from "@/components/transcript-upload";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { CourseSelection } from "@/components/course-selection";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { routes } from "@/lib/routes";
import { registrationSchema, registrationSchemaCore, registrationSchemaFields } from "@/lib/validation/registration-schema";
import { toast } from "sonner";
import { useRegisterAssistantWithProgressMutation } from "@/hooks/registration";
import type { RegistrationFormData } from "@/types/registration";
import { FormErrorSummary } from "@/components/FormErrorSummary";
import { uploadFilesSecurely } from "@/lib/secure-upload";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import type { ZodTypeAny } from "zod";

const REGISTRATION_DRAFT_STORAGE_KEY = "help-desk-registration-draft";
const STORAGE_SAVE_DELAY_MS = 400;
const FIELD_VALIDATION_DELAY_MS = 250;

const REGISTRATION_FIELD_SCHEMAS = registrationSchemaFields as Record<keyof RegistrationFormData, ZodTypeAny>;

const createInitialFormData = (): RegistrationFormData => ({
  student_id: "",
  name: "",
  email: "",
  phone: "",
  degree: "BSc",
  password: "",
  confirm_password: "",
  reason: "",
  terms: false,
  courses: [],
  availability: [],
  profile_picture: null,
  transcript: null,
});

const extractPersistableData = (data: RegistrationFormData) => ({
  student_id: data.student_id,
  name: data.name,
  email: data.email,
  phone: data.phone,
  degree: data.degree,
  reason: data.reason,
  terms: data.terms,
  courses: data.courses,
  availability: data.availability,
});

type RegistrationMutationResult = {
  success: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, unknown> | null;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationFormData>(() => createInitialFormData());
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);
  const formDataRef = useRef(formData);
  const validationTimers = useRef<Partial<Record<keyof RegistrationFormData, number>>>({});
  
  const router = useRouter();
  const { mutateAsync: registerAssistant, isPending: isSubmitting } = useRegisterAssistantWithProgressMutation();

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (typeof window === "undefined" || hasHydrated) return;
    const stored = window.localStorage.getItem(REGISTRATION_DRAFT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<RegistrationFormData>;
        setFormData(prev => {
          const next = {
            ...prev,
            ...parsed,
            courses: Array.isArray(parsed?.courses) ? parsed.courses : prev.courses,
            availability: Array.isArray(parsed?.availability) ? parsed.availability : prev.availability,
          };
          formDataRef.current = next;
          return next;
        });
      } catch (error) {
        console.warn("Failed to hydrate registration draft", error);
      }
    }
    setHasHydrated(true);
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    const timeoutId = window.setTimeout(() => {
      try {
        const payload = extractPersistableData(formDataRef.current);
        window.localStorage.setItem(REGISTRATION_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn("Failed to persist registration draft", error);
      }
    }, STORAGE_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [formData, hasHydrated]);

  useEffect(() => () => {
    if (typeof window === "undefined") return;
    Object.values(validationTimers.current).forEach(timer => {
      if (timer) {
        window.clearTimeout(timer);
      }
    });
  }, []);

  const runValidationForField = useCallback((field: keyof RegistrationFormData, data?: RegistrationFormData) => {
    const currentData = data ?? formDataRef.current;
    const schema = REGISTRATION_FIELD_SCHEMAS[field];
    let message: string | null = null;

    if (schema && typeof (schema as ZodTypeAny).safeParse === "function") {
      const result = (schema as ZodTypeAny).safeParse(currentData[field]);
      if (!result.success) {
        message = result.error.issues[0]?.message ?? "Invalid value";
      }
    }

    if (field === "confirm_password" && currentData.confirm_password) {
      if (currentData.password !== currentData.confirm_password) {
        message = "Passwords don't match";
      }
    }

    setErrors(prev => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });

    return !message;
  }, []);

  const scheduleFieldValidation = useCallback((field: keyof RegistrationFormData) => {
    if (typeof window === "undefined") return;
    const timers = validationTimers.current;
    const existing = timers[field];
    if (existing) {
      window.clearTimeout(existing);
    }
    timers[field] = window.setTimeout(() => {
      runValidationForField(field);
      delete timers[field];
    }, FIELD_VALIDATION_DELAY_MS);
  }, [runValidationForField]);

  const handleFieldBlur = useCallback((field: keyof RegistrationFormData) => {
    scheduleFieldValidation(field);
  }, [scheduleFieldValidation]);

  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => {
      const next = {
        ...prev,
        [field]: value,
      };
      formDataRef.current = next;
      return next;
    });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === "password" && formDataRef.current.confirm_password) {
      runValidationForField("confirm_password");
    }
  };

  /**
   * Runs zod validation and maps field errors.
   * Returns an object with success flag and ordered list of error entries
   * so we can provide richer user feedback.
   */
  const validateForm = useCallback((): { success: true } | { success: false; errorEntries: [string, string][] } => {
    const currentData = formDataRef.current;
    try {
      registrationSchema.parse(currentData);
      setErrors({});
      return { success: true };
    } catch (error: any) {
      const validationErrors: Record<string, string | string[]> = {};
      error.errors?.forEach((err: any) => {
        const rawPath = Array.isArray(err.path) && err.path.length ? err.path[0] : undefined;
        let path = typeof rawPath === "string" && rawPath.length > 0 ? rawPath : undefined;

        if (!path && typeof err.message === "string") {
          const lowerMessage = err.message.toLowerCase();
          if (lowerMessage.includes("profile picture")) {
            path = "profile_picture";
          } else if (lowerMessage.includes("transcript")) {
            path = "transcript";
          } else if (lowerMessage.includes("password") && lowerMessage.includes("match")) {
            path = "confirm_password";
          }
        }

        path = path ?? "form";

        const existing = validationErrors[path];
        if (!existing) {
          validationErrors[path] = err.message;
        } else if (Array.isArray(existing)) {
          validationErrors[path] = [...existing, err.message];
        } else if (existing !== err.message) {
          validationErrors[path] = [existing, err.message];
        }
      });
      setErrors(validationErrors);
      return {
        success: false,
        errorEntries: Object.entries(validationErrors).map(([field, detail]) => [
          field,
          Array.isArray(detail) ? detail.join(", ") : detail,
        ]) as [string, string][],
      };
    }
  }, []);

  const focusAndAnnounceErrors = useCallback((errorEntries: [string, string][]) => {
    if (errorEntries.length > 0) {
      const [firstField] = errorEntries[0];
      const el = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
      if (el) {
        setTimeout(() => {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 10);
      }
    }

    const maxShown = 3;
    const summaryList = errorEntries.slice(0, maxShown).map(([field, msg]) => `${field}: ${msg}`);
    const moreCount = Math.max(0, errorEntries.length - maxShown);
    toast.error(
      errorEntries.length === 1
        ? `Fix the highlighted field: ${summaryList[0]}`
        : `Found ${errorEntries.length} issues. ` +
          summaryList.join(" | ") +
          (moreCount > 0 ? ` | +${moreCount} more` : "")
    );
  }, []);

  const uploadAssetsWithProgress = useCallback(async () => {
    setUploadProgress(10);
    const uploadResult = await uploadFilesSecurely(
      formDataRef.current.profile_picture,
      formDataRef.current.transcript,
      (progress) => {
        setUploadProgress(10 + progress * 0.5);
      }
    );

    if (!uploadResult.success) {
      toast.error(`File upload failed: ${uploadResult.error}`);
      setUploadProgress(0);
      return null;
    }

    setUploadProgress(70);
    return uploadResult;
  }, []);

  const buildRegistrationPayload = useCallback((uploadResult: { profilePictureUrl?: string | null; transcriptUrl?: string | null }) => {
    const currentData = formDataRef.current;
    return {
      student_id: currentData.student_id,
      name: currentData.name,
      email: currentData.email,
      phone: currentData.phone,
      degree: currentData.degree,
      password: currentData.password,
      confirm_password: currentData.confirm_password,
      reason: currentData.reason,
      terms: currentData.terms,
      courses: currentData.courses,
      availability: currentData.availability,
      profile_picture_url: uploadResult.profilePictureUrl || "",
      transcript_url: uploadResult.transcriptUrl || "",
    };
  }, []);

  const handleRegistrationOutcome = useCallback((result: RegistrationMutationResult) => {
    if (result.success) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
      }
      const resetData = createInitialFormData();
      setFormData(resetData);
      formDataRef.current = resetData;
      toast.success(result.message || "Registration successful!");
      router.push('/auth/login?message=registration-pending');
      return;
    }

    if (result.errors && typeof result.errors === "object") {
      const mapped: Record<string, string | string[]> = {};
      for (const [k, v] of Object.entries(result.errors)) {
        mapped[k] = Array.isArray(v) ? v : String(v);
      }
      setErrors(mapped);
    }

    toast.error(result.error || "Registration failed");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = validateForm();
    if (validationResult.success === false) {
      focusAndAnnounceErrors(validationResult.errorEntries);
      return;
    }

    try {
      const uploadResult = await uploadAssetsWithProgress();
      if (!uploadResult) {
        return;
      }

      const registrationData = buildRegistrationPayload(uploadResult);

      setUploadProgress(80);
      const result = await registerAssistant({
        registrationData,
        onUploadProgress: (progressEvent) => {
          setUploadProgress(80 + ((progressEvent.progress || 0) * 0.2));
        }
      });

      handleRegistrationOutcome(result);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("An unexpected error occurred");
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            Help Desk Assistant Registration
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            Join our team of student assistants
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <FormErrorSummary errors={errors} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-3 mb-6">
                Personal Information
              </h2>
              
              <ProfilePictureUpload
                onFileChange={(file) => handleInputChange("profile_picture", file)}
                error={Array.isArray(errors.profile_picture) ? errors.profile_picture.join(", ") : errors.profile_picture}
                disabled={isSubmitting}
                onBlur={() => handleFieldBlur("profile_picture")}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id" className="text-base font-medium">Student ID *</Label>
                  <Input
                    id="student_id"
                    name="student_id"
                    type="text"
                    placeholder="Enter your student ID"
                    className="text-base py-3"
                    value={formData.student_id}
                    onChange={(e) => handleInputChange("student_id", e.target.value)}
                    onBlur={() => handleFieldBlur("student_id")}
                    disabled={isSubmitting}
                  />
                  {errors.student_id && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.student_id}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="degree" className="text-base font-medium">Degree *</Label>
                  <Select
                    value={formData.degree}
                    onValueChange={(value) =>
                      handleInputChange("degree", value as "BSc" | "MSc" | "PhD")
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="degree"
                      className="text-base py-3"
                      onBlur={() => handleFieldBlur("degree")}
                    >
                      <SelectValue placeholder="Select your degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BSc">Bachelor of Science (BSc)</SelectItem>
                      <SelectItem value="MSc">Master of Science (MSc)</SelectItem>
                      <SelectItem value="PhD">Doctor of Philosophy (PhD)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.degree && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.degree}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">Full Name *</Label>
                  <Input
                  id="name"
                    name="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="text-base py-3"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => handleFieldBlur("password")}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {formData.password && (
                  <PasswordStrengthMeter password={formData.password} className="mt-2" />
                )}
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                    onBlur={() => handleFieldBlur("confirm_password")}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.confirm_password}</p>
                )}
              </div>
            </div>
            
            {/* Right Column - Courses & Availability */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-3 mb-6">
                Courses & Availability
              </h2>
              
              <CourseSelection
                selectedCourses={formData.courses}
                onCoursesChange={(courses) => handleInputChange('courses', courses)}
                error={Array.isArray(errors.courses) ? errors.courses.join(', ') : errors.courses}
              />
              
              <AvailabilityCalendar
                selectedSlots={formData.availability}
                onSlotsChange={(slots) => handleInputChange('availability', slots)}
                error={Array.isArray(errors.availability) ? errors.availability.join(', ') : errors.availability}
              />
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="space-y-6 border-t pt-6">
            <TranscriptUpload
              onFileChange={(file) => handleInputChange('transcript', file)}
              error={Array.isArray(errors.transcript) ? errors.transcript.join(', ') : errors.transcript}
              disabled={isSubmitting}
              onBlur={() => handleFieldBlur('transcript')}
            />
            
            <div className="space-y-2">
              <Label htmlFor="reason">Why do you want to join the Help Desk? *</Label>
              <Textarea
                id="reason"
                placeholder="Tell us why you're interested in joining the help desk team..."
                rows={4}
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                onBlur={() => handleFieldBlur("reason")}
                disabled={isSubmitting}
              />
              {errors.reason && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
              )}
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={formData.terms}
                onCheckedChange={(checked) => handleInputChange("terms", checked === true)}
                onBlur={() => handleFieldBlur("terms")}
                disabled={isSubmitting}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I confirm that I have completed the courses I've selected, and that all 
                information provided is accurate. I understand that my application will 
                be reviewed by an administrator. *
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.terms}</p>
            )}
            
            <Button type="submit" className="w-full text-lg py-4" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-b-transparent" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Submit Application
                </>
              )}
            </Button>
            
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>
        </form>
        
        <div className="mt-8 text-center text-base text-muted-foreground">
          Already have an account?{" "}
          <Link 
            href={routes.auth.login} 
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
