"use client";

import React from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { HRDashboard } from "@/components/dashboards/HRDashboard";
import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";

/**
 * Dashboard Home Page
 * Renders role-tailored interface:
 * - ADMIN: System Administrator Governance Dashboard across all companies
 * - HR: HR Operations Dashboard with Company Selector and Quick Shortcuts
 * - EMPLOYEE: Self-Service Portal (Personal profile, Assigned Projects, Pay Slips)
 */
export default function DashboardHome() {
  const { user } = useAuth();

  const getPageTitle = () => {
    if (user?.role === "ADMIN") return "System Governance Dashboard";
    if (user?.role === "EMPLOYEE") return "Employee Self-Service Portal";
    return "HR Analytics & Operations Overview";
  };

  const breadcrumbs = [{ label: "Home" }, { label: user?.role || "Dashboard" }];

  return (
    <DashboardShell pageTitle={getPageTitle()} breadcrumbs={breadcrumbs}>
      {user?.role === "ADMIN" ? (
        <AdminDashboard />
      ) : user?.role === "EMPLOYEE" ? (
        <EmployeeDashboard />
      ) : (
        <HRDashboard />
      )}
    </DashboardShell>
  );
}
