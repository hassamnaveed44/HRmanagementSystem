"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  FolderKanban,
  Banknote,
} from "lucide-react";

interface EmployeeProfile {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  joiningDate: string;
  status: string;
  designation?: {
    title: string;
  };
  company?: {
    name: string;
  };
}

interface PersonalSalary {
  id: number;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
  paidAt?: string | null;
}

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface PersonalProject {
  id: number;
  name: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  employees: Array<{
    role: string;
    employeeId: number;
  }>;
}

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [salaries, setSalaries] = useState<PersonalSalary[]>([]);
  const [projects, setProjects] = useState<PersonalProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployeeSelfData() {
      try {
        setLoading(true);
        // Fetch personal salary slips (Backend automatically scopes for EMPLOYEE role)
        const [salRes, projRes] = await Promise.all([
          apiFetch(`/api/salaries?companyId=${user?.companyId || 1}`),
          apiFetch(`/api/projects?companyId=${user?.companyId || 1}`),
        ]);

        if (salRes.ok) {
          const salData = await salRes.json();
          setSalaries(salData);
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }

        // If user has employeeId, fetch profile
        if (user?.employeeId) {
          const empRes = await apiFetch(`/api/employees/${user.employeeId}`);
          if (empRes.ok) {
            const empData = await empRes.json();
            setProfile(empData);
          }
        }
      } catch (err) {
        console.error("Error loading employee self-service metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEmployeeSelfData();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Employee Self-Service Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
            <User className="w-4 h-4 text-emerald-300" /> Employee Self-Service Portal
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || "Team Member"}!
          </h2>
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
            View your official employee details, review assigned project contributions, and track your monthly salary pay slips.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Loading personal profile data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: Personal Employee Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-inner">
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "EM"}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">{user?.name}</h3>
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit mt-1">
                    {profile?.designation?.title || "Staff Member"}
                  </div>
                </div>
              </div>

              {/* Profile Field Specs */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400">Employee Code:</span>
                  <span className="font-bold text-slate-800 ml-auto">{profile?.employeeCode || `EMP-${user?.id}`}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-700 ml-auto truncate max-w-[180px]">{user?.email}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-700 ml-auto">{profile?.phone || "N/A"}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400">Company:</span>
                  <span className="font-semibold text-slate-700 ml-auto">{profile?.company?.name || "Corporate"}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400">Joined On:</span>
                  <span className="font-semibold text-slate-700 ml-auto">
                    {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Personal Pay Slips History */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-600" /> My Salary Pay Slips
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {salaries.length} Slips Issued
                </span>
              </div>

              {salaries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Banknote className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No salary pay slips issued yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Pay Period</th>
                        <th className="px-4 py-3 text-right">Basic Pay</th>
                        <th className="px-4 py-3 text-right">Allowances</th>
                        <th className="px-4 py-3 text-right">Net Salary</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {salaries.map((sal) => (
                        <tr key={sal.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {months.find((m) => m.value === sal.month)?.label} {sal.year}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            ${sal.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            ${sal.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                            ${sal.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                sal.paymentStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : sal.paymentStatus === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {sal.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* MY ASSIGNED PROJECTS SECTION */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-emerald-600" /> My Assigned Projects & Roles
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {projects.length} Active Assignments
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FolderKanban className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No active project assignments currently.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => {
                  const assignment = proj.employees.find((pe) => pe.employeeId === user?.employeeId);
                  return (
                    <div key={proj.id} className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm">{proj.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {proj.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {proj.description || "No project description provided."}
                      </p>
                      {assignment && (
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-3 py-1 rounded-lg w-fit">
                          Assigned Role: {assignment.role}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
