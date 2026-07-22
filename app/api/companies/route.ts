import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest, authenticateWithRole } from "@/lib/auth-guard";

/**
 * GET /api/companies
 * Fetch all companies. Requires JWT authentication.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Retrieve all companies sorted by name
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies
 * Create a new company. Requires ADMIN role.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateWithRole(req, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { name, email, phone, address, website, status } = body;

    // Validation: Check required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required fields." },
        { status: 400 }
      );
    }

    // Insert company record into the database
    const newCompany = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        address: address || null,
        website: website || null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("POST /api/companies error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
