import { NextRequest, NextResponse } from "next/server";

// Public paths that do not require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/login", "/api/auth/signup"];

/**
 * Next.js 16 Proxy for Route Security & Access Control
 * Intercepts requests and redirects unauthenticated users to /login.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public paths, static assets, and Next.js internal routes
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Read authorization token from Authorization header or cookie
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("jwt_token")?.value;
  const token = authHeader ? authHeader.replace("Bearer ", "") : cookieToken;

  // 3. If accessing protected page without a token, redirect to /login
  if (!token) {
    // For API requests, return HTTP 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // For page navigations, redirect to login page
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Keep middleware compatibility
export function middleware(req: NextRequest) {
  return proxy(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
