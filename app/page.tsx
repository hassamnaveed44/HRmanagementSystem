"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useCompany } from "@/context/CompanyContext";
import {
  Building2,
  Users,
  CheckCircle2,
  Tag,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalCompanies: number;
  totalEmployees: number;
  activeEmployees: number;
  totalDesignations: number;
  activeProjects: number;
  pendingSalaries: number;
}

/**
 * Dashboard Home Page
 * Displays overall stats cards and shortcuts to other HR modules.
 * Dynamically re-fetches stats when the selected company changes in the header.
 */
export default function DashboardHome() {
  const { companies, selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalDesignations: 0,
    activeProjects: 0,
    pendingSalaries: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch dashboard statistics based on the selected company
  useEffect(() => {
    const fetchStats = async () => {
      if (contextLoading) return;
      
      try {
        setLoading(true);

        // If no company is selected, we can only show total companies
        if (!selectedCompanyId) {
          setStats({
            totalCompanies: companies.length,
            totalEmployees: 0,
            activeEmployees: 0,
            totalDesignations: 0,
            activeProjects: 0,
            pendingSalaries: 0,
          });
          setLoading(false);
          return;
        }

        // Fetch data concurrently from individual endpoints to compile statistics
        const [empRes, activeEmpRes, desigRes, projRes, salRes] = await Promise.all([
          fetch(`/api/employees?companyId=${selectedCompanyId}`),
          fetch(`/api/employees?companyId=${selectedCompanyId}&status=ACTIVE`),
          fetch(`/api/designations?companyId=${selectedCompanyId}`),
          fetch(`/api/projects?companyId=${selectedCompanyId}&status=IN_PROGRESS`),
          fetch(`/api/salaries?companyId=${selectedCompanyId}&paymentStatus=PENDING`),
        ]);

        const [employees, activeEmployees, designations, activeProjects, pendingSalaries] =
          await Promise.all([
            empRes.ok ? empRes.json() : [],
            activeEmpRes.ok ? activeEmpRes.json() : [],
            desigRes.ok ? desigRes.json() : [],
            projRes.ok ? projRes.json() : [],
            salRes.ok ? salRes.json() : [],
          ]);

        setStats({
          totalCompanies: companies.length,
          totalEmployees: employees.length,
          activeEmployees: activeEmployees.length,
          totalDesignations: designations.length,
          activeProjects: activeProjects.length,
          pendingSalaries: pendingSalaries.length,
        });
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedCompanyId, companies, contextLoading]);

  // breadcrumbs configuration
  const breadcrumbs = [{ label: "Home" }];

  return (
    <DashboardShell pageTitle="HR Analytics Overview" breadcrumbs={breadcrumbs}>
      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 h-32">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Welcome Banner Card */}
          <div className="bg-gradient-to-r from-cyan-800 to-teal-900 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl font-extrabold mb-2">Welcome to Breez HR Portal</h2>
              <p className="text-cyan-100 text-sm leading-relaxed mb-6">
                Manage organization structures, employee profiles, payroll processing, and cross-functional team project assignments under one centralized dashboard.
              </p>
              {companies.length === 0 && (
                <Link
                  href="/companies"
                  className="bg-white text-cyan-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-50 transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  Create Your First Company <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            {/* Visual background decorations */}
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
              <Building2 className="w-80 h-80 text-white" />
            </div>
          </div>

          {/* Scoping Alert when no company is selected */}
          {!selectedCompanyId && companies.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-medium">
                Please select a company from the header dropdown to view employee-specific statistics.
              </span>
            </div>
          )}

          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Total Companies */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-slate-400 font-medium text-sm">Total Companies</span>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalCompanies}</h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-500" /> Platform scope
                </span>
              </div>
              <div className="p-4 rounded-xl bg-cyan-50 text-cyan-600">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            {/* Card 2: Total Employees in Selected Company */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-slate-400 font-medium text-sm">Employees count</span>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {selectedCompanyId ? stats.totalEmployees : "-"}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  {selectedCompany ? selectedCompany.name : "No company selected"}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-7 h-7" />
              </div>
            </div>

            {/* Card 3: Active Employees */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-slate-400 font-medium text-sm">Active Employees</span>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {selectedCompanyId ? stats.activeEmployees : "-"}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Currently engaged
                </span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>

            {/* Card 4: Designations count */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-slate-400 font-medium text-sm">Designations Roles</span>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {selectedCompanyId ? stats.totalDesignations : "-"}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  Company designations
                </span>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 text-purple-600">
                <Tag className="w-7 h-7" />
              </div>
            </div>

            {/* Card 5: Active Projects */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-slate-400 font-medium text-sm">Active Projects</span>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {selectedCompanyId ? stats.activeProjects : "-"}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  In progress status
                </span>
              </div>
              <div className="p-4 rounded-xl bg-teal-50 text-teal-600">
                <Briefcase className="w-7 h-7" />
              </div>
            </div>

            {/* Card 6: Pending Salary Payments */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-slate-400 font-medium text-sm">Pending Salaries</span>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {selectedCompanyId ? stats.pendingSalaries : "-"}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending processing
                </span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Quick-links Quick Navigation Panel */}
          <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Quick HR Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/companies"
                className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group flex flex-col justify-between h-28"
              >
                <div className="font-semibold text-sm text-slate-800">Add Company</div>
                <div className="text-xs text-slate-400">Register new operations</div>
                <span className="text-cyan-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2 text-xs font-semibold">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/employees"
                className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group flex flex-col justify-between h-28"
              >
                <div className="font-semibold text-sm text-slate-800">Register Employee</div>
                <div className="text-xs text-slate-400">Onboard new hires</div>
                <span className="text-cyan-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2 text-xs font-semibold">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/salaries"
                className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group flex flex-col justify-between h-28"
              >
                <div className="font-semibold text-sm text-slate-800">Process Salary</div>
                <div className="text-xs text-slate-400">Log monthly pay slips</div>
                <span className="text-cyan-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2 text-xs font-semibold">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/projects"
                className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group flex flex-col justify-between h-28"
              >
                <div className="font-semibold text-sm text-slate-800">Allocate Projects</div>
                <div className="text-xs text-slate-400">Assign project teams</div>
                <span className="text-cyan-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2 text-xs font-semibold">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
