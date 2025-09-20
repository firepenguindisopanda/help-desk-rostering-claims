import type { Route } from "next";

export const routes = {
  root: "/" as Route,
  unauthorized: "/unauthorized" as Route,
  auth: {
    login: "/auth/login" as Route,
    register: "/auth/register" as Route,
  },
  admin: {
    index: "/admin" as Route,
    schedule: "/admin/schedule" as Route,
    users: "/admin/users" as Route,
    assistants: "/admin/assistants" as Route,
    settings: "/admin/settings" as Route,
    profile: "/admin/profile" as Route,
  },
  student: {
    index: "/student" as Route,
    schedule: "/student/schedule" as Route,
    profile: "/student/profile" as Route,
  },
  // Legacy assist routes for backward compatibility
  assist: {
    index: "/assist" as Route,
    tickets: "/assist/tickets" as Route,
    profile: "/assist/profile" as Route,
  },
} as const;

export type AppRoute = typeof routes[keyof typeof routes];

// Helpers: route group checks
export function isAdminRoute(pathname: string): boolean {
  return pathname === routes.admin.index || pathname.startsWith("/admin/");
}

export function isAssistRoute(pathname: string): boolean {
  return pathname === routes.assist.index || pathname.startsWith("/assist/");
}

export function isStudentRoute(pathname: string): boolean {
  return pathname === routes.student.index || pathname.startsWith("/student/");
}

// Very small route builder for future dynamic segments
// Example: route("/admin/users/[id]", { id: "123" }) => "/admin/users/123"
export function route<T extends string>(pattern: T, params?: Record<string, string | number>): string {
  if (!params) return pattern;
  return Object.keys(params).reduce((acc, key) => {
    return acc.replace(new RegExp(`\\[${key}\\]`, "g"), String(params[key]));
  }, pattern);
}