import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        createdAt: true,
      },
    });

    // 8. Return created user response (never returning passwordHash)
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json(
      { error: "Failed to process signup request." },
      { status: 500 }
    );
  }
}
