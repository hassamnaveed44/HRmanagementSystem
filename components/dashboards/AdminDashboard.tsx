"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Plus,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Tag,
  FolderKanban,
} from "lucide-react";

interface AdminStats {
  totalCompanies: number;
  totalEmployees: number;
  totalProjects: number;
  totalPayroll: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalCompanies: 0,
    totalEmployees: 0,
    totalProjects: 0,
    totalPayroll: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminMetrics() {
      try {
        setLoading(true);
        const [compRes, empRes, projRes, salRes] = await Promise.all([
          apiFetch("/api/companies"),
          apiFetch("/api/employees"),
          apiFetch("/api/projects"),
          apiFetch("/api/salaries"),
        ]);

        const companies = compRes.ok ? await compRes.json() : [];
        const employees = empRes.ok ? await empRes.json() : [];
        const projects = projRes.ok ? await projRes.json() : [];
        const salaries = salRes.ok ? await salRes.json() : [];

        const totalPayrollSum = Array.isArray(salaries)
          ? salaries.reduce((acc: number, s: any) => acc + (s.netSalary || 0), 0)
          : 0;

        setStats({
          totalCompanies: Array.isArray(companies) ? companies.length : 0,
          totalEmployees: Array.isArray(employees) ? employees.length : 0,
          totalProjects: Array.isArray(projects) ? projects.length : 0,
          totalPayroll: totalPayrollSum,
        });
      } catch (err) {
        console.error("Error loading admin metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminMetrics();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* System Admin Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> System Administrator Control Center
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Platform Security & Infrastructure Overview
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            You have full system governance over all active tenant companies, employee records, authorization security guards, and platform metrics.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> : stats.totalCompanies}
            </div>
            <div className="text-xs font-medium text-slate-400">Tenant Companies</div>
          </div>
        </div>

        {/* Total System Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : stats.totalEmployees}
            </div>
            <div className="text-xs font-medium text-slate-400">Total System Employees</div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : stats.totalProjects}
            </div>
            <div className="text-xs font-medium text-slate-400">Active Projects</div>
          </div>
        </div>

        {/* Platform Payroll */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : `$${stats.totalPayroll.toLocaleString()}`}
            </div>
            <div className="text-xs font-medium text-slate-400">Monthly Payroll Volume</div>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Manage Companies */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl w-fit">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">Company Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provision new corporate tenants, update organization details, or manage company active statuses across the platform.
            </p>
          </div>
          <Link
            href="/companies"
            className="mt-5 text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1.5 pt-4 border-t border-slate-50"
          >
            Manage Companies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Global Designations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">Designation & Role Framework</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure job titles, organizational roles, and designation taxonomies across corporate companies.
            </p>
          </div>
          <Link
            href="/designations"
            className="mt-5 text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 pt-4 border-t border-slate-50"
          >
            Manage Designations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Employee Directory Governance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">Employee Directory</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Access the complete cross-company employee database with real-time filtering, profile auditing, and role mapping.
            </p>
          </div>
          <Link
            href="/employees"
            className="mt-5 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 pt-4 border-t border-slate-50"
          >
            View Employee Directory <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
