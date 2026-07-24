import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * POST /api/auth/signup
 * Registers a new user account with validated inputs and hashed password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, companyId } = body;

    // 1. Validate required inputs
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // 3. Enforce minimum password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 4. Check for already registered email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // 5. If companyId is provided, verify company exists
    let validCompanyId: number | null = null;
    if (companyId) {
      const parsedId = parseInt(companyId, 10);
      if (!isNaN(parsedId)) {
        const companyExists = await prisma.company.findUnique({
          where: { id: parsedId },
        });
        if (companyExists) {
          validCompanyId = parsedId;
        }
      }
    }

    // 6. Hash the password using bcryptjs
    const passwordHash = await hashPassword(password);

    // 7. Store new user in database (default role: HR unless specified)
    const assignedRole = role && Object.values(Role).includes(role as Role)
      ? (role as Role)
      : Role.HR;

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
        companyId: validCompanyId,
        isActive: true,
      },
    });

    // 8. Generate Access and Refresh Tokens
    const accessToken = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      companyId: newUser.companyId,
      employeeId: newUser.employeeId,
    });

    const refreshToken = generateRefreshToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // 9. Persist Refresh Token in DB
    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken: refreshToken },
    });

    // 10. Build response
    const response = NextResponse.json(
      {
        accessToken,
        token: accessToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          companyId: newUser.companyId,
          employeeId: newUser.employeeId,
        },
      },
      { status: 201 }
    );

    // Set httpOnly cookie for Refresh Token
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
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
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json(
      { error: "Failed to process signup request." },
      { status: 500 }
    );
  }
}
