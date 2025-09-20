"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiV2 } from "@/lib/api";
import type { Course } from "@/types/registration";

export function useCoursesQuery() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<Course[]> => {
      const res = await ApiV2.getCourses();
      if (res?.success === false) {
        throw new Error(res.error || "Failed to load courses");
      }
      
      // Return the courses data, with fallback if API fails
      if (res?.data && Array.isArray(res.data)) {
        return res.data;
      }
      
      // Fallback courses if API doesn't return proper data
      return [
        { code: "CS101", name: "Introduction to Computer Science" },
        { code: "CS201", name: "Data Structures and Algorithms" },
        { code: "CS301", name: "Database Systems" },
        { code: "CS302", name: "Web Development" },
        { code: "CS401", name: "Software Engineering" },
        { code: "MATH101", name: "Calculus I" },
        { code: "MATH201", name: "Statistics" },
        { code: "PHYS101", name: "Physics I" },
        { code: "ENG101", name: "Technical Writing" },
        { code: "BUS101", name: "Business Fundamentals" }
      ];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1, // Only retry once if it fails
  });
}

export function useRegisterAssistantMutation() {
  return useMutation({
    mutationKey: ["register-assistant"],
    mutationFn: (form: FormData) => ApiV2.registerAssistant(form),
  });
}

export function useRegisterAssistantWithProgressMutation() {
  return useMutation({
    mutationKey: ["register-assistant-progress"],
    mutationFn: ({ 
      formData, 
      onUploadProgress 
    }: { 
      formData: FormData; 
      onUploadProgress?: (progressEvent: { loaded: number; total?: number; progress?: number }) => void 
    }) => ApiV2.registerAssistantWithProgress(formData, onUploadProgress),
  });
}