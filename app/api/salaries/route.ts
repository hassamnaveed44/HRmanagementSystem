import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

/**
 * GET /api/salaries
 * Fetch and filter salary records.
 * Scoped by companyId to isolate data.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");
    const employeeIdParam = searchParams.get("employeeId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const statusParam = searchParams.get("paymentStatus");

    // Scoping check: companyId is required
    if (!companyIdParam) {
      return NextResponse.json(
        { error: "companyId query parameter is required to scope salary records." },
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

    // Employee Filter
    if (employeeIdParam) {
      const employeeId = parseInt(employeeIdParam, 10);
      if (!isNaN(employeeId)) {
        whereClause.employeeId = employeeId;
      }
    }

    // Month Filter (1 to 12)
    if (monthParam) {
      const month = parseInt(monthParam, 10);
      if (!isNaN(month)) {
        whereClause.month = month;
      }
    }

    // Year Filter (e.g. 2026)
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (!isNaN(year)) {
        whereClause.year = year;
      }
    }

    // Payment Status Filter
    if (statusParam) {
      if (Object.values(PaymentStatus).includes(statusParam as PaymentStatus)) {
        whereClause.paymentStatus = statusParam as PaymentStatus;
      } else {
        return NextResponse.json(
          { error: `Invalid paymentStatus parameter. Must be one of: ${Object.values(PaymentStatus).join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Fetch salary slips matching filters
    const salaries = await prisma.salary.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
    });

    return NextResponse.json(salaries);
  } catch (error) {
    console.error("GET /api/salaries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary records" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/salaries
 * Create a new salary slip with backend calculation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeId,
      companyId,
      month,
      year,
      basicSalary,
      allowances,
      bonus,
      deductions,
      paymentStatus,
      paidAt,
    } = body;

    // Validation: check required fields
    if (
      employeeId === undefined ||
      companyId === undefined ||
      month === undefined ||
      year === undefined ||
      basicSalary === undefined ||
      allowances === undefined ||
      bonus === undefined ||
      deductions === undefined
    ) {
      return NextResponse.json(
        { error: "Required fields are missing. Make sure employeeId, companyId, month, year, and salary components are provided." },
        { status: 400 }
      );
    }

    const empId = parseInt(employeeId, 10);
    const compId = parseInt(companyId, 10);
    const mth = parseInt(month, 10);
    const yr = parseInt(year, 10);
    const basic = parseFloat(basicSalary);
    const allow = parseFloat(allowances);
    const bon = parseFloat(bonus);
    const deduct = parseFloat(deductions);

    if (
      isNaN(empId) ||
      isNaN(compId) ||
      isNaN(mth) ||
      isNaN(yr) ||
      isNaN(basic) ||
      isNaN(allow) ||
      isNaN(bon) ||
      isNaN(deduct)
    ) {
      return NextResponse.json({ error: "Invalid numeric formats for fields." }, { status: 400 });
    }

    if (mth < 1 || mth > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12." }, { status: 400 });
    }

    // Business Rule Check: Verify Employee exists and belongs to the specified company
    const employee = await prisma.employee.findUnique({
      where: { id: empId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (employee.companyId !== compId) {
      return NextResponse.json(
        { error: "Target employee does not belong to the selected company." },
        { status: 400 }
      );
    }

    // Business Rule Check: Only one salary record can exist for an employee for the same month and year
    const existingSalary = await prisma.salary.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: empId,
          month: mth,
          year: yr,
        },
      },
    });

    if (existingSalary) {
      return NextResponse.json(
        { error: `A salary slip already exists for this employee for ${mth}/${yr}.` },
        { status: 409 }
      );
    }

    // Business Rule Check: backend calculation for netSalary
    // netSalary = basicSalary + allowances + bonus - deductions
    const netSalary = basic + allow + bon - deduct;

    // Create salary log
    const statusValue = (paymentStatus as PaymentStatus) || PaymentStatus.PENDING;
    const paidAtValue = statusValue === PaymentStatus.PAID ? (paidAt ? new Date(paidAt) : new Date()) : null;

    const newSalary = await prisma.salary.create({
      data: {
        employeeId: empId,
        companyId: compId,
        month: mth,
        year: yr,
        basicSalary: basic,
        allowances: allow,
        bonus: bon,
        deductions: deduct,
        netSalary,
        paymentStatus: statusValue,
        paidAt: paidAtValue,
      },
    });

    return NextResponse.json(newSalary, { status: 201 });
  } catch (error) {
    console.error("POST /api/salaries error:", error);
    return NextResponse.json(
      { error: "Failed to create salary record" },
      { status: 500 }
    );
  }
}
