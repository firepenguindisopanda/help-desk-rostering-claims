"use client";

import { useState } from "react";
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
import { registrationSchema } from "@/lib/validation/registration-schema";
import { toast } from "sonner";
import { useRegisterAssistantWithProgressMutation } from "@/hooks/registration";
import type { RegistrationFormData } from "@/types/registration";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationFormData>({
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const router = useRouter();
  const { mutateAsync: registerAssistant, isPending: isSubmitting } = useRegisterAssistantWithProgressMutation();

  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    try {
      registrationSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const validationErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        const path = err.path[0];
        if (path) {
          validationErrors[path] = err.message;
        }
      });
      setErrors(validationErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('student_id', formData.student_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('degree', formData.degree);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('confirm_password', formData.confirm_password);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('terms', formData.terms.toString());
      
      // Add courses array
      formData.courses.forEach(course => {
        formDataToSend.append('courses[]', course);
      });
      
      // Add availability as JSON string
      formDataToSend.append('availability', JSON.stringify(formData.availability));
      
      // Add files
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }
      if (formData.transcript) {
        formDataToSend.append('transcript', formData.transcript);
      }
      
      const result = await registerAssistant({
        formData: formDataToSend,
        onUploadProgress: (progressEvent) => {
          setUploadProgress(progressEvent.progress || 0);
        }
      });
      
      if (result.success) {
        toast.success(result.message || "Registration successful!");
        router.push('/auth/login?message=registration-pending');
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("An unexpected error occurred");
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-3 mb-6">
                Personal Information
              </h2>
              
              <ProfilePictureUpload 
                onFileSelect={(file) => handleInputChange('profile_picture', file)}
                error={errors.profile_picture}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id" className="text-base font-medium">Student ID *</Label>
                  <Input
                    id="student_id"
                    type="text"
                    placeholder="Enter your student ID"
                    className="text-base py-3"
                    value={formData.student_id}
                    onChange={(e) => handleInputChange("student_id", e.target.value)}
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
                    <SelectTrigger id="degree" className="text-base py-3">
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
                  type="text"
                  placeholder="Enter your full name"
                  className="text-base py-3"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
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
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange("confirm_password", e.target.value)}
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
                error={errors.courses}
              />
              
              <AvailabilityCalendar
                selectedSlots={formData.availability}
                onSlotsChange={(slots) => handleInputChange('availability', slots)}
                error={errors.availability}
              />
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="space-y-6 border-t pt-6">
            <TranscriptUpload
              onFileSelect={(file) => handleInputChange('transcript', file)}
              error={errors.transcript}
            />
            
            <div className="space-y-2">
              <Label htmlFor="reason">Why do you want to join the Help Desk? *</Label>
              <Textarea
                id="reason"
                placeholder="Tell us why you're interested in joining the help desk team..."
                rows={4}
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
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
