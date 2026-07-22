import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EmployeeStatus } from "@prisma/client";
import { authenticateRequest, authenticateWithRole } from "@/lib/auth-guard";

/**
 * GET /api/employees/[id]
 * Fetch detailed profile of a specific employee, including their manager, subordinates,
 * salary history, and assigned projects. This drives the "Eye Icon" details view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: {
          select: { name: true },
        },
        designation: {
          select: { title: true },
        },
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        subordinates: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, status: true },
        },
        salaries: {
          orderBy: [
            { year: "desc" },
            { month: "desc" },
          ],
        },
        projects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee details" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/employees/[id]
 * Update an employee's details, enforcing validation constraints.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateWithRole(req, ["ADMIN", "HR"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      address,
      joiningDate,
      status,
      designationId,
      managerId,
    } = body;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const companyId = existingEmployee.companyId;
    const updateData: any = {};

    // 1. Validate employeeCode uniqueness if changed
    if (employeeCode && employeeCode !== existingEmployee.employeeCode) {
      const codeConflict = await prisma.employee.findUnique({ where: { employeeCode } });
      if (codeConflict) {
        return NextResponse.json(
          { error: `Employee code '${employeeCode}' is already in use.` },
          { status: 409 }
        );
      }
      updateData.employeeCode = employeeCode;
    }

    // 2. Validate email uniqueness if changed
    if (email && email !== existingEmployee.email) {
      const emailConflict = await prisma.employee.findUnique({ where: { email } });
      if (emailConflict) {
        return NextResponse.json(
          { error: `Email address '${email}' is already in use.` },
          { status: 409 }
        );
      }
      updateData.email = email;
    }

    // 3. Validate designation if changed (must belong to the same company)
    if (designationId !== undefined) {
      const dId = parseInt(designationId, 10);
      if (isNaN(dId)) {
        return NextResponse.json({ error: "Invalid designationId format" }, { status: 400 });
      }

      const designation = await prisma.designation.findUnique({ where: { id: dId } });
      if (!designation || designation.companyId !== companyId) {
        return NextResponse.json(
          { error: "Designation does not exist or does not belong to the employee's company." },
          { status: 400 }
        );
      }
      updateData.designationId = dId;
    }

    // 4. Validate manager if changed (must belong to the same company, cannot be self)
    if (managerId !== undefined) {
      if (managerId === null) {
        updateData.managerId = null;
      } else {
        const mId = parseInt(managerId, 10);
        if (isNaN(mId)) {
          return NextResponse.json({ error: "Invalid managerId format" }, { status: 400 });
        }

        // Business Rule: An employee cannot be their own manager
        if (mId === employeeId) {
          return NextResponse.json(
            { error: "An employee cannot be selected as their own manager." },
            { status: 400 }
          );
        }

        const manager = await prisma.employee.findUnique({ where: { id: mId } });
        if (!manager || manager.companyId !== companyId) {
          return NextResponse.json(
            { error: "Manager does not exist or does not belong to the employee's company." },
            { status: 400 }
          );
        }
        updateData.managerId = mId;
      }
    }

    // 5. Assign other fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (joiningDate !== undefined) updateData.joiningDate = new Date(joiningDate);
    if (status !== undefined) {
      if (Object.values(EmployeeStatus).includes(status as EmployeeStatus)) {
        updateData.status = status as EmployeeStatus;
      } else {
        return NextResponse.json({ error: "Invalid employment status value." }, { status: 400 });
      }
    }

    // Perform DB update
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update employee details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/[id]
 * Delete employee record. Check restrict references manually for friendly responses.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateWithRole(req, ["ADMIN", "HR"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
    }

    // Business Rule Check: Check if this employee is a manager for other employees
    const subordinateCount = await prisma.employee.count({
      where: { managerId: employeeId },
    });
    if (subordinateCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete employee. They are currently a manager for ${subordinateCount} subordinate(s).` },
        { status: 409 }
      );
    }

    // Business Rule Check: Check if this employee has salary records
    const salaryCount = await prisma.salary.count({
      where: { employeeId },
    });
    if (salaryCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete employee. They have ${salaryCount} monthly salary records.` },
        { status: 409 }
      );
    }

    // If checks pass, delete (cascading project assignments automatically via schema `onDelete: Cascade`)
    await prisma.employee.delete({
      where: { id: employeeId },
    });

    return NextResponse.json({ message: "Employee record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
