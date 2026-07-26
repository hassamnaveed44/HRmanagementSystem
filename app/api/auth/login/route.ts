import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns signed Access & Refresh Tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validate required inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.isActive) {
      // Return generic 401 error message for security
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Compare provided password with stored hash
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Auto-link employeeId and companyId if missing by matching Employee email
    let linkedEmployeeId = user.employeeId;
    let linkedCompanyId = user.companyId;

    if (!linkedEmployeeId || !linkedCompanyId) {
      const matchingEmployee = await prisma.employee.findUnique({
        where: { email: cleanEmail },
      });
      if (matchingEmployee) {
        linkedEmployeeId = matchingEmployee.id;
        linkedCompanyId = matchingEmployee.companyId;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            employeeId: matchingEmployee.id,
            companyId: matchingEmployee.companyId,
          },
        });
      }
    }

    // 4. Generate Access and Refresh Tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyId: linkedCompanyId,
      employeeId: linkedEmployeeId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Persist Refresh Token in database for active session tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    // 6. Build response with tokens & safe user profile
    const response = NextResponse.json({
      accessToken,
      token: accessToken, // Backward compatibility alias
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: linkedCompanyId,
        employeeId: linkedEmployeeId,
      },
    });

    // Set httpOnly cookie for long-lived Refresh Token
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800, // 7 days
    });

    // Set access token cookie for Next.js proxy
    response.cookies.set("jwt_token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      {
        error: "Failed to process login request.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
