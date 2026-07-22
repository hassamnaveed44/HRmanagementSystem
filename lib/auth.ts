import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT Payload structure containing safe user claims
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
  companyId?: number | null;
  employeeId?: number | null;
  iat?: number;
  exp?: number;
}

// Fallback secret for development safety
const JWT_SECRET = process.env.JWT_SECRET || "hr_system_super_secret_jwt_key_2026_x89a";

/**
 * Hash a plain text password using bcryptjs with 10 salt rounds.
 * @param password Plain text password
 * @returns Promise resolving to the hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare a plain text password against a stored bcrypt hash.
 * @param password Candidate plain text password
 * @param hash Stored bcrypt hash
 * @returns Promise resolving to boolean match result
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token containing non-sensitive user claims.
 * @param payload Object containing userId, email, role, name, companyId, and employeeId
 * @returns Signed JWT string valid for 7 days
 */
export function generateToken(payload: {
  userId: number;
  email: string;
  role: string;
  name: string;
  companyId?: number | null;
  employeeId?: number | null;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT token string.
 * @param token JWT token string from Authorization header
 * @returns Decoded JWTPayload object if valid, or null if invalid/expired
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
