"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useCompany } from "@/context/CompanyContext";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  Users,
  Tag,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  Building,
  Loader2,
  AlertTriangle,
  Briefcase,
  Layers,
  DollarSign,
} from "lucide-react";

interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  joiningDate: string;
  status: string;
  companyId: number;
  designationId: number;
  managerId?: number | null;
  createdAt: string;
  updatedAt: string;
  designation?: { title: string };
  manager?: { id: number; firstName: string; lastName: string; employeeCode: string } | null;
}

interface Designation {
  id: number;
  title: string;
}

interface ProjectAssignment {
  id: number;
  role: string;
  project: { name: string; status: string };
}

interface SalaryRecord {
  id: number;
  month: number;
  year: number;
  netSalary: number;
  paymentStatus: string;
}

interface DetailedProfile extends Employee {
  subordinates: { id: number; firstName: string; lastName: string; employeeCode: string; status: string }[];
  salaries: SalaryRecord[];
  projects: ProjectAssignment[];
  company: { name: string };
}

/**
 * Employee Directory & Profile Management Page
 * Scopes directory by globally selected company.
 * Implements search, filters, full profile inspection, and add/edit forms.
 */
export default function EmployeesPage() {
  const { selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter States
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchText, setSearchText] = useState("");

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Profile Detail Modal (Eye Icon) States
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [profileDetail, setProfileDetail] = useState<DetailedProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Form Field States (Split into Personal, Company, and Manager sections)
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [designationId, setDesignationId] = useState("");
  const [managerId, setManagerId] = useState("");

  // Fetch employees list using filters and search
  const fetchEmployees = async () => {
    if (!selectedCompanyId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/employees?companyId=${selectedCompanyId}`;
      if (filterDesignation) url += `&designationId=${filterDesignation}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (searchText.trim() !== "") url += `&search=${encodeURIComponent(searchText.trim())}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || "Failed to load employee list");
    } finally {
      setLoading(false);
    }
  };

  // Fetch designations to populate dropdown selectors
  const fetchDesignationsList = async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await fetch(`/api/designations?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const data = await res.json();
        setDesignations(data);
      }
    } catch (err) {
      console.error("Failed to load designations list", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDesignationsList();
  }, [selectedCompanyId, filterDesignation, filterStatus]);

  // Handle manual trigger for text search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
  };

  // Clear feedback alerts automatically
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Open modal for creating a new employee
  const handleOpenCreate = () => {
    setFormType("create");
    setSelectedEmp(null);
    setEmployeeCode("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setJoiningDate(new Date().toISOString().split("T")[0]); // Default to today
    setStatus("ACTIVE");
    setDesignationId("");
    setManagerId("");
    setIsFormOpen(true);
  };

  // Open modal for editing employee
  const handleOpenEdit = (emp: Employee) => {
    setFormType("edit");
    setSelectedEmp(emp);
    setEmployeeCode(emp.employeeCode);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone);
    setAddress(emp.address);
    setJoiningDate(new Date(emp.joiningDate).toISOString().split("T")[0]);
    setStatus(emp.status);
    setDesignationId(emp.designationId.toString());
    setManagerId(emp.managerId ? emp.managerId.toString() : "");
    setIsFormOpen(true);
  };

  // Open detailed profile drawer/modal (Eye Icon)
  const handleOpenDetail = async (emp: Employee) => {
    setIsDetailOpen(true);
    setLoadingProfile(true);
    setProfileDetail(null);
    
    try {
      const res = await fetch(`/api/employees/${emp.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfileDetail(data);
      }
    } catch (err) {
      console.error("Failed to fetch detailed profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Submit form data
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      address,
      joiningDate: new Date(joiningDate).toISOString(),
      status,
      companyId: selectedCompanyId,
      designationId: parseInt(designationId, 10),
      managerId: managerId ? parseInt(managerId, 10) : null,
    };

    try {
      let res;
      if (formType === "create") {
        res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/employees/${selectedEmp?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during submission");
      }

      setSuccess(`Employee record ${formType === "create" ? "created" : "updated"} successfully!`);
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message || "Failed to submit employee details");
    }
  };

  // Delete employee record
  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setSuccess("Employee record deleted successfully.");
      fetchEmployees();
    } catch (err: any) {
      setError(err.message || "Failed to delete employee");
    }
  };

  // filter prospective managers (employees belonging to same company, excluding self on edit)
  const prospectiveManagers = employees.filter(
    (emp) => formType === "create" || emp.id !== selectedEmp?.id
  );

  const breadcrumbs = [{ label: "Employees" }];

  return (
    <DashboardShell pageTitle="Employee Directory" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Alerts for feedback */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-sm font-medium animate-fade-in">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm font-medium animate-fade-in flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Company selector check */}
        {!selectedCompanyId && !contextLoading ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h4 className="font-bold text-lg mb-1">Company Scope Required</h4>
            <p className="text-sm text-amber-700 max-w-md mx-auto">
              Please select a company in the top navbar to view and manage employees.
            </p>
          </div>
        ) : (
          <>
            {/* Filter and control panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Dynamic Filtering Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar Form */}
                <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search name, code, email..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 placeholder-slate-400"
                  />
                  <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* Designation filter select */}
                <select
                  value={filterDesignation}
                  onChange={(e) => setFilterDesignation(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Designations</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>

                {/* Status filter select */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>

              {/* Add Employee CTA */}
              <button
                onClick={handleOpenCreate}
                className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm self-start md:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>

            {/* Employee Directory table card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                  <span className="text-sm font-medium">Loading employee list...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">No employees found matching the filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Designation</th>
                        <th className="px-6 py-4">Manager</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                              {emp.firstName.substring(0, 1)}
                              {emp.lastName.substring(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-xs text-slate-400">{emp.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-650">{emp.employeeCode}</td>
                          <td className="px-6 py-4 text-slate-550">{emp.designation?.title || "-"}</td>
                          <td className="px-6 py-4 text-slate-550">
                            {emp.manager ? (
                              <span className="font-medium text-slate-700">
                                {emp.manager.firstName} {emp.manager.lastName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                emp.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                  : emp.status === "ON_LEAVE"
                                  ? "bg-amber-50 text-amber-800 border border-amber-100"
                                  : emp.status === "INACTIVE"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-red-50 text-red-850 border border-red-150"
                              }`}
                            >
                              {emp.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenDetail(emp)}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* 1. ADD / EDIT EMPLOYEE FORM MODAL */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">
                  {formType === "create" ? "Register Employee" : "Edit Employee Details"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - Structured grid matching screens */}
              <form onSubmit={handleFormSubmit}>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* CARD 1: PERSONAL DETAIL CARD */}
                    <div className="bg-white p-6 rounded-xl border border-slate-150 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                        <Users className="w-5 h-5 text-cyan-600" />
                        <h4 className="font-bold text-slate-800 text-sm">Personal Details</h4>
                      </div>
                      
                      {/* Name Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Official Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john.doe@company.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 555-0199"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Residential Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. 123 Elm St, Quincy, MA"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN CARD: COMPANY DETAIL */}
                    <div className="space-y-6">
                      {/* CARD 2: COMPANY DETAIL */}
                      <div className="bg-white p-6 rounded-xl border border-slate-150 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                          <Building className="w-5 h-5 text-cyan-600" />
                          <h4 className="font-bold text-slate-800 text-sm">Company Details</h4>
                        </div>

                        {/* Code and Join date */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Employee Code *
                            </label>
                            <input
                              type="text"
                              required
                              value={employeeCode}
                              onChange={(e) => setEmployeeCode(e.target.value)}
                              placeholder="e.g. EMP-009"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Joining Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={joiningDate}
                              onChange={(e) => setJoiningDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Role Designation selector */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Assign Designation *
                          </label>
                          <select
                            required
                            value={designationId}
                            onChange={(e) => setDesignationId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 cursor-pointer"
                          >
                            <option value="">-- Select Designation --</option>
                            {designations.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Employment status selector */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Employment Status
                          </label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="ON_LEAVE">ON LEAVE</option>
                            <option value="TERMINATED">TERMINATED</option>
                          </select>
                        </div>
                      </div>

                      {/* CARD 3: MANAGER DETAIL */}
                      <div className="bg-white p-6 rounded-xl border border-slate-150 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                          <UserCheck className="w-5 h-5 text-cyan-600" />
                          <h4 className="font-bold text-slate-800 text-sm">Manager Assignment</h4>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Reporting Manager (Optional)
                          </label>
                          <select
                            value={managerId}
                            onChange={(e) => setManagerId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 cursor-pointer"
                          >
                            <option value="">-- Direct Reports to None --</option>
                            {prospectiveManagers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.firstName} {m.lastName} ({m.employeeCode})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    {formType === "create" ? "Save Employee" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. EYE ICON: DETAILED PROFILE VIEW MODAL */}
        {isDetailOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-100 overflow-hidden animate-zoom-in">
              
              {/* Header profile banner */}
              <div className="bg-gradient-to-r from-cyan-800 to-teal-900 px-6 py-6 text-white flex justify-between items-start">
                {loadingProfile ? (
                  <div className="h-16 flex items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-200" />
                    <span>Loading profile details...</span>
                  </div>
                ) : profileDetail ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/10 text-cyan-200 flex items-center justify-center font-bold text-2xl border border-white/20">
                      {profileDetail.firstName[0]}
                      {profileDetail.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl leading-tight">
                        {profileDetail.firstName} {profileDetail.lastName}
                      </h3>
                      <div className="text-cyan-200 text-xs mt-1 flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded font-mono font-bold">
                          {profileDetail.employeeCode}
                        </span>
                        <span>•</span>
                        <span>{profileDetail.designation?.title || "No Title"}</span>
                        <span>•</span>
                        <span className="font-medium">{profileDetail.company.name}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">Profile loading failed.</div>
                )}
                
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body sections */}
              {profileDetail && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                  
                  {/* Left Column: Basic Details */}
                  <div className="space-y-4 md:col-span-1 border-r border-slate-100 pr-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">
                      Personal Info
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2.5 text-xs text-slate-700">
                        <Mail className="w-4 h-4 text-slate-450 flex-shrink-0" />
                        <span className="break-all">{profileDetail.email}</span>
                      </div>
                      <div className="flex gap-2.5 text-xs text-slate-700">
                        <Phone className="w-4 h-4 text-slate-450 flex-shrink-0" />
                        <span>{profileDetail.phone}</span>
                      </div>
                      <div className="flex gap-2.5 text-xs text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-450 flex-shrink-0" />
                        <span className="leading-relaxed">{profileDetail.address}</span>
                      </div>
                      <div className="flex gap-2.5 text-xs text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-450 flex-shrink-0" />
                        <span>Joined: {new Date(profileDetail.joiningDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2.5 text-xs text-slate-700">
                        <Layers className="w-4 h-4 text-slate-450 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">
                          Status: {profileDetail.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Reporting structure */}
                    <div className="pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">
                        Reporting Line
                      </h4>
                      <div className="text-xs">
                        <div className="text-[10px] text-slate-400 font-semibold mb-1">Reports To:</div>
                        {profileDetail.manager ? (
                          <div className="font-medium text-slate-800">
                            {profileDetail.manager.firstName} {profileDetail.manager.lastName}{" "}
                            <span className="text-[10px] text-slate-400">({profileDetail.manager.employeeCode})</span>
                          </div>
                        ) : (
                          <span className="text-slate-450 italic">Top Management (No Manager)</span>
                        )}
                      </div>

                      <div className="text-xs">
                        <div className="text-[10px] text-slate-400 font-semibold mb-1">Subordinates count:</div>
                        <span className="font-bold text-slate-750">{profileDetail.subordinates.length} employees</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Projects */}
                  <div className="space-y-4 md:col-span-1 border-r border-slate-100 pr-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-slate-400" /> Project Allocations
                    </h4>

                    {profileDetail.projects.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Not allocated to any projects.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto">
                        {profileDetail.projects.map((item) => (
                          <div key={item.id} className="p-3 bg-white rounded-lg border border-slate-150">
                            <div className="font-semibold text-xs text-slate-800">{item.project.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Role: {item.role}</div>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                {item.project.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Salary History */}
                  <div className="space-y-4 md:col-span-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-slate-400" /> Payroll History
                    </h4>

                    {profileDetail.salaries.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No payroll records logged.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {profileDetail.salaries.map((sal) => (
                          <div key={sal.id} className="p-2.5 bg-white rounded-lg border border-slate-150 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-slate-800">
                                Month: {sal.month}/{sal.year}
                              </div>
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                                  sal.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : sal.paymentStatus === "PENDING"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-red-50 text-red-800"
                                }`}
                              >
                                {sal.paymentStatus}
                              </span>
                            </div>
                            <div className="font-extrabold text-slate-850">
                              ${sal.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Close Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
