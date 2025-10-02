"use client";

import { getToken } from "./api";

export type ApiSuccess<T> = { success: true; data: T; message?: string };
export type ApiError = { success: false; message: string; errors?: Record<string, unknown> };

export class HttpError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v2").replace(/\/$/, "");
const IS_DEV = process.env.NODE_ENV !== "production";

function logDev(message: string, payload?: unknown) {
  if (!IS_DEV) return;
  if (payload === undefined) {
    console.debug(message);
    return;
  }
  console.debug(message, payload);
}

function logDevError(message: string, error: unknown) {
  if (!IS_DEV) return;
  console.error(message, error);
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400: return "Please fix the highlighted fields and try again.";
    case 401: return "Your session expired. Please sign in again.";
    case 403: return "You do not have permission to perform this action.";
    case 404: return "We couldn’t find what you’re looking for.";
    case 409: return "That action conflicts with the current state.";
    case 422: return "Please review the inputs and business rules.";
    case 429: return "You’re making requests too quickly. Please wait a moment.";
    case 500: return "Something went wrong on our side. Please try again.";
    case 502:
    case 503:
    case 504: return "Service is temporarily unavailable. Retrying may help.";
    default: return "Unexpected error occurred.";
  }
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    if (input.startsWith("http")) return input;
    const suffix = input.startsWith("/") ? input : `/${input}`;
    return `${API_BASE_URL}${suffix}`;
  }
  if (typeof URL !== "undefined" && input instanceof URL) {
    return input.toString();
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.url;
  }
  throw new Error("Unsupported RequestInfo type passed to apiFetch");
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiSuccess<T>> {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const url = resolveUrl(input);
  const method = init?.method || "GET";

  logDev(`[ApiClient] → ${method} ${url} | token: ${token ? 'present' : 'missing'}`);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(!isFormData && init?.body ? { "Content-Type": "application/json" } : {}),
      },
      credentials: "include",
    });
  } catch (error) {
    logDevError(`[ApiClient] ✖ Network failure for ${method} ${url}`, error);
    throw error;
  }

  let body: unknown = undefined;
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) {
    body = await res.json().catch(() => undefined);
  }

  logDev(`[ApiClient] ← ${res.status} ${res.statusText || ''} for ${url}`);
  if (!res.ok) {
    logDev(`[ApiClient] Response body:`, body);
  }

  if (!res.ok) {
    const msg = (body as ApiError)?.message || defaultMessageForStatus(res.status);
    throw new HttpError(res.status, msg, body);
  }

  // Some endpoints might return 204 No Content
  if (res.status === 204) {
    return { success: true, data: {} as T } as ApiSuccess<T>;
  }

  return (body || { success: true, data: {} }) as ApiSuccess<T>;
}

export const ApiClient = { apiFetch, HttpError };
