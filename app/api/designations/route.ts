import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/designations
 * Fetch designations. Can filter by companyId using query parameters.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");

    // Build conditional filter object
    const filter: { companyId?: number } = {};
    if (companyIdParam) {
      const companyId = parseInt(companyIdParam, 10);
      if (!isNaN(companyId)) {
        filter.companyId = companyId;
      }
    }

    // Retrieve designations matching filters
    const designations = await prisma.designation.findMany({
      where: filter,
      include: {
        company: {
          select: { name: true },
        },
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(designations);
  } catch (error) {
    console.error("GET /api/designations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch designations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/designations
 * Create a new designation for a specific company.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, companyId } = body;

    // Validation: Check required fields
    if (!title || !companyId) {
      return NextResponse.json(
        { error: "Title and companyId are required fields." },
        { status: 400 }
      );
    }

    const cId = parseInt(companyId, 10);
    if (isNaN(cId)) {
      return NextResponse.json(
        { error: "Invalid companyId format." },
        { status: 400 }
      );
    }

    // Business Rule Check: Verify the company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: cId },
    });

    if (!companyExists) {
      return NextResponse.json(
        { error: "Target company does not exist." },
        { status: 404 }
      );
    }

    // Create designation
    const newDesignation = await prisma.designation.create({
      data: {
        title,
        description: description || null,
        companyId: cId,
      },
    });

    return NextResponse.json(newDesignation, { status: 201 });
  } catch (error) {
    console.error("POST /api/designations error:", error);
    return NextResponse.json(
      { error: "Failed to create designation" },
      { status: 500 }
    );
  }
}
