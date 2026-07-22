import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

/**
 * GET /api/auth/me
 * Returns the profile of the currently authenticated user based on the Bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate request using reusable Auth Guard
    const authResult = await authenticateRequest(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult.user!;

    // 2. Fetch authenticated user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        employeeId: true,
        createdAt: true,
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // 3. Return safe user profile
    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }
}
