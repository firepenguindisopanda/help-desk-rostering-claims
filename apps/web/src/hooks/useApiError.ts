"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { HttpError } from "@/lib/apiClient";
import { retryWithBackoff } from "@/lib/utils";

export type ApiErrorState = {
  fieldErrors: Record<string, unknown>;
  bannerMessage: string | null;
  bannerType: "error" | "warning" | "info" | null;
};

export function useApiError() {
  const [errorState, setErrorState] = useState<ApiErrorState>({
    fieldErrors: {},
    bannerMessage: null,
    bannerType: null,
  });

  const clearErrors = useCallback(() => {
    setErrorState({
      fieldErrors: {},
      bannerMessage: null,
      bannerType: null,
    });
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    if (error instanceof HttpError) {
      const { status, message, body } = error;
      
      switch (status) {
        case 400:
        case 422: {
          // Field validation errors
          const errors = (body as any)?.errors || {};
          setErrorState({
            fieldErrors: errors,
            bannerMessage: Object.keys(errors).length > 0 ? null : message,
            bannerType: Object.keys(errors).length > 0 ? null : "warning",
          });
          if (Object.keys(errors).length === 0) {
            toast.warning(message);
          }
          break;
        }

        case 401:
          // Session expired - redirect to session expired page
          window.location.href = "/auth/session-expired";
          break;

        case 403:
          // Permission denied
          setErrorState({
            fieldErrors: {},
            bannerMessage: message,
            bannerType: "error",
          });
          break;

        case 404:
          // Not found - show as info message
          toast.info(message);
          break;

        case 409:
          // Conflict - suggest refresh
          setErrorState({
            fieldErrors: {},
            bannerMessage: `${message} Please refresh the page.`,
            bannerType: "warning",
          });
          break;

        case 429:
          // Rate limited
          toast.warning(message);
          break;

        case 500:
        case 502:
        case 503:
        case 504: {
          // Server errors - show retry-friendly message
          const contextMsg = context ? ` ${context}` : "";
          setErrorState({
            fieldErrors: {},
            bannerMessage: `${message}${contextMsg} Please try again.`,
            bannerType: "error",
          });
          break;
        }

        default:
          // Unknown error
          toast.error(message);
          break;
      }
    } else {
      // Network or other errors
      const msg = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(msg);
    }
  }, []);

  const handleErrorWithRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    context?: string,
    maxAttempts = 3
  ): Promise<T | null> => {
    try {
      if (maxAttempts > 1) {
        return await retryWithBackoff(fn, maxAttempts);
      } else {
        return await fn();
      }
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  const showSuccessToast = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const showInfoToast = useCallback((message: string) => {
    toast.info(message);
  }, []);

  return {
    errorState,
    clearErrors,
    handleError,
    handleErrorWithRetry,
    showSuccessToast,
    showInfoToast,
  };
}