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
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string | null;
  website?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Company Management Component
 * Allows HR to list, view details (eye icon), create, update, and delete companies.
 */
export default function CompaniesPage() {
  const { refreshCompanies } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Detail Modal States
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Fetch all companies from the API
  const fetchCompaniesList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error("Failed to fetch companies list");
      const data = await res.json();
      setCompanies(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompaniesList();
  }, []);

  // Clear success/error messages after a delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Open modal for creating a new company
  const handleOpenCreate = () => {
    setFormType("create");
    setSelectedCompany(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setWebsite("");
    setStatus("ACTIVE");
    setIsFormOpen(true);
  };

  // Open modal for editing a company
  const handleOpenEdit = (company: Company) => {
    setFormType("edit");
    setSelectedCompany(company);
    setName(company.name);
    setEmail(company.email);
    setPhone(company.phone);
    setAddress(company.address || "");
    setWebsite(company.website || "");
    setStatus(company.status);
    setIsFormOpen(true);
  };

  // Open modal to view company details
  const handleOpenDetail = (company: Company) => {
    setDetailCompany(company);
    setIsDetailOpen(true);
  };

  // Submit create or edit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      email,
      phone,
      address: address || null,
      website: website || null,
      status,
    };

    try {
      let res;
      if (formType === "create") {
        res = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/companies/${selectedCompany?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during submission");
      }

      setSuccess(`Company ${formType === "create" ? "created" : "updated"} successfully!`);
      setIsFormOpen(false);
      fetchCompaniesList();
      refreshCompanies(); // Update global context dropdown
    } catch (err: any) {
      setError(err.message || "Submission failed");
    }
  };

  // Delete a company, subject to dependency restriction checks
  const handleDeleteCompany = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setSuccess("Company deleted successfully.");
      fetchCompaniesList();
      refreshCompanies(); // Update global context dropdown
    } catch (err: any) {
      setError(err.message || "Failed to delete company");
    }
  };

  const breadcrumbs = [{ label: "Companies" }];

  return (
    <DashboardShell pageTitle="Companies Directory" breadcrumbs={breadcrumbs}>
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

        {/* Action Header bar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500 font-medium">
            Manage organization entries on the platform
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        {/* Companies List Table Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
              <span className="text-sm font-medium">Loading companies...</span>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-350" />
              <p className="text-sm font-medium">No companies registered yet.</p>
              <button
                onClick={handleOpenCreate}
                className="mt-3 text-cyan-600 hover:text-cyan-700 font-semibold text-sm inline-flex items-center gap-1"
              >
                Add the first company now <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Website</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{company.name}</td>
                      <td className="px-6 py-4 text-slate-500">{company.email}</td>
                      <td className="px-6 py-4 text-slate-500">{company.phone}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3.5 h-3.5" /> {company.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            company.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {company.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(company)}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(company)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
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

        {/* 1. CREATE / EDIT COMPANY FORM MODAL */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Modal Header */}
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">
                  {formType === "create" ? "Add New Company" : "Update Company Details"}
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
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                    />
                  </div>

                  {/* Email & Phone grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. hr@company.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 555-0100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Address field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Office Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 100 Main St, Suite 400"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                    />
                  </div>

                  {/* Website & Status grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g. https://company.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Actions Footer */}
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
                    className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    {formType === "create" ? "Save Company" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. EYE ICON: VIEW DETAILS MODAL */}
        {isDetailOpen && detailCompany && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-gradient-to-r from-cyan-800 to-teal-900 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-cyan-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{detailCompany.name}</h3>
                    <span className="text-xs text-cyan-200">ID Reference: #{detailCompany.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1 text-white/75 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Company Details Body */}
              <div className="p-6 space-y-4">
                {/* Status indicator */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      detailCompany.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {detailCompany.status}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="space-y-3.5">
                  <div className="flex gap-3 text-sm">
                    <Mail className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Official Email</div>
                      <div className="text-slate-700 font-medium">{detailCompany.email}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Contact Phone</div>
                      <div className="text-slate-700 font-medium">{detailCompany.phone}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <Globe className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Website URL</div>
                      <div className="text-slate-700 font-medium">
                        {detailCompany.website ? (
                          <a
                            href={detailCompany.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:underline"
                          >
                            {detailCompany.website}
                          </a>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Office Address</div>
                      <div className="text-slate-700 font-medium">{detailCompany.address || "-"}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">System Created At</div>
                      <div className="text-slate-700 font-medium">
                        {new Date(detailCompany.createdAt).toLocaleDateString()} at{" "}
                        {new Date(detailCompany.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
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
      </div>
    </DashboardShell>
  );
}
