import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

// Configurable values
const COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "access_token";
const JWT_ALG = (process.env.JWT_ALG || "HS256").toUpperCase();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_JWKS_URL = process.env.JWT_JWKS_URL; // Prefer JWKS for RS256
const AUTH_MODE = (process.env.NEXT_PUBLIC_AUTH_MODE || "").toLowerCase();
const AUTH_DEV_ROLE = (process.env.NEXT_PUBLIC_AUTH_DEV_ROLE || "assistant").toLowerCase();

// Local route helpers to keep middleware edge-compatible (no external imports)
const routes = {
  root: "/",
  unauthorized: "/unauthorized",
  auth: { login: "/auth/login", register: "/auth/register" },
};

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAssistRoute(pathname: string): boolean {
  return pathname === "/assist" || pathname.startsWith("/assist/");
}

function isStudentRoute(pathname: string): boolean {
  return pathname === "/student" || pathname.startsWith("/student/");
}

async function verifyToken(token: string): Promise<{ role?: string; type?: string; is_admin?: boolean } | null> {
  try {
    if (JWT_JWKS_URL) {
      const jwks = createRemoteJWKSet(new URL(JWT_JWKS_URL));
      const { payload } = await jwtVerify(token, jwks, { algorithms: [JWT_ALG as any] });
      return { role: (payload as any).role, type: (payload as any).type, is_admin: (payload as any).is_admin };
    }

    if (!JWT_SECRET) return null;
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: [JWT_ALG as any] });
    return { role: (payload as any).role, type: (payload as any).type, is_admin: (payload as any).is_admin };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files and manifest
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Only protect admin, student, and assist routes
  if (!(isAdminRoute(pathname) || isAssistRoute(pathname) || isStudentRoute(pathname))) {
    return NextResponse.next();
  }

  const redirectTo = (path: string) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  const isAuthorizedForPath = (path: string, role?: string) => {
    if (!role) return false;
    
    // Normalize role (student -> assistant for compatibility)
    const normalized = role === "student" ? "assistant" : role;
    
    if (isAdminRoute(path)) {
      return normalized === "admin";
    }
    
    if (isStudentRoute(path) || isAssistRoute(path)) {
      return normalized === "assistant" || normalized === "admin";
    }
    
    return true;
  };

  // Dev bypass: mock mode
  if (AUTH_MODE === "mock") {
    const role = AUTH_DEV_ROLE === "admin" ? "admin" : "assistant";
    if (!isAuthorizedForPath(pathname, role)) return redirectTo(routes.unauthorized);
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return redirectTo(routes.auth.login);
  }

  const claims = await verifyToken(token);
  if (!claims) {
    return redirectTo(routes.auth.login);
  }

  // Resolve role from various claim formats
  let resolvedRole: string | undefined = claims.role || undefined;
  if (!resolvedRole && claims.type) {
    resolvedRole = claims.type;
  }
  if (!resolvedRole && claims.is_admin !== undefined) {
    resolvedRole = claims.is_admin ? "admin" : "assistant";
  }

  if (!isAuthorizedForPath(pathname, resolvedRole)) {
    return redirectTo(routes.unauthorized);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/assist/:path*", "/student/:path*"],
};