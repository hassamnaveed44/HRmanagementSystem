import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";
import { authenticateRequest, authenticateWithRole } from "@/lib/auth-guard";

/**
 * GET /api/projects
 * List all projects, with filters for companyId and status.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");
    const statusParam = searchParams.get("status");

    // Scoping check: companyId is required
    if (!companyIdParam) {
      return NextResponse.json(
        { error: "companyId query parameter is required to scope project results." },
        { status: 400 }
      );
    }

    const companyId = parseInt(companyIdParam, 10);
    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid companyId" }, { status: 400 });
    }

    const whereClause: any = {
      companyId: companyId,
    };

    // Status Filter
    if (statusParam) {
      if (Object.values(ProjectStatus).includes(statusParam as ProjectStatus)) {
        whereClause.status = statusParam as ProjectStatus;
      } else {
        return NextResponse.json(
          { error: `Invalid status parameter. Must be one of: ${Object.values(ProjectStatus).join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Retrieve projects matching filters
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: {
          select: { name: true },
        },
        employees: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project for a company.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateWithRole(req, ["ADMIN", "HR"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { name, description, startDate, endDate, status, companyId } = body;

    // Validation: check required fields
    if (!name || !startDate || !companyId) {
      return NextResponse.json(
        { error: "Name, startDate, and companyId are required fields." },
        { status: 400 }
      );
    }

    const cId = parseInt(companyId, 10);
    if (isNaN(cId)) {
      return NextResponse.json({ error: "Invalid companyId format." }, { status: 400 });
    }

    // Business Rule Check: Verify Company exists
    const company = await prisma.company.findUnique({ where: { id: cId } });
    if (!company) {
      return NextResponse.json({ error: "Target company does not exist." }, { status: 404 });
    }

    // Create project
    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: (status as ProjectStatus) || ProjectStatus.PLANNED,
        companyId: cId,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
