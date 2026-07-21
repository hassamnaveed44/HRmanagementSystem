"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useCompany } from "@/context/CompanyContext";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
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
  X,
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
 * Employee Management Page
 * Styled exactly like the screenshot:
 * - Filter fields row: Employee Name | Employee ID | Employee Designation | Filters button (#00C1C1) | Add Employee (#00A2CA)
 * - Table layout: Employee ID | Name | Email | Department | Designation | Mobile No | Date Of Joining | Action
 * - Action circles: Eye (light purple), Edit (light teal), Delete (light red)
 * - Pagination component bottom right
 */
export default function EmployeesPage() {
  const { selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter Input States
  const [employeeNameInput, setEmployeeNameInput] = useState("");
  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [employeeDesigInput, setEmployeeDesigInput] = useState("");

  // API Applied Filter States
  const [appliedName, setAppliedName] = useState("");
  const [appliedId, setAppliedId] = useState("");
  const [appliedDesig, setAppliedDesig] = useState("");

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Profile Detail Modal (Eye Icon) States
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [profileDetail, setProfileDetail] = useState<DetailedProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Custom Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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

  // Avatar photos mapping to simulate database employee profiles
  const avatarPhotos: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", // John Doe
    2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", // Jane Smith
    3: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150", // Alice Johnson
    4: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150", // Bob Brown
    5: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150", // Charlie Green
    6: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", // David White
    7: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150", // Sarah Connor
    8: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", // Kyle Reese
    9: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", // Ellen Ripley
    10: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150", // John Connor
    11: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150", // Marcus Wright
    12: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150", // T-800
  };

  // Helper: Format joining date matching '1 March, 2023'
  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Fetch employees list from the scoped API
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
      if (employeeDesigInput) url += `&designationId=${employeeDesigInput}`;
      
      // Fuzzy search on name or code
      let searchParams: string[] = [];
      if (employeeNameInput) searchParams.push(employeeNameInput);
      if (employeeIdInput) searchParams.push(employeeIdInput);
      
      if (searchParams.length > 0) {
        url += `&search=${encodeURIComponent(searchParams.join(" "))}`;
      }

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
  }, [selectedCompanyId, employeeNameInput, employeeIdInput, employeeDesigInput]);

  // Apply filters manually on button click (fallback/optional refresh)
  const handleApplyFilters = () => {
    fetchEmployees();
  };

  // Clear notifications
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

  // Open detailed profile dialog (Eye Icon)
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

  // Trigger custom confirmation modal instead of browser alert
  const handleDeleteEmployee = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  // Perform API deletion after user clicks Confirm on the modal
  const confirmDeleteAction = async () => {
    if (!deleteTargetId) return;
    setIsDeleteConfirmOpen(false);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/employees/${deleteTargetId}`, {
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
    } finally {
      setDeleteTargetId(null);
    }
  };

  // Managers dropdown list filter
  const prospectiveManagers = employees.filter(
    (emp) => formType === "create" || emp.id !== selectedEmp?.id
  );

  const breadcrumbs = [{ label: "Employee" }];

  return (
    <DashboardShell pageTitle="Employee Directory" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        
        {/* Alerts for user feedback */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-xs font-semibold animate-fade-in shadow-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-xs font-semibold animate-fade-in flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Company scope required check */}
        {!selectedCompanyId && !contextLoading ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-8 text-center shadow-sm">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h4 className="font-bold text-base mb-1">Company Scope Required</h4>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              Please select a company in the top navbar to view and manage employees.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. FILTER CONTROLS ROW: Styled exactly like the screenshot */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-grow w-full xl:w-auto">
                {/* Employee Name filter input */}
                <div>
                  <input
                    type="text"
                    value={employeeNameInput}
                    onChange={(e) => setEmployeeNameInput(e.target.value)}
                    placeholder="Employee Name"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A2CA] text-slate-700 placeholder-slate-400"
                  />
                </div>

                {/* Employee ID filter input */}
                <div>
                  <input
                    type="text"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value)}
                    placeholder="Employee ID"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A2CA] text-slate-700 placeholder-slate-400"
                  />
                </div>

                {/* Employee Designation filter select */}
                <div>
                  <select
                    value={employeeDesigInput}
                    onChange={(e) => setEmployeeDesigInput(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00A2CA] cursor-pointer"
                  >
                    <option value="">Employee Designation</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                {/* Filters button (Cyan-teal #00C1C1) */}
                <button
                  onClick={handleApplyFilters}
                  className="bg-[#00C1C1] hover:bg-[#00b2b2] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap min-w-[90px]"
                >
                  Filters
                </button>

                {/* Add Employee button (#00A2CA) */}
                <button
                  onClick={handleOpenCreate}
                  className="bg-[#00A2CA] hover:bg-[#0092B6] text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Employee
                </button>
              </div>
            </div>

            {/* 2. EMPLOYEE DIRECTORY TABLE CARD: Styled matching screens */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[400px]">
              
              <div className="flex-grow">
                {loading ? (
                  <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00A2CA]" />
                    <span className="text-xs font-medium">Loading employee records...</span>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="text-xs font-semibold">No employees found matching the scope.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                          <th className="px-6 py-4">Employee ID</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Department</th>
                          <th className="px-6 py-4">Designation</th>
                          <th className="px-6 py-4">Mobile No</th>
                          <th className="px-6 py-4">Date Of Joining</th>
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                            {/* Employee ID (Prefix with #MZ-00X) */}
                            <td className="px-6 py-4 text-slate-500 font-semibold font-mono">
                              #MZ-{String(emp.id).padStart(3, "0")}
                            </td>

                            {/* Name with circular face avatar mapping */}
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img
                                src={
                                  avatarPhotos[emp.id] ||
                                  `https://i.pravatar.cc/150?img=${emp.id + 10}`
                                }
                                alt={emp.firstName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-150"
                              />
                              <span className="font-bold text-slate-800">
                                {emp.firstName} {emp.lastName}
                              </span>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 text-slate-500 font-normal">{emp.email}</td>

                            {/* Department (Simulated based on company id) */}
                            <td className="px-6 py-4 text-slate-500 font-semibold">
                              {emp.companyId === 1 ? "Technology" : "Medical Operations"}
                            </td>

                            {/* Designation */}
                            <td className="px-6 py-4 text-slate-650">{emp.designation?.title || "-"}</td>

                            {/* Mobile No */}
                            <td className="px-6 py-4 text-slate-500 font-normal">{emp.phone}</td>

                            {/* Date Of Joining (Formatted to 1 March, 2023 style) */}
                            <td className="px-6 py-4 text-slate-500 font-normal">
                              {formatJoinDate(emp.joiningDate)}
                            </td>

                            {/* Action Buttons styled as circles matching screenshot */}
                            <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                              {/* Eye icon in light purple box */}
                              <button
                                onClick={() => handleOpenDetail(emp)}
                                className="p-2 bg-[#e0e0ff] text-[#6366f1] hover:bg-[#d0d0ff] rounded-lg transition-colors inline-flex items-center"
                                title="View Profile Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              
                              {/* Edit icon in light teal box */}
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-2 bg-[#e2f9f3] text-[#00b5ad] hover:bg-[#d2f9f3] rounded-lg transition-colors inline-flex items-center"
                                title="Edit Profile"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Trash icon in light red box */}
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="p-2 bg-[#ffeae6] text-[#ef4444] hover:bg-[#ffd6d0] rounded-lg transition-colors inline-flex items-center"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. PAGINATION BLOCK: Styled matching screens */}
              {!loading && employees.length > 0 && (
                <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-end">
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded flex items-center justify-center transition-colors">
                      1
                    </button>
                    {/* Active page (2) styled with Blue bg #00A2CA */}
                    <button className="w-7 h-7 bg-[#00A2CA] text-white border border-[#00A2CA] text-xs font-bold rounded flex items-center justify-center transition-colors">
                      2
                    </button>
                    <button className="w-7 h-7 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded flex items-center justify-center transition-colors">
                      3
                    </button>
                    <button className="w-7 h-7 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded flex items-center justify-center transition-colors">
                      4
                    </button>
                    <button className="w-7 h-7 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded flex items-center justify-center transition-colors">
                      &rarr;
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 1. ADD / EDIT EMPLOYEE FORM MODAL */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-base">
                  {formType === "create" ? "Register Employee" : "Edit Employee Details"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - Structured grids */}
              <form onSubmit={handleFormSubmit}>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* CARD 1: PERSONAL DETAIL */}
                    <div className="bg-white p-6 rounded-xl border border-slate-150 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                        <Users className="w-4.5 h-4.5 text-[#00A2CA]" />
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Personal Details</h4>
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN CARD: COMPANY DETAIL */}
                    <div className="space-y-6">
                      
                      {/* CARD 2: COMPANY DETAIL */}
                      <div className="bg-white p-6 rounded-xl border border-slate-150 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                          <Building className="w-4.5 h-4.5 text-[#00A2CA]" />
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Company Details</h4>
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Role Designation Selector */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Assign Designation *
                          </label>
                          <select
                            required
                            value={designationId}
                            onChange={(e) => setDesignationId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800 cursor-pointer"
                          >
                            <option value="">-- Select Designation --</option>
                            {designations.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Status Select */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Employment Status
                          </label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800 cursor-pointer"
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
                          <UserCheck className="w-4.5 h-4.5 text-[#00A2CA]" />
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Manager Assignment</h4>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Reporting Manager (Optional)
                          </label>
                          <select
                            value={managerId}
                            onChange={(e) => setManagerId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A2CA] text-slate-800 cursor-pointer"
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
                    className="border border-slate-200 bg-white text-slate-650 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#00A2CA] hover:bg-[#0092B6] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
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
                    <img
                      src={
                        avatarPhotos[profileDetail.id] ||
                        `https://i.pravatar.cc/150?img=${profileDetail.id + 10}`
                      }
                      alt={profileDetail.firstName}
                      className="w-16 h-16 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <h3 className="font-extrabold text-xl leading-tight">
                        {profileDetail.firstName} {profileDetail.lastName}
                      </h3>
                      <div className="text-cyan-200 text-xs mt-1 flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded font-mono font-bold">
                          #MZ-{String(profileDetail.id).padStart(3, "0")}
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

              {/* Profile Details Body */}
              {profileDetail && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                  
                  {/* Left Column: Personal info */}
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

                  {/* Right Column: Salary history */}
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

        {/* 3. CUSTOM MODAL: DELETE CONFIRMATION POPUP */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-zoom-in">
              <div className="p-6 text-center space-y-4">
                {/* Warning Alert Icon */}
                <div className="w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                
                {/* Text Messages */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-lg">Confirm Delete</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete this employee? This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
              
              {/* Footer CTA Controls */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteTargetId(null);
                  }}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAction}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
