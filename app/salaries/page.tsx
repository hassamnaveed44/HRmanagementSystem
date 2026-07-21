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
  Banknote,
  Calendar,
  DollarSign,
  User,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface Salary {
  id: number;
  employeeId: number;
  companyId: number;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
  };
}

/**
 * Salary Management Component
 * Allows HR to filter, create (auto-calculating net salary on the fly), edit,
 * and view details (eye icon) of monthly salary records.
 */
export default function SalariesPage() {
  const { selectedCompanyId, selectedCompany, loading: contextLoading } = useCompany();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters State
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);

  // Detail Modal (Eye Icon) States
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [detailSalary, setDetailSalary] = useState<Salary | null>(null);

  // Custom Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Form Fields State
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [basicSalary, setBasicSalary] = useState("0");
  const [allowances, setAllowances] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");

  // Fetch salaries matching filters
  const fetchSalaries = async () => {
    if (!selectedCompanyId) {
      setSalaries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let url = `/api/salaries?companyId=${selectedCompanyId}`;
      if (filterEmployee) url += `&employeeId=${filterEmployee}`;
      if (filterMonth) url += `&month=${filterMonth}`;
      if (filterYear) url += `&year=${filterYear}`;
      if (filterStatus) url += `&paymentStatus=${filterStatus}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load salaries");
      const data = await res.json();
      setSalaries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load salary logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for dropdown selectors
  const fetchEmployeesList = async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await fetch(`/api/employees?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load company employees list", err);
    }
  };

  useEffect(() => {
    fetchSalaries();
    fetchEmployeesList();
  }, [selectedCompanyId, filterEmployee, filterMonth, filterYear, filterStatus]);

  // Clear notifications automatically
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Live calculation of net salary: netSalary = basic + allowances + bonus - deductions
  const calculateNetSalary = () => {
    const basic = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const bon = parseFloat(bonus) || 0;
    const deduct = parseFloat(deductions) || 0;
    return basic + allow + bon - deduct;
  };

  // Open modal for creating a salary slip
  const handleOpenCreate = () => {
    setFormType("create");
    setSelectedSalary(null);
    setEmployeeId("");
    setMonth((new Date().getMonth() + 1).toString()); // Default to current month
    setYear(new Date().getFullYear().toString());
    setBasicSalary("0");
    setAllowances("0");
    setBonus("0");
    setDeductions("0");
    setPaymentStatus("PENDING");
    setIsFormOpen(true);
  };

  // Open modal for editing a salary slip
  const handleOpenEdit = (sal: Salary) => {
    setFormType("edit");
    setSelectedSalary(sal);
    setEmployeeId(sal.employeeId.toString());
    setMonth(sal.month.toString());
    setYear(sal.year.toString());
    setBasicSalary(sal.basicSalary.toString());
    setAllowances(sal.allowances.toString());
    setBonus(sal.bonus.toString());
    setDeductions(sal.deductions.toString());
    setPaymentStatus(sal.paymentStatus);
    setIsFormOpen(true);
  };

  // Open detail modal (Eye Icon)
  const handleOpenDetail = (sal: Salary) => {
    setDetailSalary(sal);
    setIsDetailOpen(true);
  };

  // Submit salary form data
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      employeeId: parseInt(employeeId, 10),
      companyId: selectedCompanyId,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      basicSalary: parseFloat(basicSalary),
      allowances: parseFloat(allowances),
      bonus: parseFloat(bonus),
      deductions: parseFloat(deductions),
      paymentStatus,
    };

    try {
      let res;
      if (formType === "create") {
        res = await fetch("/api/salaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/salaries/${selectedSalary?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basicSalary: payload.basicSalary,
            allowances: payload.allowances,
            bonus: payload.bonus,
            deductions: payload.deductions,
            paymentStatus,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during submission");
      }

      setSuccess(`Salary slip ${formType === "create" ? "logged" : "updated"} successfully!`);
      setIsFormOpen(false);
      fetchSalaries();
    } catch (err: any) {
      setError(err.message || "Failed to log salary slip");
    }
  };

  // Trigger custom confirmation modal instead of browser alert
  const handleDeleteSalary = (id: number) => {
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
      const res = await fetch(`/api/salaries/${deleteTargetId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setSuccess("Salary record deleted successfully.");
      fetchSalaries();
    } catch (err: any) {
      setError(err.message || "Failed to delete salary record");
    } finally {
      setDeleteTargetId(null);
    }
  };

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

  const breadcrumbs = [{ label: "Salaries" }];

  return (
    <DashboardShell pageTitle="Payroll Logs" breadcrumbs={breadcrumbs}>
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

        {/* Company scope verification */}
        {!selectedCompanyId && !contextLoading ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h4 className="font-bold text-lg mb-1">Company Scope Required</h4>
            <p className="text-sm text-amber-700 max-w-md mx-auto">
              Please select a company in the top navbar to view and manage payroll records.
            </p>
          </div>
        ) : (
          <>
            {/* Filter controls panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Employee Filter */}
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>

                {/* Month Filter */}
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Months</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* Year Filter */}
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Log Salary CTA */}
              <button
                onClick={handleOpenCreate}
                className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm self-start md:self-auto"
              >
                <Plus className="w-4 h-4" /> Log Salary Slip
              </button>
            </div>

            {/* Salaries table card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                  <span className="text-sm font-medium">Loading payroll records...</span>
                </div>
              ) : salaries.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Banknote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">No payroll logs found matching criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Pay Period</th>
                        <th className="px-6 py-4 text-right">Basic Salary</th>
                        <th className="px-6 py-4 text-right">Net Salary</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {salaries.map((sal) => (
                        <tr key={sal.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">
                              {sal.employee.firstName} {sal.employee.lastName}
                            </div>
                            <div className="text-xs text-slate-400">{sal.employee.employeeCode}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            {months.find((m) => m.value === sal.month)?.label} {sal.year}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500">
                            ${sal.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-850">
                            ${sal.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                sal.paymentStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                  : sal.paymentStatus === "PENDING"
                                  ? "bg-amber-50 text-amber-800 border border-amber-100"
                                  : "bg-slate-100 text-slate-650 border border-slate-200"
                              }`}
                            >
                              {sal.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenDetail(sal)}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(sal)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="Edit Slip"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSalary(sal.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                              title="Delete Slip"
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

        {/* 1. MODAL: LOG / EDIT SALARY SLIP FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-zoom-in">
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">
                  {formType === "create" ? "Process Salary Record" : "Edit Salary slip"}
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
                  
                  {/* Select Employee (Locked on edit) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Select Employee *
                    </label>
                    <select
                      disabled={formType === "edit"}
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month and Year (Locked on edit) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Month *
                      </label>
                      <select
                        disabled={formType === "edit"}
                        required
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 disabled:bg-slate-100 cursor-pointer"
                      >
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Year *
                      </label>
                      <input
                        type="number"
                        disabled={formType === "edit"}
                        required
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="2026"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Basic Salary ($) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(e.target.value)}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Allowances ($) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={allowances}
                        onChange={(e) => setAllowances(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Bonus ($) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Deductions ($) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Payment Status selector */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Payment Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 cursor-pointer"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    {/* LIVE CALCULATION BOX */}
                    <div className="bg-cyan-50 border border-cyan-150 p-3 rounded-lg text-right">
                      <div className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">
                        Net Salary (Live Calc)
                      </div>
                      <div className="text-xl font-extrabold text-cyan-850 mt-0.5">
                        ${calculateNetSalary().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
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
                    {formType === "create" ? "Log payroll" : "Update payroll"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. EYE ICON: VIEW SALARY SLIP DETAILS MODAL */}
        {isDetailOpen && detailSalary && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-zoom-in">
              
              {/* Header */}
              <div className="flex justify-between items-center bg-gradient-to-r from-cyan-800 to-teal-900 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-cyan-200">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Salary Slip Details</h3>
                    <span className="text-xs text-cyan-200">
                      For {months.find((m) => m.value === detailSalary.month)?.label} {detailSalary.year}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slip details body */}
              <div className="p-6 space-y-4">
                
                {/* Employee card */}
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-sm">
                    {detailSalary.employee.firstName[0]}
                    {detailSalary.employee.lastName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {detailSalary.employee.firstName} {detailSalary.employee.lastName}
                    </div>
                    <div className="text-xs text-slate-400">Code: {detailSalary.employee.employeeCode}</div>
                  </div>
                </div>

                {/* Financial entries */}
                <div className="divide-y divide-slate-100 space-y-3 pt-2">
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-slate-450 font-medium">Basic Salary</span>
                    <span className="font-semibold text-slate-800">
                      ${detailSalary.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3">
                    <span className="text-slate-450 font-medium">Allowances</span>
                    <span className="font-semibold text-emerald-700">
                      +${detailSalary.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3">
                    <span className="text-slate-450 font-medium">Bonus Pay</span>
                    <span className="font-semibold text-emerald-700">
                      +${detailSalary.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3">
                    <span className="text-slate-450 font-medium">Deductions</span>
                    <span className="font-semibold text-red-600">
                      -${detailSalary.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {/* Highlighted Net Salary */}
                  <div className="flex justify-between items-center text-base pt-4 border-t border-dashed border-slate-200 font-extrabold">
                    <span className="text-slate-800">Net Paid Salary</span>
                    <span className="text-cyan-800 text-lg">
                      ${detailSalary.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Audit trail */}
                <div className="bg-slate-50/75 p-3 rounded-lg border border-slate-100 text-xs text-slate-500 space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-bold flex items-center gap-1">
                      {detailSalary.paymentStatus === "PAID" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : detailSalary.paymentStatus === "PENDING" ? (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {detailSalary.paymentStatus}
                    </span>
                  </div>
                  {detailSalary.paidAt && (
                    <div className="flex justify-between">
                      <span>Paid Timestamp:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(detailSalary.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Log Created At:</span>
                    <span className="font-medium">
                      {new Date(detailSalary.createdAt).toLocaleDateString()}
                    </span>
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
                    Are you sure you want to delete this salary record? This action is permanent and cannot be undone.
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
