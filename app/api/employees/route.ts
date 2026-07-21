import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EmployeeStatus } from "@prisma/client";

/**
 * GET /api/employees
 * List all employees with search and filter parameters.
 * Scoped by companyId to prevent cross-company leakage.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");
    const designationIdParam = searchParams.get("designationId");
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");

    // Scoping check: companyId is required to scope data fetching
    if (!companyIdParam) {
      return NextResponse.json(
        { error: "companyId query parameter is required to scope employee results." },
        { status: 400 }
      );
    }

    const companyId = parseInt(companyIdParam, 10);
    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid companyId" }, { status: 400 });
    }

    // Build the query where clause
    const whereClause: any = {
      companyId: companyId,
    };

    // Designation Filter
    if (designationIdParam) {
      const designationId = parseInt(designationIdParam, 10);
      if (!isNaN(designationId)) {
        whereClause.designationId = designationId;
      }
    }

    // Status Filter
    if (statusParam) {
      if (Object.values(EmployeeStatus).includes(statusParam as EmployeeStatus)) {
        whereClause.status = statusParam as EmployeeStatus;
      } else {
        return NextResponse.json(
          { error: `Invalid status parameter. Must be one of: ${Object.values(EmployeeStatus).join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Search query: search code, email, first name, or last name case-insensitively
    if (searchParam && searchParam.trim() !== "") {
      const search = searchParam.trim();
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch matching employees including relation data
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        designation: {
          select: { title: true },
        },
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees
 * Create a new employee with company validation checks.
 */
export async function POST(req: NextRequest) {
  try {
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
      companyId,
      designationId,
      managerId,
    } = body;

    // Validation: check required fields
    if (
      !employeeCode ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !address ||
      !joiningDate ||
      !companyId ||
      !designationId
    ) {
      return NextResponse.json(
        { error: "Required fields are missing. Make sure code, name, email, phone, address, join date, company, and designation are provided." },
        { status: 400 }
      );
    }

    const cId = parseInt(companyId, 10);
    const dId = parseInt(designationId, 10);
    const mId = managerId ? parseInt(managerId, 10) : null;

    if (isNaN(cId) || isNaN(dId) || (managerId && isNaN(mId!))) {
      return NextResponse.json(
        { error: "Invalid numeric formats for companyId, designationId, or managerId." },
        { status: 400 }
      );
    }

    // Business Rule Check: Verify Company exists
    const company = await prisma.company.findUnique({ where: { id: cId } });
    if (!company) {
      return NextResponse.json({ error: "Target company does not exist." }, { status: 404 });
    }

    // Business Rule Check: Designation must belong to the same company as the employee
    const designation = await prisma.designation.findUnique({ where: { id: dId } });
    if (!designation || designation.companyId !== cId) {
      return NextResponse.json(
        { error: "Designation does not exist or does not belong to the selected company." },
        { status: 400 }
      );
    }

    // Business Rule Check: Manager must belong to the same company as the employee
    if (mId) {
      const manager = await prisma.employee.findUnique({ where: { id: mId } });
      if (!manager || manager.companyId !== cId) {
        return NextResponse.json(
          { error: "Reporting manager does not exist or does not belong to the selected company." },
          { status: 400 }
        );
      }
    }

    // Business Rule Check: Employee email and employeeCode must be unique
    const codeConflict = await prisma.employee.findUnique({ where: { employeeCode } });
    if (codeConflict) {
      return NextResponse.json(
        { error: `Employee code '${employeeCode}' is already assigned to another employee.` },
        { status: 409 }
      );
    }

    const emailConflict = await prisma.employee.findUnique({ where: { email } });
    if (emailConflict) {
      return NextResponse.json(
        { error: `Email address '${email}' is already in use.` },
        { status: 409 }
      );
    }

    // Create Employee record
    const newEmployee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        address,
        joiningDate: new Date(joiningDate),
        status: (status as EmployeeStatus) || EmployeeStatus.ACTIVE,
        companyId: cId,
        designationId: dId,
        managerId: mId,
      },
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { error: "Failed to create employee record" },
      { status: 500 }
    );
  }
}
