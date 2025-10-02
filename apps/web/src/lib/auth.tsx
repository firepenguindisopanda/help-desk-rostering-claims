"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = { 
  id: string; 
  email?: string; 
  username?: string;
  name?: string;
  role: "admin" | "assistant" 
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; errorCode?: string; errorDetails?: any }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// Central config
const AUTH_MODE = (process.env.NEXT_PUBLIC_AUTH_MODE || "").toLowerCase();
const AUTH_DEV_ROLE = ((process.env.NEXT_PUBLIC_AUTH_DEV_ROLE as string) || "assistant").toLowerCase() as "admin" | "assistant";
import { ApiV2 } from "./api";

function normalizeUser(me: { id?: string; email?: string; username?: string; name?: string; first_name?: string; last_name?: string; role?: string | null; is_admin?: boolean }): User {
  let role: "admin" | "assistant";
  if (me.is_admin) {
    role = "admin";
  } else if (me.role === "admin") {
    role = "admin";
  } else {
    role = "assistant";
  }
  const name = me.name || [me.first_name, me.last_name].filter(Boolean).join(" ") || undefined;
  return {
    id: (me.id as string) || me.username || "user",
    email: me.email,
    username: me.username,
    name,
    role,
  };
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap user session on mount (cookie-based or mock)
  useEffect(() => {
    let mounted = true;
    
    const setUserFromMe = (me: any) => {
      setUser(normalizeUser(me));
    };

    const handleMockAuth = () => {
      if (mounted) {
        setUser({
          id: "mock-user",
          email: "mock@example.com",
          name: "Mock User",
          role: AUTH_DEV_ROLE,
        });
        setLoading(false);
      }
    };

    const handleNoToken = () => {
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    };

    const clearInvalidToken = async () => {
      try {
        const { clearToken } = await import('./api');
        clearToken();
      } catch {}
    };

    async function bootstrap() {
      if (AUTH_MODE === "mock") {
        handleMockAuth();
        return;
      }

      try {
        // First check if we have a token - avoid unnecessary API calls
        const { getToken } = await import('./api');
        const token = getToken();
        
        if (!token) {
          handleNoToken();
          return;
        }

        // Token exists, verify it's valid by calling /me endpoint
        const result = await ApiV2.getMe();
        if (!mounted) return;
        
        if (result.success && result.user) {
          setUserFromMe(result.user);
        } else {
          // Token is invalid/expired, clear it
          await clearInvalidToken();
          setUser(null);
        }
      } catch (error) {
        console.error("Auth bootstrap error:", error);
        if (mounted) {
          setUser(null);
          await clearInvalidToken();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function login(username: string, password: string) {
    if (AUTH_MODE === "mock") {
      setUser({ id: "mock-user", username, name: "Mock User", role: AUTH_DEV_ROLE });
      return { success: true };
    }
    try {
      // Call backend login via shared ApiV2 helper; handles cookies/tokens consistently
      const res = await ApiV2.loginV2(username, password);
      if (!res.success) {
        return {
          success: false,
          error: res.error || "Login failed",
          errorCode: res.errorCode,
          errorDetails: res.errorDetails,
        };
      }

      if (res.token) {
        try {
          const { storeToken } = await import('./api');
          storeToken(res.token);
        } catch (e) {
          console.warn('Failed to persist token on client:', e);
        }
      }

      if (res.user) {
        setUser(normalizeUser(res.user));
        return { success: true };
      }

      return { success: false, error: "No user data received" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  }

  async function register(email: string, password: string, name: string) {
    if (AUTH_MODE === "mock") {
      setUser({ id: "mock-user", email, name, role: AUTH_DEV_ROLE });
      return { success: true };
    }
    try {
      const res = await ApiV2.register(email, password, name);
      if (!res.success) return { success: false, error: res.error || "Registration failed" };
      const me = await ApiV2.getMe();
      if (me.success && me.user) {
        setUser(normalizeUser(me.user as any));
        return { success: true };
      }
      return { success: false, error: me.error || "Unable to load profile after registration" };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error" };
    }
  }

  async function logout() {
    if (AUTH_MODE === "mock") {
      setUser(null);
      return;
    }
    
    // Clear client-side state immediately for better UX
    setUser(null);
    
    try {
      // Clear client-side tokens first
      const { clearToken } = await import('./api');
      clearToken();
      
      // If there's a backend logout, call it best-effort (non-blocking for UX)
      ApiV2.logout?.().catch(() => {});
    } catch (error) {
      console.error("Logout error:", error);
      // User is already logged out client-side, so this is non-critical
    }
  }

  function hasRole(role: string): boolean {
    return !!user && user.role === role;
  }

  const isAuthenticated = !!user;

  const contextValue = React.useMemo(() => ({
    user, 
    loading, 
    login, 
    register, 
    logout, 
    hasRole, 
    isAuthenticated 
  }), [user, loading, isAuthenticated]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}