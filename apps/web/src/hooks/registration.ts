"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiV2 } from "@/lib/api";
import type { Course } from "@/types/registration";

const coursesArrayFallback: Course[] = [
  {
    "code": "COMP1011",
    "name": "Introduction to Computer Science"
  },
  {
    "code": "COMP1600",
    "name": "Introduction to Computing Concepts"
  },
  {
    "code": "COMP1601",
    "name": "Computer Programming I"
  },
  {
    "code": "COMP1602",
    "name": "Computer Programming II"
  },
  {
    "code": "COMP1603",
    "name": "Computer Programming III"
  },
  {
    "code": "COMP1604",
    "name": "Data Structures and Algorithms"
  },
  {
    "code": "COMP2601",
    "name": "Computer Architecture"
  },
  {
    "code": "COMP2602",
    "name": "Computer Networks"
  },
  {
    "code": "COMP2603",
    "name": "Object-Oriented Programming I"
  },
  {
    "code": "COMP2604",
    "name": "Operating Systems"
  },
  {
    "code": "COMP2605",
    "name": "Enterprise Database Systems"
  },
  {
    "code": "COMP2606",
    "name": "Software Engineering I"
  },
  {
    "code": "COMP2611",
    "name": "Data Structures"
  },
  {
    "code": "COMP3601",
    "name": "Design and Analysis of Algorithms"
  },
  {
    "code": "COMP3602",
    "name": "Software Engineering II"
  },
  {
    "code": "COMP3603",
    "name": "Human-Computer Interaction"
  },
  {
    "code": "COMP3605",
    "name": "Introduction to Data Analytics"
  },
  {
    "code": "COMP3606",
    "name": "Wireless and Mobile Computing"
  },
  {
    "code": "COMP3607",
    "name": "Object-Oriented Programming II"
  },
  {
    "code": "COMP3608",
    "name": "Intelligent Systems"
  },
  {
    "code": "COMP3609",
    "name": "Game Programming"
  },
  {
    "code": "COMP3610",
    "name": "Big Data Analytics"
  },
  {
    "code": "COMP3613",
    "name": "Software Engineering II"
  },
  {
    "code": "INFO1600",
    "name": "Introduction to Information Technology"
  },
  {
    "code": "INFO1601",
    "name": "Introduction to Web Development"
  },
  {
    "code": "INFO2600",
    "name": "Information Systems Development"
  },
  {
    "code": "INFO2601",
    "name": "Networking Technologies Fundamentals"
  },
  {
    "code": "INFO2602",
    "name": "Web Programming and Technologies I"
  },
  {
    "code": "INFO2603",
    "name": "Platform Technologies I"
  },
  {
    "code": "INFO2604",
    "name": "Information Systems Security"
  },
  {
    "code": "INFO2605",
    "name": "Professional Ethics and Law"
  },
  {
    "code": "INFO3600",
    "name": "Business Information Systems"
  },
  {
    "code": "INFO3601",
    "name": "Platform Technologies II"
  },
  {
    "code": "INFO3602",
    "name": "Web Programming and Technologies II"
  },
  {
    "code": "INFO3604",
    "name": "Project"
  },
  {
    "code": "INFO3605",
    "name": "Fundamentals of LAN Technologies"
  },
  {
    "code": "INFO3606",
    "name": "Cloud Computing"
  },
  {
    "code": "INFO3607",
    "name": "Fundamentals of WAN Technologies"
  },
  {
    "code": "INFO3608",
    "name": "E-Commerce"
  },
  {
    "code": "INFO3609",
    "name": "Internship I"
  },
  {
    "code": "INFO3610",
    "name": "Internship II"
  },
  {
    "code": "INFO3611",
    "name": "Database Administration"
  }
];

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
      return coursesArrayFallback;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1, // Only retry once if it fails
  });
}

export function useRegisterAssistantMutation() {
  return useMutation({
    mutationKey: ["register-assistant"],
    mutationFn: (registrationData: any) => ApiV2.registerAssistant(registrationData),
  });
}

export function useRegisterAssistantWithProgressMutation() {
  return useMutation({
    mutationKey: ["register-assistant-progress"],
    mutationFn: ({ 
      registrationData, 
      onUploadProgress 
    }: { 
      registrationData: any; 
      onUploadProgress?: (progressEvent: { loaded: number; total?: number; progress?: number }) => void 
    }) => ApiV2.registerAssistantWithProgress(registrationData, onUploadProgress),
  });
}