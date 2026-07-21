import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/projects/[id]/assign
 * Assign an employee to a project, checking company matching and duplication.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const { employeeId, role } = body;

    if (employeeId === undefined || !role) {
      return NextResponse.json(
        { error: "employeeId and role are required." },
        { status: 400 }
      );
    }

    const empId = parseInt(employeeId, 10);
    if (isNaN(empId)) {
      return NextResponse.json({ error: "Invalid employee ID format." }, { status: 400 });
    }

    // 1. Fetch Project and Employee to verify their existences and matching companies
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    // Business Rule Check: A project can only contain employees from the same company
    if (employee.companyId !== project.companyId) {
      return NextResponse.json(
        { error: "Employee and project must belong to the same company." },
        { status: 400 }
      );
    }

    // Business Rule Check: The same employee cannot be assigned to the same project twice
    const existingAssignment = await prisma.projectEmployee.findUnique({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: empId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Employee is already assigned to this project." },
        { status: 409 }
      );
    }

    // Create the assignment
    const assignment = await prisma.projectEmployee.create({
      data: {
        projectId,
        employeeId: empId,
        role,
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/assign error:", error);
    return NextResponse.json(
      { error: "Failed to assign employee to project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/assign
 * Remove an employee from a project.
 * Supports employeeId via query parameters (?employeeId=X) or JSON body.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Retrieve employeeId from query param or JSON body
    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");
    
    let empId: number;

    if (employeeIdParam) {
      empId = parseInt(employeeIdParam, 10);
    } else {
      const body = await req.json().catch(() => ({}));
      empId = parseInt(body.employeeId, 10);
    }

    if (isNaN(empId)) {
      return NextResponse.json(
        { error: "employeeId is required to remove assignment." },
        { status: 400 }
      );
    }

    // Check if the assignment exists
    const assignment = await prisma.projectEmployee.findUnique({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: empId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment record not found for this employee on this project." },
        { status: 404 }
      );
    }

    // Delete the project assignment
    await prisma.projectEmployee.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: empId,
        },
      },
    });

    return NextResponse.json({ message: "Employee removed from project successfully" });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/assign error:", error);
    return NextResponse.json(
      { error: "Failed to remove employee from project" },
      { status: 500 }
    );
  }
}
