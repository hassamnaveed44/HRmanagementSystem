# Multi-Company HR Management System (Breez HR)

A database-backed HR Management System built in Next.js 14+ (App Router) using TypeScript, Prisma ORM, and PostgreSQL. It isolates designation, employee, project, and payroll (salary history) data independently across multiple companies. The admin user interface matches a premium dashboard styling with deep teal themes, sidebar navigation, top header, status badges, dynamic forms, and modal profile details (Eye Icon).

---

## Technical Stack
* **Framework**: Next.js (App Router, TS, Tailwind CSS)
* **Database Client**: Prisma ORM (v7.9.0) with PostgreSQL native driver adapter
* **Database**: PostgreSQL (Target database: `HRsystemdb`)
* **UI Components**: Tailwind CSS, Lucide Icons

---

## Core Modules & Features

### 1. Company Scope Isolation
* Fully scopes employees, designations, salaries, and projects to the active company selected in the top navbar.
* Prevents data leakage between organizations.
* **Business Rule**: A company cannot be deleted if it has related designations, employees, projects, or salaries (`onDelete: Restrict`).

### 2. Designation Management
* CRUD operations for designations scoped by the active company.
* **Business Rule**: Prevents deletion of designations currently assigned to one or more active employees.

### 3. Employee Directory
* Searchable and filterable table (by designation, status, and fuzzy text search on name, code, email).
* **Profile Detail (Eye Icon)**: Triggers an overlay displaying personal info, manager/reporting lines, active project assignments, and payroll history.
* **Forms**: Split into Personal Details card, Company Details card, and Manager Selection dropdown.
* **Business Rules**:
  * Employee `email` and `employeeCode` must be unique.
  * Selected Designation and Reporting Manager must belong to the same company.
  * An employee cannot be assigned as their own manager.

### 4. Salaries & Payroll Logs
* Monthly salary history ledger.
* **Live Calculation**: Interactive form computes the net salary on the fly:  
  $$\text{netSalary} = \text{basicSalary} + \text{allowances} + \text{bonus} - \text{deductions}$$
* **Business Rules**:
  * Only one salary slip can exist for an employee in a given month and year (composite unique constraint).
  * Salary record must belong to the employee's company.

### 5. Projects Board & Teams Assignment
* Scoped projects board with status filters.
* **Team Allocation Interface (Eye Icon)**: View project info, assign employees of the same company with defined roles, and remove members.
* **Business Rules**:
  * Projects can only contain employees belonging to the same company.
  * Employees cannot be assigned to the same project twice.

---

## Local Setup & Installation

Follow these steps to run the project locally:

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/hassamnaveed44/HRmanagementSystem.git
cd HRmanagementSystem
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:%23pOst@localhost:5432/HRsystemdb?schema=public"
```
*(Ensure the username/password and target database name `HRsystemdb` match your local PostgreSQL instance).*

### 3. Setup Database Schema & Migrations
Prisma v7 uses `prisma.config.ts` for database connections. Run the migrations to synchronize your database:
```bash
npx prisma migrate dev --name init
```

### 4. Seed Mock Data
Apply seed records (2 companies, 6 designations, 12 employees, 4 projects, 10 salaries, and project allocations):
```bash
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Database ERD & Schema

Prisma models and relationships are defined as follows:

