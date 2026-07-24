import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";

/**
 * POST /api/auth/refresh
 * Silent token refresh handler.
 * Verifies long-lived Refresh Token from httpOnly cookie or payload, checks DB revocation status,
 * and issues a fresh short-lived Access Token.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Extract Refresh Token from httpOnly cookie or request body
    const cookieToken = req.cookies.get("refresh_token")?.value;
    let bodyToken: string | undefined;

    try {
      const body = await req.json();
      bodyToken = body?.refreshToken;
    } catch {
      // Body parsing optional
    }

    const refreshToken = cookieToken || bodyToken;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token missing." },
        { status: 401 }
      );
    }

    // 2. Verify Refresh Token signature and expiration
    const payload = verifyRefreshToken(refreshToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token." },
        { status: 401 }
      );
    }

    // 3. Verify user in database and check if refresh token matches active DB token (revocation check)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: "Refresh token revoked or user disabled." },
        { status: 401 }
      );
    }

    // 4. Generate new Access Token and rotated Refresh Token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyId: user.companyId,
      employeeId: user.employeeId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Update active refresh token in database (Token Rotation)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // 6. Build response with new Access Token
    const response = NextResponse.json({
      accessToken: newAccessToken,
      token: newAccessToken, // Backward compatibility alias
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        employeeId: user.employeeId,
      },
    });

    // Set httpOnly cookie for rotated Refresh Token
    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800, // 7 days
    });

    // Set client access token cookie for Next.js proxy
    response.cookies.set("jwt_token", newAccessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh authentication token." },
      { status: 500 }
    );
  }
}
