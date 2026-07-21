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
  FolderKanban,
  Calendar,
  Loader2,
  AlertTriangle,
  Users,
  Briefcase,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface ProjectEmployee {
  id: number;
  role: string;
  assignedAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

interface Project {
  id: number;
  name: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  employees: ProjectEmployee[];
}

/**
 * Project Management Page
 * Manages projects and their employee assignments for the selected company scope.
 */
export default function ProjectsPage() {
  const { selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [selectedProj, setSelectedProj] = useState<Project | null>(null);

  // Detail Modal (Eye Icon) and Team Assignment States
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // Custom Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Form Fields State (Project Metadata)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("PLANNED");

  // Team Assignment Form Fields State
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignRole, setAssignRole] = useState("");
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Fetch company projects matching filters
  const fetchProjects = async () => {
    if (!selectedCompanyId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let url = `/api/projects?companyId=${selectedCompanyId}`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data);

      // Keep detail dialog in sync if open
      if (isDetailOpen && detailProject) {
        const updatedDetail = data.find((p: Project) => p.id === detailProject.id);
        if (updatedDetail) setDetailProject(updatedDetail);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees to populate team member assignment dropdowns
  const fetchEmployeesList = async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await fetch(`/api/employees?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load company employees", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployeesList();
  }, [selectedCompanyId, filterStatus]);

  // Clear notification alerts automatically
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Open modal for creating project
  const handleOpenCreate = () => {
    setFormType("create");
    setSelectedProj(null);
    setName("");
    setDescription("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setStatus("PLANNED");
    setIsFormOpen(true);
  };

  // Open modal for editing project
  const handleOpenEdit = (proj: Project) => {
    setFormType("edit");
    setSelectedProj(proj);
    setName(proj.name);
    setDescription(proj.description || "");
    setStartDate(new Date(proj.startDate).toISOString().split("T")[0]);
    setEndDate(proj.endDate ? new Date(proj.endDate).toISOString().split("T")[0] : "");
    setStatus(proj.status);
    setIsFormOpen(true);
  };

  // Open details and team assignment overlay (Eye Icon)
  const handleOpenDetail = (proj: Project) => {
    setDetailProject(proj);
    setAssignEmployeeId("");
    setAssignRole("");
    setAssignmentError(null);
    setIsDetailOpen(true);
  };

  // Submit project metadata
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      description: description || null,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      status,
      companyId: selectedCompanyId,
    };

    try {
      let res;
      if (formType === "create") {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/projects/${selectedProj?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            startDate: payload.startDate,
            endDate: payload.endDate,
            status,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during submission");
      }

      setSuccess(`Project ${formType === "create" ? "created" : "updated"} successfully!`);
      setIsFormOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to log project details");
    }
  };

  // Trigger custom confirmation modal instead of browser alert
  const handleDeleteProject = (id: number) => {
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
      const res = await fetch(`/api/projects/${deleteTargetId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setSuccess("Project deleted successfully.");
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    } finally {
      setDeleteTargetId(null);
    }
  };


  // Assign employee to project team
  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentError(null);
    if (!detailProject) return;

    const payload = {
      employeeId: parseInt(assignEmployeeId, 10),
      role: assignRole,
    };

    try {
      const res = await fetch(`/api/projects/${detailProject.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Assignment failed");
      }

      // Success: Clear fields and re-load projects to fetch updated team lists
      setAssignEmployeeId("");
      setAssignRole("");
      fetchProjects();
    } catch (err: any) {
      setAssignmentError(err.message || "Failed to assign member");
    }
  };

  // Remove employee from project team
  const handleRemoveEmployee = async (employeeId: number) => {
    if (!detailProject) return;
    if (!confirm("Are you sure you want to remove this employee from the project team?")) return;

    setAssignmentError(null);

    try {
      const res = await fetch(`/api/projects/${detailProject.id}/assign?employeeId=${employeeId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Removal failed");
      }

      // Success: Re-load projects to fetch updated team lists
      fetchProjects();
    } catch (err: any) {
      setAssignmentError(err.message || "Failed to remove member");
    }
  };

  const breadcrumbs = [{ label: "Projects" }];

  return (
    <DashboardShell pageTitle="Projects Board" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Alerts */}
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

        {/* Company Selector Scope verification */}
        {!selectedCompanyId && !contextLoading ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h4 className="font-bold text-lg mb-1">Company Scope Required</h4>
            <p className="text-sm text-amber-700 max-w-md mx-auto">
              Please select a company in the top navbar to view and manage projects.
            </p>
          </div>
        ) : (
          <>
            {/* Header controls panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Add Project CTA */}
              <button
                onClick={handleOpenCreate}
                className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm self-start md:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>

            {/* Projects list cards layout */}
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                <span className="text-sm font-medium">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white border border-slate-100 rounded-xl">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No projects added for this company yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-white rounded-xl border border-slate-150 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    
                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Name and status badge */}
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-extrabold text-slate-800 text-base">{proj.name}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            proj.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                              : proj.status === "IN_PROGRESS"
                              ? "bg-cyan-50 text-cyan-800 border border-cyan-100"
                              : proj.status === "PLANNED"
                              ? "bg-blue-50 text-blue-800 border border-blue-100"
                              : "bg-amber-50 text-amber-800 border border-amber-100"
                          }`}
                        >
                          {proj.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {proj.description || "No description provided."}
                      </p>

                      {/* Timeline */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-450">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {new Date(proj.startDate).toLocaleDateString()}
                          {proj.endDate ? ` to ${new Date(proj.endDate).toLocaleDateString()}` : " (Ongoing)"}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer controls */}
                    <div className="bg-slate-50/75 border-t border-slate-100 px-6 py-4 flex justify-between items-center text-xs">
                      {/* Active team size */}
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Users className="w-4 h-4 text-slate-400" /> {proj.employees.length} Members
                      </div>

                      {/* Action buttons */}
                      <div className="space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(proj)}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                          title="View team & allocate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(proj)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                          title="Edit details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 1. MODAL: CREATE / EDIT PROJECT FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">
                  {formType === "create" ? "Add New Project" : "Update Project Details"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit}>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. AWS Migration"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed project summary and deliverables..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 resize-none"
                    ></textarea>
                  </div>

                  {/* Start / End Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Project Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                    >
                      <option value="PLANNED">PLANNED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ON_HOLD">ON HOLD</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                </div>

                {/* Footer actions */}
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
                    {formType === "create" ? "Save Project" : "Update Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. EYE ICON: VIEW PROJECT DETAILS & TEAM MEMBERS ALLOCATION OVERLAY */}
        {isDetailOpen && detailProject && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-100 overflow-hidden animate-zoom-in grid grid-cols-1 md:grid-cols-2">
              
              {/* LEFT COLUMN: PROJECT DETAILS */}
              <div className="flex flex-col justify-between border-r border-slate-100">
                <div>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-cyan-800 to-teal-900 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10 text-cyan-200">
                        <FolderKanban className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight">{detailProject.name}</h3>
                        <span className="text-[10px] text-cyan-200">Metadata Details</span>
                      </div>
                    </div>
                  </div>

                  {/* Project description & timeline details */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h5>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed max-h-36 overflow-y-auto">
                        {detailProject.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Start Date</span>
                        <span className="font-semibold text-slate-700">
                          {new Date(detailProject.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">End Date</span>
                        <span className="font-semibold text-slate-700">
                          {detailProject.endDate ? new Date(detailProject.endDate).toLocaleDateString() : "Ongoing"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          detailProject.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            : detailProject.status === "IN_PROGRESS"
                            ? "bg-cyan-50 text-cyan-800 border border-cyan-100"
                            : "bg-blue-50 text-blue-800 border border-blue-100"
                        }`}
                      >
                        {detailProject.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer close button */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-start">
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="border border-slate-200 bg-white hover:bg-slate-100 text-slate-650 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    Close Panel
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: TEAM ASSIGNMENT & REMOVAL INTERFACE */}
              <div className="flex flex-col justify-between bg-slate-50/50">
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Users className="w-4.5 h-4.5 text-cyan-600" /> Allocate Team Members
                    </h4>
                  </div>

                  {/* Allocations errors */}
                  {assignmentError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{assignmentError}</span>
                    </div>
                  )}

                  {/* Allocation Add Form */}
                  <form onSubmit={handleAssignEmployee} className="space-y-3 p-3 bg-white border border-slate-150 rounded-xl">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Member</h5>
                    
                    {/* Choose employee */}
                    <select
                      required
                      value={assignEmployeeId}
                      onChange={(e) => setAssignEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 cursor-pointer"
                    >
                      <option value="">-- Choose Employee --</option>
                      {/* Filter out employees who are already assigned to this project */}
                      {employees
                        .filter((emp) => !detailProject.employees.some((pe) => pe.employee.id === emp.id))
                        .map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </option>
                        ))}
                    </select>

                    {/* Role specification */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={assignRole}
                        onChange={(e) => setAssignRole(e.target.value)}
                        placeholder="e.g. Backend Lead"
                        className="flex-grow bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                      <button
                        type="submit"
                        className="bg-cyan-700 hover:bg-cyan-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Assign
                      </button>
                    </div>
                  </form>

                  {/* List of currently assigned team members */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Team ({detailProject.employees.length})
                    </h5>

                    {detailProject.employees.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        No team members allocated to this project.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {detailProject.employees.map((pe) => (
                          <div key={pe.id} className="bg-white border border-slate-150 p-2.5 rounded-lg flex justify-between items-center text-xs shadow-sm hover:border-slate-300 transition-colors">
                            <div>
                              <div className="font-bold text-slate-800">
                                {pe.employee.firstName} {pe.employee.lastName}
                              </div>
                              <div className="text-[10px] text-slate-450 mt-0.5">Role: {pe.role}</div>
                            </div>
                            <button
                              onClick={() => handleRemoveEmployee(pe.employee.id)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Remove from project"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side spacer */}
                <div className="h-16"></div>
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
                  <AlertTriangle className="w-6 h-6 text-red-650" />
                </div>
                
                {/* Text Messages */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-lg">Confirm Delete</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete this project? This will also remove all team assignments and cannot be undone.
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
                  className="border border-slate-200 bg-white text-slate-655 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAction}
                  className="bg-red-655 hover:bg-red-755 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
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
