"use client";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v2").replace(/\/$/, "");
const COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "access_token"; // Changed to match backend expectation

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const key = part.substring(0, eqIndex);
    const val = part.substring(eqIndex + 1);
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getToken(): string | null {
  // Prefer access_token, but also check legacy name auth_token
  return getCookie('access_token') || getCookie(COOKIE_NAME) || getCookie('auth_token');
}

export function storeToken(token: string) {
  setCookie(COOKIE_NAME, token);
  // Also set the access_token cookie that the backend expects
  setCookie("access_token", token);
}

export function clearToken() {
  deleteCookie(COOKIE_NAME);
  // Also clear the access_token cookie
  deleteCookie("access_token");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<Response> {
  let url = path;
  if (!path.startsWith("http")) {
    const suffix = path.startsWith("/") ? path : `/${path}`;
    url = `${API_BASE_URL}${suffix}`;
  }
  const token = getToken();

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Only set JSON content-type when sending JSON body, not FormData
    ...(!isFormData && init.body ? { "Content-Type": "application/json" } : {}),
  };

  return fetch(url, {
    ...init,
    headers,
    credentials: "include", // Changed from "omit" to include cookies
  });
}

// Extended error response type for login
export type LoginError = {
  code?: 'INVALID_CREDENTIALS' | 'REG_PENDING' | 'REG_REJECTED' | 'REG_APPROVED_NOT_PROVISIONED';
  requested_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export type LoginResponse = {
  success: boolean;
  token?: string;
  error?: string;
  user?: any;
  errorCode?: LoginError['code'];
  errorDetails?: LoginError;
};

// Enhanced login with registration state handling
export async function loginV2(username: string, password: string): Promise<LoginResponse> {
  try {
    const res = await apiFetch<ApiResponse<{ token: string; user: any }>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const data: any = await res.json().catch(() => ({}));
    
    if (!res.ok || data.success === false) {
      const message = data?.message || "Login failed";
      const errorCode = data?.errors?.code as LoginError['code'];
      const errorDetails: LoginError = {
        code: errorCode,
        requested_at: data?.errors?.requested_at,
        reviewed_at: data?.errors?.reviewed_at,
        reviewed_by: data?.errors?.reviewed_by,
      };
      
      return { 
        success: false, 
        error: message, 
        errorCode,
        errorDetails 
      };
    }
    
    const token = data?.token || data?.data?.token;
    const user = data?.user || data?.data?.user;
    if (token) storeToken(token);
    return { success: true, token, user };
  } catch {
    return { success: false, error: "Network error" };
  }
}

// Legacy login function for backward compatibility
export async function login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string; user?: any }> {
  try {
    const res = await apiFetch<ApiResponse<{ token: string }>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const message = data?.message || "Login failed";
      return { success: false, error: message };
    }
    const token = data?.token || data?.data?.token;
    const user = data?.user || data?.data?.user;
    if (token) storeToken(token);
    return { success: true, token, user };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; token?: string }>{
  try {
    const res = await apiFetch<ApiResponse<unknown>>( "/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const message = data?.message || "Registration failed";
      return { success: false, error: message };
    }
    // Some APIs return token on register
    const token = data?.token || data?.data?.token;
    if (token) storeToken(token);
    return { success: true, token };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {}
  finally {
    clearToken();
    // Best-effort clearing of legacy cookie as well
    deleteCookie('auth_token');
  }
}

export type Me = {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string | null;
  is_admin?: boolean;
};

export async function getMe(): Promise<{ success: boolean; user?: Me; error?: string }> {
  try {
    const res = await apiFetch<ApiResponse<Me | { user?: Me }>>("/me", { method: "GET" });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { success: false, error: data?.message || "Failed to load profile" };
    }
    // Normalize common shapes: { data: { user } } | { data } | plain object
    let user: any = undefined;
    if (data?.data?.user) user = data.data.user;
    else if (data?.user) user = data.user;
    else if (data?.data) user = data.data;
    else user = data;
    return { success: true, user };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateMe(payload: Partial<Pick<Me, "name">>): Promise<{ success: boolean; error?: string }>{
  try {
    const res = await apiFetch<ApiResponse<Me>>("/me", { method: "PUT", body: JSON.stringify(payload) });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { success: false, error: data?.message || "Update failed" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

// Admin endpoints
export async function getAdminDashboard() {
  const res = await apiFetch<ApiResponse<any>>("/admin/dashboard");
  return res.json().catch(() => ({}));
}

export async function getAdminStats() {
  const res = await apiFetch<ApiResponse<any>>("/admin/stats");
  return res.json().catch(() => ({}));
}

// Student endpoints (assistant in UI)
export async function getStudentDashboard() {
  const res = await apiFetch<ApiResponse<any>>("/student/dashboard");
  return res.json().catch(() => ({}));
}

export async function getStudentSchedule(params: { from: string; to: string }) {
  const query = new URLSearchParams(params as any).toString();
  const res = await apiFetch<ApiResponse<any>>(`/student/schedule?${query}`);
  return res.json().catch(() => ({}));
}

// Courses API
export async function getCourses() {
  const res = await apiFetch<ApiResponse<any>>("/courses");
  return res.json().catch(() => ({}));
}

// Updated register function to support FormData
export async function registerAssistant(formData: FormData): Promise<{ success: boolean; error?: string; message?: string; errors?: Record<string, unknown> }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      body: formData,
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      credentials: "include",
    });
    
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const message = data?.error || data?.message || "Registration failed";
      return { success: false, error: message, errors: data?.errors };
    }
    
    return { 
      success: true, 
      message: data?.message || "Registration successful! Your account will be activated once approved by an administrator."
    };
  } catch {
    return { success: false, error: "Network error" };
  }
}

// Axios-based upload with progress tracking
import axios from 'axios';

export async function registerAssistantWithProgress(
  formData: FormData, 
  onUploadProgress?: (progressEvent: { loaded: number; total?: number; progress?: number }) => void
): Promise<{ success: boolean; error?: string; message?: string; errors?: Record<string, unknown> }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            progress
          });
        }
      },
    });
    
    const data = response.data;
    if (response.status >= 400 || data.success === false) {
      const message = data?.error || data?.message || "Registration failed";
      return { success: false, error: message, errors: data?.errors };
    }
    
    return { 
      success: true, 
      message: data?.message || "Registration successful! Your account will be activated once approved by an administrator."
    };
  } catch (error: any) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || "Network error";
    const errors = error.response?.data?.errors;
    return { success: false, error: message, errors };
  }
}

export const ApiV2 = {
  apiFetch,
  getToken,
  storeToken,
  clearToken,
  login,
  loginV2,
  register,
  registerAssistant,
  registerAssistantWithProgress,
  logout,
  getMe,
  updateMe,
  getAdminDashboard,
  getAdminStats,
  getStudentDashboard,
  getStudentSchedule,
  getCourses,
};
