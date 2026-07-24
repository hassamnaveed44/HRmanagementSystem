import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Public paths that do not require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/login", "/api/auth/signup", "/api/auth/refresh"];

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

  // 2. Read authorization tokens from Authorization header or cookies
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("jwt_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;
  const token = authHeader ? authHeader.replace("Bearer ", "") : (cookieToken || refreshToken);

  // 3. If accessing protected page without any token, redirect to /login
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

  // 4. Role Route Restrictions for EMPLOYEE role (only allowed to view Dashboard / Profile at '/')
  if (!pathname.startsWith("/api/")) {
    const payload = verifyToken(token);
    if (payload && payload.role === "EMPLOYEE" && pathname !== "/") {
      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }
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
