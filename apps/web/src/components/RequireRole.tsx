"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";

interface RequireRoleProps {
  readonly role: string;
  readonly children: React.ReactNode;
  readonly fallback?: string;
}

export function RequireRole({ role, children, fallback = "/unauthorized" }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/login" as any);
      } else {
        const ok = role === "assistant" ? (user.role === "assistant" || user.role === "admin") : user.role === role;
        if (!ok) {
          router.replace(fallback as any);
        }
      }
    }
  }, [loading, user, role, router, fallback]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  let allow = false;
  if (user) {
    if (role === "assistant") {
      allow = user.role === "assistant" || user.role === "admin";
    } else {
      allow = user.role === role;
    }
  }
  if (!allow) {
    return null;
  }

  return <>{children}</>;
}
