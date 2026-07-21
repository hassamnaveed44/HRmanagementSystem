import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/companies/[id]
 * Fetch a single company's details.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[id]
 * Update an existing company's details.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, phone, address, website, status } = body;

    // Check if company exists first
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: name !== undefined ? name : existingCompany.name,
        email: email !== undefined ? email : existingCompany.email,
        phone: phone !== undefined ? phone : existingCompany.phone,
        address: address !== undefined ? address : existingCompany.address,
        website: website !== undefined ? website : existingCompany.website,
        status: status !== undefined ? status : existingCompany.status,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("PUT /api/companies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update company details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete a company if no related records exist.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    // Business Rule Check: A company cannot be deleted while related records exist.
    // We check designations, employees, projects, and salary records.
    const employeeCount = await prisma.employee.count({ where: { companyId } });
    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete company. It contains ${employeeCount} employees.` },
        { status: 409 }
      );
    }

    const designationCount = await prisma.designation.count({ where: { companyId } });
    if (designationCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete company. It contains ${designationCount} designations.` },
        { status: 409 }
      );
    }

    const projectCount = await prisma.project.count({ where: { companyId } });
    if (projectCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete company. It contains ${projectCount} projects.` },
        { status: 409 }
      );
    }

    const salaryCount = await prisma.salary.count({ where: { companyId } });
    if (salaryCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete company. It contains ${salaryCount} salary records.` },
        { status: 409 }
      );
    }

    // If no related records exist, delete the company
    await prisma.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/companies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
