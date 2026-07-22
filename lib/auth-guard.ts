import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "@/lib/auth";

export interface AuthResult {
  user: JWTPayload | null;
  errorResponse: NextResponse | null;
}

/**
 * Reusable Backend Authorization Guard
 * Extracts the Bearer token from the incoming request's Authorization header,
 * verifies the JWT signature and expiration, and returns the authenticated user identity.
 * 
 * If missing, malformed, invalid, or expired, returns a standardized HTTP 401 error response:
 * { "message": "Authentication required" }
 * 
 * @param req Incoming NextRequest instance
 * @returns AuthResult containing either authenticated user payload or HTTP 401 error response
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  // 1. Check if Authorization header is present
  if (!authHeader) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // 2. Validate Bearer token format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const token = parts[1];

  // 3. Verify JWT signature and expiration
  const payload = verifyToken(token);
  if (!payload) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // 4. Return authenticated user claims
  return {
    user: payload,
    errorResponse: null,
  };
}

/**
 * Reusable Role-Based Authorization Guard
 * Authenticates request and verifies user holds one of the required roles.
 * Returns HTTP 403 Forbidden if user lacks required role:
 * { "error": "Forbidden: You do not have permission to perform this action." }
 */
export async function authenticateWithRole(
  req: NextRequest,
  allowedRoles: ("ADMIN" | "HR" | "EMPLOYEE")[]
): Promise<AuthResult> {
  const auth = await authenticateRequest(req);
  if (auth.errorResponse || !auth.user) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role as "ADMIN" | "HR" | "EMPLOYEE")) {
    return {
      user: auth.user,
      errorResponse: NextResponse.json(
        { error: "Forbidden: You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return auth;
}
