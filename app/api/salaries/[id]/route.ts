import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

/**
 * GET /api/salaries/[id]
 * Fetch details of a single salary slip.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salaryId = parseInt(id, 10);

    if (isNaN(salaryId)) {
      return NextResponse.json({ error: "Invalid salary record ID" }, { status: 400 });
    }

    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, email: true },
        },
      },
    });

    if (!salary) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    return NextResponse.json(salary);
  } catch (error) {
    console.error("GET /api/salaries/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary record details" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/salaries/[id]
 * Update a salary slip, doing re-calculations if numbers are modified.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salaryId = parseInt(id, 10);

    if (isNaN(salaryId)) {
      return NextResponse.json({ error: "Invalid salary record ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      basicSalary,
      allowances,
      bonus,
      deductions,
      paymentStatus,
      paidAt,
    } = body;

    // Fetch existing record first
    const existingSalary = await prisma.salary.findUnique({
      where: { id: salaryId },
    });

    if (!existingSalary) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    // Determine values to use
    const basic = basicSalary !== undefined ? parseFloat(basicSalary) : existingSalary.basicSalary;
    const allow = allowances !== undefined ? parseFloat(allowances) : existingSalary.allowances;
    const bon = bonus !== undefined ? parseFloat(bonus) : existingSalary.bonus;
    const deduct = deductions !== undefined ? parseFloat(deductions) : existingSalary.deductions;

    if (isNaN(basic) || isNaN(allow) || isNaN(bon) || isNaN(deduct)) {
      return NextResponse.json({ error: "Salary fields must be valid numbers." }, { status: 400 });
    }

    // Recalculate netSalary
    const netSalary = basic + allow + bon - deduct;

    // Build update object
    const updateData: any = {
      basicSalary: basic,
      allowances: allow,
      bonus: bon,
      deductions: deduct,
      netSalary,
    };

    if (paymentStatus !== undefined) {
      if (Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
        updateData.paymentStatus = paymentStatus as PaymentStatus;
        
        // Handle paidAt timestamp transition
        if (paymentStatus === PaymentStatus.PAID) {
          updateData.paidAt = paidAt ? new Date(paidAt) : (existingSalary.paidAt || new Date());
        } else {
          updateData.paidAt = null;
        }
      } else {
        return NextResponse.json({ error: "Invalid payment status value." }, { status: 400 });
      }
    } else if (paidAt !== undefined) {
      updateData.paidAt = paidAt ? new Date(paidAt) : null;
    }

    // Perform database update
    const updatedSalary = await prisma.salary.update({
      where: { id: salaryId },
      data: updateData,
    });

    return NextResponse.json(updatedSalary);
  } catch (error) {
    console.error("PUT /api/salaries/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update salary details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/salaries/[id]
 * Delete a salary slip.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salaryId = parseInt(id, 10);

    if (isNaN(salaryId)) {
      return NextResponse.json({ error: "Invalid salary record ID" }, { status: 400 });
    }

    await prisma.salary.delete({
      where: { id: salaryId },
    });

    return NextResponse.json({ message: "Salary record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/salaries/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete salary record" },
      { status: 500 }
    );
  }
}
