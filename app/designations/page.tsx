"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useCompany } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Tag,
  Loader2,
  AlertTriangle,
  Users,
  Briefcase,
} from "lucide-react";

interface Designation {
  id: number;
  title: string;
  description?: string | null;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  company?: { name: string };
}

interface EmployeeSummary {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  status: string;
}

/**
 * Designation Management Page
 * Handles CRUD operations for designations scoped by the globally selected company.
 */
export default function DesignationsPage() {
  const { selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const { canManage } = useAuth();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [selectedDesig, setSelectedDesig] = useState<Designation | null>(null);

  // Detail Modal (Eye Icon) States
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [detailDesig, setDetailDesig] = useState<Designation | null>(null);
  const [assignedEmployees, setAssignedEmployees] = useState<EmployeeSummary[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);

  // Custom Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Fetch designations for the selected company
  const fetchDesignations = async () => {
    if (!selectedCompanyId) {
      setDesignations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/designations?companyId=${selectedCompanyId}`);
      if (!res.ok) throw new Error("Failed to load designations");
      const data = await res.json();
      setDesignations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load designations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, [selectedCompanyId]);

  // Clear success/error notifications automatically
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Open modal for creating a designation
  const handleOpenCreate = () => {
    setFormType("create");
    setSelectedDesig(null);
    setTitle("");
    setDescription("");
    setIsFormOpen(true);
  };

  // Open modal for editing a designation
  const handleOpenEdit = (desig: Designation) => {
    setFormType("edit");
    setSelectedDesig(desig);
    setTitle(desig.title);
    setDescription(desig.description || "");
    setIsFormOpen(true);
  };

  // Open modal to view details (Eye Icon) and fetch assigned employees
  const handleOpenDetail = async (desig: Designation) => {
    setDetailDesig(desig);
    setIsDetailOpen(true);
    setLoadingEmployees(true);
    
    try {
      // Query employees filtered by company and this specific designation
      const res = await apiFetch(`/api/employees?companyId=${selectedCompanyId}&designationId=${desig.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignedEmployees(data);
      }
    } catch (err) {
      console.error("Error loading assigned employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Submit create or edit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      title,
      description: description || null,
      companyId: selectedCompanyId,
    };

    try {
      let res;
      if (formType === "create") {
        res = await apiFetch("/api/designations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch(`/api/designations/${selectedDesig?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during submission");
      }

      setSuccess(`Designation ${formType === "create" ? "created" : "updated"} successfully!`);
      setIsFormOpen(false);
      fetchDesignations();
    } catch (err: any) {
      setError(err.message || "Failed to submit designation details");
    }
  };

  // Trigger custom confirmation modal instead of browser alert
  const handleDeleteDesignation = (id: number) => {
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
      const res = await apiFetch(`/api/designations/${deleteTargetId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setSuccess("Designation deleted successfully.");
      fetchDesignations();
    } catch (err: any) {
      setError(err.message || "Failed to delete designation");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const breadcrumbs = [{ label: "Designations" }];

  return (
    <DashboardShell pageTitle="Designations Management" breadcrumbs={breadcrumbs}>
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

        {/* Company Selector check */}
        {!selectedCompanyId && !contextLoading ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h4 className="font-bold text-lg mb-1">Company Scope Required</h4>
            <p className="text-sm text-amber-700 max-w-md mx-auto">
              Please select a company in the top navbar to scope and manage designations.
            </p>
          </div>
        ) : (
          <>
            {/* Header control panel */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500 font-medium">
                Showing roles for <span className="font-bold text-slate-700">{selectedCompany?.name}</span>
              </div>
              {canManage && (
                <button
                  onClick={handleOpenCreate}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Designation
                </button>
              )}
            </div>

            {/* Designations list card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                  <span className="text-sm font-medium">Loading designations...</span>
                </div>
              ) : designations.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">No designations added for this company yet.</p>
                  <button
                    onClick={handleOpenCreate}
                    className="mt-3 text-cyan-600 hover:text-cyan-700 font-semibold text-sm inline-flex items-center gap-1"
                  >
                    Create the first designation now <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Designation Title</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {designations.map((desig) => (
                        <tr key={desig.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{desig.title}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-md truncate">
                            {desig.description || "-"}
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenDetail(desig)}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => handleOpenEdit(desig)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => handleDeleteDesignation(desig.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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

        {/* 1. POPUP MODAL: CREATE / EDIT DESIGNATION FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">
                  {formType === "create" ? "Add Designation" : "Update Designation"}
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
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Designation Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
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
                      placeholder="Specify job responsibilities and role bounds..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Footer */}
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
                    {formType === "create" ? "Save Role" : "Update Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. EYE ICON: VIEW DESIGNATION DETAILS & ASSIGNED EMPLOYEES */}
        {isDetailOpen && detailDesig && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-gradient-to-r from-cyan-800 to-teal-900 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-cyan-200">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{detailDesig.title}</h3>
                    <span className="text-xs text-cyan-200">Designation Scope Details</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1 text-white/75 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details Body */}
              <div className="p-6 space-y-6">
                {/* Description metadata */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {detailDesig.description || "No description provided."}
                  </p>
                </div>

                {/* Assigned Employees List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" /> Active Team Assignments
                    </h4>
                    <span className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-100">
                      {assignedEmployees.length} employee(s)
                    </span>
                  </div>

                  {loadingEmployees ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                    </div>
                  ) : assignedEmployees.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      No employees are currently assigned to this designation.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {assignedEmployees.map((emp) => (
                        <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                          <div>
                            <div className="font-semibold text-sm text-slate-800">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">{emp.employeeCode}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                : "bg-slate-150 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Close Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Close Details
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
                  <AlertTriangle className="w-6 h-6 text-red-650" />
                </div>
                
                {/* Text Messages */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-lg">Confirm Delete</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete this designation? This action is permanent and cannot be undone.
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
