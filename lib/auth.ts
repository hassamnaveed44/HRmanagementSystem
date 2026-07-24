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

// Secrets for signing Access and Refresh Tokens
const JWT_SECRET = process.env.JWT_SECRET || "hr_system_super_secret_jwt_key_2026_x89a";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh_token_2026`;

/**
 * Hash a plain text password using bcryptjs with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare a plain text password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a short-lived Access Token (valid for 15 minutes).
 * Used for authenticating every API request.
 */
export function generateAccessToken(payload: {
  userId: number;
  email: string;
  role: string;
  name: string;
  companyId?: number | null;
  employeeId?: number | null;
}): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

/**
 * Generate a long-lived Refresh Token (valid for 7 days).
 * Stored in an httpOnly cookie and persisted in DB for revocation.
 */
export function generateRefreshToken(payload: {
  userId: number;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode an Access Token string.
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode a Refresh Token string.
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Backward compatibility aliases
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;