```prisma
model Company {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  phone     String
  address   String?
  website   String?
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  designations Designation[]
  employees    Employee[]
  projects     Project[]
  salaries     Salary[]
}

model Designation {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  companyId   Int
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Restrict)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employees Employee[]
}

model Employee {
  id            Int            @id @default(autoincrement())
  employeeCode  String         @unique
  firstName     String
  lastName      String
  email         String         @unique
  phone         String
  address       String
  joiningDate   DateTime
  status        EmployeeStatus @default(ACTIVE)
  companyId     Int
  company       Company        @relation(fields: [companyId], references: [id], onDelete: Restrict)
  designationId Int
  designation   Designation    @relation(fields: [designationId], references: [id], onDelete: Restrict)
  managerId     Int?
  manager       Employee?      @relation("EmployeeManager", fields: [managerId], references: [id], onDelete: Restrict)
  subordinates  Employee[]     @relation("EmployeeManager")
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  salaries     Salary[]
  projects     ProjectEmployee[]
}

model Salary {
  id            Int           @id @default(autoincrement())
  employeeId    Int
  employee      Employee      @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  companyId     Int
  company       Company       @relation(fields: [companyId], references: [id], onDelete: Restrict)
  month         Int
  year          Int
  basicSalary   Float
  allowances    Float
  bonus         Float
  deductions    Float
  netSalary     Float
  paymentStatus PaymentStatus @default(PENDING)
  paidAt        DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([employeeId, month, year])
}

model Project {
  id          Int           @id @default(autoincrement())
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime?
  status      ProjectStatus @default(PLANNED)
  companyId   Int
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Restrict)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  employees   ProjectEmployee[]
}

model ProjectEmployee {
  id         Int      @id @default(autoincrement())
  projectId  Int
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employeeId Int
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  role       String
  assignedAt DateTime @default(now())

  @@unique([projectId, employeeId])
}
```

---

## API Documentation

All routes return JSON responses with standard status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Server Error`).

### 1. Companies (`/api/companies`)
* **GET `/api/companies`**: Fetch all registered companies.
* **POST `/api/companies`**: Add a company.
  * Request Body:
    ```json
    {
      "name": "TechCorp Solutions",
      "email": "info@techcorp.com",
      "phone": "+1-555-0100",
      "address": "Silicon Valley",
      "website": "https://techcorp.com",
      "status": "ACTIVE"
    }
    ```
* **PUT `/api/companies/[id]`**: Update metadata.
* **DELETE `/api/companies/[id]`**: Deletes company. Rejects `409` if references exist.

### 2. Designations (`/api/designations`)
* **GET `/api/designations?companyId=1`**: Fetch company-specific designations.
* **POST `/api/designations`**: Register designation.
  * Request Body:
    ```json
    {
      "title": "Lead Software Architect",
      "description": "Designs core stack patterns",
      "companyId": 1
    }
    ```
* **DELETE `/api/designations/[id]`**: Deletes designation. Rejects `409` if assigned to employees.

### 3. Employees (`/api/employees`)
* **GET `/api/employees?companyId=1&designationId=2&status=ACTIVE&search=dev`**: Get scoped employees matching search/filter bounds.
* **POST `/api/employees`**: Create employee (validates company match for manager & designation).
  * Request Body:
    ```json
    {
      "employeeCode": "EMP-013",
      "firstName": "Hassam",
      "lastName": "Naveed",
      "email": "hassam@company.com",
      "phone": "+92300000000",
      "address": "Islamabad, PK",
      "joiningDate": "2026-07-21T00:00:00.000Z",
      "status": "ACTIVE",
      "companyId": 1,
      "designationId": 2,
      "managerId": 1
    }
    ```
* **GET `/api/employees/[id]`**: Detailed profiles (manager, subordinates, projects, salaries).

### 4. Salary Logs (`/api/salaries`)
* **GET `/api/salaries?companyId=1&employeeId=2&month=7&year=2026`**: Fetch and filter salary slips.
* **POST `/api/salaries`**: Log monthly salary slip. (Calculates `netSalary` on backend).
  * Request Body:
    ```json
    {
      "employeeId": 1,
      "companyId": 1,
      "month": 7,
      "year": 2026,
      "basicSalary": 10000,
      "allowances": 1500,
      "bonus": 500,
      "deductions": 200,
      "paymentStatus": "PENDING"
    }
    ```

### 5. Projects (`/api/projects`)
* **GET `/api/projects?companyId=1&status=IN_PROGRESS`**: List company projects.
* **POST `/api/projects/[id]/assign`**: Assign an employee to a project (verifies company match).
  * Request Body:
    ```json
    {
      "employeeId": 2,
      "role": "QA Lead"
    }
    ```
* **DELETE `/api/projects/[id]/assign?employeeId=2`**: Remove team member.
