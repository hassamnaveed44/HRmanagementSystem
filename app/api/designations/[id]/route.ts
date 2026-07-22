import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest, authenticateWithRole } from "@/lib/auth-guard";

/**
 * PUT /api/designations/[id]
 * Update designation details.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateWithRole(req, ["ADMIN", "HR"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const designationId = parseInt(id, 10);

    if (isNaN(designationId)) {
      return NextResponse.json({ error: "Invalid designation ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description } = body;

    // Check if designation exists
    const existingDesignation = await prisma.designation.findUnique({
      where: { id: designationId },
    });

    if (!existingDesignation) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    const updatedDesignation = await prisma.designation.update({
      where: { id: designationId },
      data: {
        title: title !== undefined ? title : existingDesignation.title,
        description: description !== undefined ? description : existingDesignation.description,
      },
    });

    return NextResponse.json(updatedDesignation);
  } catch (error) {
    console.error("PUT /api/designations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update designation details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/designations/[id]
 * Delete designation if no employees are assigned to it.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateWithRole(req, ["ADMIN", "HR"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const designationId = parseInt(id, 10);

    if (isNaN(designationId)) {
      return NextResponse.json({ error: "Invalid designation ID" }, { status: 400 });
    }

    // Business Rule Check: Prevent deletion of a designation currently assigned to employees.
    const employeeCount = await prisma.employee.count({
      where: { designationId },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete designation. It is currently assigned to ${employeeCount} employee(s).`,
        },
        { status: 409 }
      );
    }

    // Delete the designation
    await prisma.designation.delete({
      where: { id: designationId },
    });

    return NextResponse.json({ message: "Designation deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/designations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete designation" },
      { status: 500 }
    );
  }
}
