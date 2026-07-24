"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import { apiFetch } from "@/lib/api-client";
import {
  Users,
  FolderKanban,
  Banknote,
  Plus,
  Building2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  UserCheck,
  Tag,
  DollarSign,
} from "lucide-react";

interface HRStats {
  companyEmployeesCount: number;
  companyProjectsCount: number;
  companySalariesCount: number;
}

export function HRDashboard() {
  const { selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const [stats, setStats] = useState<HRStats>({
    companyEmployeesCount: 0,
    companyProjectsCount: 0,
    companySalariesCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHRMetrics() {
      if (!selectedCompanyId) return;
      try {
        setLoading(true);
        const [empRes, projRes, salRes] = await Promise.all([
          apiFetch(`/api/employees?companyId=${selectedCompanyId}`),
          apiFetch(`/api/projects?companyId=${selectedCompanyId}`),
          apiFetch(`/api/salaries?companyId=${selectedCompanyId}`),
        ]);

        const employees = empRes.ok ? await empRes.json() : [];
        const projects = projRes.ok ? await projRes.json() : [];
        const salaries = salRes.ok ? await salRes.json() : [];

        setStats({
          companyEmployeesCount: employees.length,
          companyProjectsCount: projects.length,
          companySalariesCount: salaries.length,
        });
      } catch (err) {
        console.error("Error loading HR metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHRMetrics();
  }, [selectedCompanyId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HR Welcome & Active Company Context Banner */}
      <div className="bg-gradient-to-r from-cyan-700 via-teal-800 to-cyan-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-semibold border border-cyan-400/30">
            <Building2 className="w-4 h-4 text-cyan-300" />
            {selectedCompany ? selectedCompany.name : "Company Scope Required"}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Human Resources Operations Hub
          </h2>
          <p className="text-xs md:text-sm text-cyan-100/90 leading-relaxed">
            Manage employee onboarding, job designations, team project allocations, and monthly payroll logs for your active company scope.
          </p>
        </div>
      </div>

      {/* Scope Warning Alert if no company selected */}
      {!selectedCompanyId && !contextLoading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Please Select a Company</h4>
            <p className="text-xs text-amber-700">
              Use the company switcher dropdown in the top header bar to scope HR management tools to a target organization.
            </p>
          </div>
        </div>
      )}

      {/* HR Company-Scoped Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Company Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> : stats.companyEmployeesCount}
            </div>
            <div className="text-xs font-medium text-slate-400">Active Company Employees</div>
          </div>
        </div>

        {/* Company Projects */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : stats.companyProjectsCount}
            </div>
            <div className="text-xs font-medium text-slate-400">Active Company Projects</div>
          </div>
        </div>

        {/* Company Payroll Logs */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : stats.companySalariesCount}
            </div>
            <div className="text-xs font-medium text-slate-400">Logged Salary Slips</div>
          </div>
        </div>
      </div>

      {/* HR Action Shortcuts Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
          HR Management Quick Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Register Employee */}
          <Link
            href="/employees"
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg w-fit group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Register Employee</h4>
              <p className="text-xs text-slate-400">Add new staff members to your active company database.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Go to Directory <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Manage Designations */}
          <Link
            href="/designations"
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Designations & Roles</h4>
              <p className="text-xs text-slate-400">Manage job titles and designation requirements.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Add Designation <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Manage Projects */}
          <Link
            href="/projects"
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Project Allocation</h4>
              <p className="text-xs text-slate-400">Track company projects and allocate team leads.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Manage Projects <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Log Salary */}
          <Link
            href="/salaries"
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg w-fit group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Payroll & Salary Slips</h4>
              <p className="text-xs text-slate-400">Log monthly pay slips and manage payout statuses.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Log Salary Slip <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
