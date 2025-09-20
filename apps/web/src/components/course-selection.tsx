"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCoursesQuery } from "@/hooks/registration";

interface CourseSelectionProps {
  readonly selectedCourses: string[];
  readonly onCoursesChange: (courses: string[]) => void;
  readonly error?: string;
}

export function CourseSelection({ selectedCourses, onCoursesChange, error }: CourseSelectionProps) {
  const { data: courses = [], isLoading, isError } = useCoursesQuery();
  
  const handleCourseToggle = (courseCode: string) => {
    if (selectedCourses.includes(courseCode)) {
      onCoursesChange(selectedCourses.filter(code => code !== courseCode));
    } else {
      onCoursesChange([...selectedCourses, courseCode]);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label>Courses Completed (Select all that apply) *</Label>
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading courses...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Label>Courses Completed (Select all that apply) *</Label>
      {isError && (
        <p className="text-sm text-orange-600 dark:text-orange-400">
          Failed to load courses - Using default course list
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        {courses.map(course => (
          <div key={course.code} className="flex items-center space-x-3">
            <Checkbox
              id={course.code}
              checked={selectedCourses.includes(course.code)}
              onCheckedChange={() => handleCourseToggle(course.code)}
            />
            <Label 
              htmlFor={course.code} 
              className="text-sm cursor-pointer flex-1"
            >
              <span className="font-medium">{course.code}</span> - {course.name}
            </Label>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {selectedCourses.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selected {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}