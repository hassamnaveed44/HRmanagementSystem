import { EmployeeStatus, PaymentStatus, ProjectStatus } from "@prisma/client";
import { prisma } from "../lib/db";

/**
 * Main seeding function that inserts initial data into the PostgreSQL database.
 * Establishes companies, designations, employees, managers, projects, assignments, and salary logs.
 */
async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing records in reverse dependency order to avoid foreign key constraints errors
  console.log("Cleaning existing database records...");
  await prisma.projectEmployee.deleteMany({});
  await prisma.salary.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.designation.deleteMany({});
  await prisma.company.deleteMany({});
  console.log("Clean complete.");

  // 2. Create Companies
  console.log("Creating companies...");
  const company1 = await prisma.company.create({
    data: {
      name: "TechCorp Solutions",
      email: "info@techcorp.com",
      phone: "+1-555-0100",
      address: "100 Silicon Valley Way, San Jose, CA",
      website: "https://techcorp.com",
      status: "ACTIVE",
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "HealthGroup International",
      email: "contact@healthgroup.org",
      phone: "+1-555-0200",
      address: "500 Medical Center Blvd, Boston, MA",
      website: "https://healthgroup.org",
      status: "ACTIVE",
    },
  });
  console.log(`Created 2 companies: ${company1.name} and ${company2.name}`);

  // 3. Create Designations (3 for TechCorp, 3 for HealthGroup)
  console.log("Creating designations...");
  // TechCorp Designations
  const desigTech1 = await prisma.designation.create({
    data: {
      title: "Engineering Manager",
      description: "Leads engineering departments and coordinates project teams",
      companyId: company1.id,
    },
  });

  const desigTech2 = await prisma.designation.create({
    data: {
      title: "Senior Developer",
      description: "Responsible for core application development and backend architecture",
      companyId: company1.id,
    },
  });

  const desigTech3 = await prisma.designation.create({
    data: {
      title: "Frontend Lead",
      description: "Designs, structures, and builds user interfaces and client features",
      companyId: company1.id,
    },
  });

  // HealthGroup Designations
  const desigHealth1 = await prisma.designation.create({
    data: {
      title: "Healthcare Administrator",
      description: "Directs facility operations, budgets, and compliance standards",
      companyId: company2.id,
    },
  });

  const desigHealth2 = await prisma.designation.create({
    data: {
      title: "Head Nurse",
      description: "Oversees clinical nursing schedules and patient care operations",
      companyId: company2.id,
    },
  });

  const desigHealth3 = await prisma.designation.create({
    data: {
      title: "Medical Director",
      description: "Supervises medical staff, clinical trials, and healthcare policies",
      companyId: company2.id,
    },
  });
  console.log("Created 6 designations (3 per company).");

  // 4. Create Employees
  console.log("Creating employees...");
  
  // --- TechCorp Employees ---
  // Engineering Manager (Manager 1)
  const empTechManager = await prisma.employee.create({
    data: {
      employeeCode: "EMP-TC-001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@techcorp.com",
      phone: "+1-555-1001",
      address: "12 Elm St, San Jose, CA",
      joiningDate: new Date("2020-01-15"),
      status: EmployeeStatus.ACTIVE,
      companyId: company1.id,
      designationId: desigTech1.id,
    },
  });

  // Subordinates for John Doe
  const empTech2 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-TC-002",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@techcorp.com",
      phone: "+1-555-1002",
      address: "34 Maple Ave, San Jose, CA",
      joiningDate: new Date("2021-03-10"),
      status: EmployeeStatus.ACTIVE,
      companyId: company1.id,
      designationId: desigTech2.id,
      managerId: empTechManager.id, // John Doe is manager
    },
  });

  const empTech3 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-TC-003",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice.johnson@techcorp.com",
      phone: "+1-555-1003",
      address: "56 Pine St, Santa Clara, CA",
      joiningDate: new Date("2022-05-20"),
      status: EmployeeStatus.ACTIVE,
      companyId: company1.id,
      designationId: desigTech3.id,
      managerId: empTechManager.id, // John Doe is manager
    },
  });

  const empTech4 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-TC-004",
      firstName: "Bob",
      lastName: "Brown",
      email: "bob.brown@techcorp.com",
      phone: "+1-555-1004",
      address: "78 Oak Dr, Cupertino, CA",
      joiningDate: new Date("2023-08-01"),
      status: EmployeeStatus.ACTIVE,
      companyId: company1.id,
      designationId: desigTech2.id,
      managerId: empTechManager.id, // John Doe is manager
    },
  });

  const empTech5 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-TC-005",
      firstName: "Charlie",
      lastName: "Green",
      email: "charlie.green@techcorp.com",
      phone: "+1-555-1005",
      address: "90 Cedar Rd, Sunnyvale, CA",
      joiningDate: new Date("2024-02-15"),
      status: EmployeeStatus.ON_LEAVE,
      companyId: company1.id,
      designationId: desigTech2.id,
      managerId: empTechManager.id, // John Doe is manager
    },
  });

  const empTech6 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-TC-006",
      firstName: "David",
      lastName: "White",
      email: "david.white@techcorp.com",
      phone: "+1-555-1006",
      address: "123 Redwood Ln, Milpitas, CA",
      joiningDate: new Date("2024-11-01"),
      status: EmployeeStatus.ACTIVE,
      companyId: company1.id,
      designationId: desigTech3.id,
      managerId: empTechManager.id, // John Doe is manager
    },
  });

  // --- HealthGroup Employees ---
  // Healthcare Administrator (Manager 2)
  const empHealthManager = await prisma.employee.create({
    data: {
      employeeCode: "EMP-HG-001",
      firstName: "Sarah",
      lastName: "Connor",
      email: "sconnor@healthgroup.org",
      phone: "+1-555-2001",
      address: "89 Bunker Rd, Boston, MA",
      joiningDate: new Date("2018-09-01"),
      status: EmployeeStatus.ACTIVE,
      companyId: company2.id,
      designationId: desigHealth1.id,
    },
  });

  // Subordinates for Sarah Connor
  const empHealth2 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-HG-002",
      firstName: "Kyle",
      lastName: "Reese",
      email: "kreese@healthgroup.org",
      phone: "+1-555-2002",
      address: "123 Resistance Way, Quincy, MA",
      joiningDate: new Date("2020-04-12"),
      status: EmployeeStatus.ACTIVE,
      companyId: company2.id,
      designationId: desigHealth2.id,
      managerId: empHealthManager.id, // Sarah Connor is manager
    },
  });

  const empHealth3 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-HG-003",
      firstName: "Ellen",
      lastName: "Ripley",
      email: "eripley@healthgroup.org",
      phone: "+1-555-2003",
      address: "42 Nostromo St, Cambridge, MA",
      joiningDate: new Date("2019-11-15"),
      status: EmployeeStatus.ACTIVE,
      companyId: company2.id,
      designationId: desigHealth3.id,
      managerId: empHealthManager.id, // Sarah Connor is manager
    },
  });

  const empHealth4 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-HG-004",
      firstName: "John",
      lastName: "Connor",
      email: "jconnor@healthgroup.org",
      phone: "+1-555-2004",
      address: "89 Bunker Rd, Boston, MA",
      joiningDate: new Date("2022-01-10"),
      status: EmployeeStatus.ACTIVE,
      companyId: company2.id,
      designationId: desigHealth2.id,
      managerId: empHealthManager.id, // Sarah Connor is manager
    },
  });

  const empHealth5 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-HG-005",
      firstName: "Marcus",
      lastName: "Wright",
      email: "mwright@healthgroup.org",
      phone: "+1-555-2005",
      address: "456 Project Angel Dr, Newton, MA",
      joiningDate: new Date("2023-05-18"),
      status: EmployeeStatus.INACTIVE,
      companyId: company2.id,
      designationId: desigHealth3.id,
      managerId: empHealthManager.id, // Sarah Connor is manager
    },
  });

  const empHealth6 = await prisma.employee.create({
    data: {
      employeeCode: "EMP-HG-006",
      firstName: "T-800",
      lastName: "Cyberdyne",
      email: "terminator@healthgroup.org",
      phone: "+1-555-2006",
      address: "101 Cyberdyne Systems Blvd, Waltham, MA",
      joiningDate: new Date("2024-01-01"),
      status: EmployeeStatus.ACTIVE,
      companyId: company2.id,
      designationId: desigHealth1.id,
      managerId: empHealthManager.id, // Sarah Connor is manager
    },
  });
  console.log("Created 12 employees (6 per company, containing 2 managers and 10 subordinates).");

  // 5. Create Projects (2 per company)
  console.log("Creating projects...");
  // TechCorp Projects
  const projTech1 = await prisma.project.create({
    data: {
      name: "Cloud Migration",
      description: "Migrating legacy core applications to AWS cloud infrastructure",
      startDate: new Date("2026-01-10"),
      status: ProjectStatus.IN_PROGRESS,
      companyId: company1.id,
    },
  });

  const projTech2 = await prisma.project.create({
    data: {
      name: "HR System Build",
      description: "Building the internal multi-company HR platform",
      startDate: new Date("2026-06-01"),
      status: ProjectStatus.IN_PROGRESS,
      companyId: company1.id,
    },
  });

  // HealthGroup Projects
  const projHealth1 = await prisma.project.create({
    data: {
      name: "Patient Portal Setup",
      description: "Configuring a self-service medical appointment and billing portal",
      startDate: new Date("2025-10-01"),
      status: ProjectStatus.COMPLETED,
      companyId: company2.id,
    },
  });

  const projHealth2 = await prisma.project.create({
    data: {
      name: "Clinic Expansion",
      description: "Building a secondary clinical care ward in South Boston",
      startDate: new Date("2026-07-01"),
      status: ProjectStatus.PLANNED,
      companyId: company2.id,
    },
  });
  console.log("Created 4 projects.");

  // 6. Assign Employees to Projects (ProjectEmployee junction entries)
  console.log("Assigning employees to projects...");
  
  // TechCorp Assignments (Cloud Migration)
  await prisma.projectEmployee.createMany({
    data: [
      { projectId: projTech1.id, employeeId: empTech2.id, role: "Backend Developer" },
      { projectId: projTech1.id, employeeId: empTech3.id, role: "Frontend Lead" },
      { projectId: projTech1.id, employeeId: empTech4.id, role: "System Administrator" },
    ],
  });

  // TechCorp Assignments (HR System Build)
  await prisma.projectEmployee.createMany({
    data: [
      { projectId: projTech2.id, employeeId: empTech3.id, role: "UI Architect" },
      { projectId: projTech2.id, employeeId: empTech5.id, role: "Fullstack Developer" },
      { projectId: projTech2.id, employeeId: empTech6.id, role: "QA Engineer" },
    ],
  });

  // HealthGroup Assignments (Patient Portal Setup)
  await prisma.projectEmployee.createMany({
    data: [
      { projectId: projHealth1.id, employeeId: empHealth2.id, role: "Lead System Configurator" },
      { projectId: projHealth1.id, employeeId: empHealth3.id, role: "Clinical Consultant" },
      { projectId: projHealth1.id, employeeId: empHealth4.id, role: "Data Integrity Specialist" },
    ],
  });

  // HealthGroup Assignments (Clinic Expansion)
  await prisma.projectEmployee.createMany({
    data: [
      { projectId: projHealth2.id, employeeId: empHealth5.id, role: "Operations Consultant" },
      { projectId: projHealth2.id, employeeId: empHealth6.id, role: "Structural Assistant" },
    ],
  });
  console.log("Assigned employees to projects successfully.");

  // 7. Create Salary Records (10 logs: 5 per company)
  console.log("Generating monthly salary records...");
  
  // Helper function to calculate net salary and save to database
  const makeSalary = (
    employeeId: number,
    companyId: number,
    month: number,
    year: number,
    basic: number,
    allow: number,
    bonus: number,
    deduct: number,
    status: PaymentStatus
  ) => {
    // Formula: netSalary = basicSalary + allowances + bonus - deductions
    const net = basic + allow + bonus - deduct;
    return {
      employeeId,
      companyId,
      month,
      year,
      basicSalary: basic,
      allowances: allow,
      bonus,
      deductions: deduct,
      netSalary: net,
      paymentStatus: status,
      paidAt: status === PaymentStatus.PAID ? new Date(`2026-07-28`) : null,
    };
  };

  // TechCorp Salaries (5 records)
  await prisma.salary.createMany({
    data: [
      makeSalary(empTechManager.id, company1.id, 7, 2026, 12000, 1500, 1000, 500, PaymentStatus.PAID),
      makeSalary(empTech2.id, company1.id, 7, 2026, 9000, 800, 500, 300, PaymentStatus.PAID),
      makeSalary(empTech3.id, company1.id, 7, 2026, 8500, 700, 400, 200, PaymentStatus.PAID),
      makeSalary(empTech4.id, company1.id, 7, 2026, 8000, 800, 0, 200, PaymentStatus.PENDING),
      makeSalary(empTech5.id, company1.id, 7, 2026, 8000, 0, 0, 100, PaymentStatus.CANCELLED),
    ],
  });

  // HealthGroup Salaries (5 records)
  await prisma.salary.createMany({
    data: [
      makeSalary(empHealthManager.id, company2.id, 7, 2026, 10500, 1200, 800, 450, PaymentStatus.PAID),
      makeSalary(empHealth2.id, company2.id, 7, 2026, 7000, 600, 300, 150, PaymentStatus.PENDING),
      makeSalary(empHealth3.id, company2.id, 7, 2026, 9500, 1000, 500, 350, PaymentStatus.PAID),
      makeSalary(empHealth4.id, company2.id, 7, 2026, 7000, 600, 200, 150, PaymentStatus.PAID),
      makeSalary(empHealth5.id, company2.id, 7, 2026, 8500, 0, 0, 300, PaymentStatus.CANCELLED),
    ],
  });
  console.log("Created 10 monthly salary records.");

  console.log("Seeding complete! Database successfully populated.");
}

// Execute the main seeding routine
main()
  .catch((e) => {
    console.error("Seeding failed with error: ", e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect Prisma client when seeding completes or crashes
    await prisma.$disconnect();
  });
