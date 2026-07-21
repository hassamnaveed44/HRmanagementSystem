"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import {
  LayoutDashboard,
  Building2,
  Tag,
  Users,
  Banknote,
  FolderKanban,
  Building,
  ChevronDown,
  Bell,
  Search,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

// Sidebar individual navigation item component
const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon, label, active }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active
          ? "bg-cyan-800/80 text-white font-medium shadow-sm border-l-4 border-cyan-400 pl-3"
          : "text-cyan-100 hover:bg-cyan-900/40 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle: string;
  breadcrumbs: { label: string; href?: string }[];
}

/**
 * DashboardShell Component
 * Renders the structural page frame: the dark teal sidebar, top greeting header,
 * company switcher, and main responsive workspace card frame.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  pageTitle,
  breadcrumbs,
}) => {
  const pathname = usePathname();
  const { companies, selectedCompanyId, setSelectedCompanyId, selectedCompany, loading } = useCompany();

  // Navigation routes configuration
  const navigation = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/companies", label: "Companies", icon: <Building2 className="w-5 h-5" /> },
    { href: "/designations", label: "Designations", icon: <Tag className="w-5 h-5" /> },
    { href: "/employees", label: "Employees", icon: <Users className="w-5 h-5" /> },
    { href: "/salaries", label: "Salaries", icon: <Banknote className="w-5 h-5" /> },
    { href: "/projects", label: "Projects", icon: <FolderKanban className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* 1. Sidebar Navigation - Deep Teal/Cyan Theme */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-gradient-to-b from-cyan-950 to-teal-900 text-white shadow-xl">
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center gap-2 px-6 bg-cyan-950/60 border-b border-cyan-900/30">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
            <Building className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-wider text-white">BREEZ HR</span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/")
              }
            />
          ))}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 bg-cyan-950/40 border-t border-cyan-900/30 text-xs text-cyan-300 text-center">
          HR Management System v1.0
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm">
          {/* Greeting Area */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-slate-800">Hello Admin 👋</span>
          </div>

          {/* Company Switcher Dropdown */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label htmlFor="company-switcher" className="text-sm font-medium text-slate-500 whitespace-nowrap">
                Selected Company:
              </label>
              <div className="relative">
                <select
                  id="company-switcher"
                  value={selectedCompanyId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCompanyId(val ? parseInt(val, 10) : null);
                  }}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer min-w-[200px]"
                >
                  <option value="">-- Choose Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Notification Badge */}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="w-9 h-9 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold shadow-sm">
                AD
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-700">John Smith</div>
                <div className="text-[10px] text-slate-400">HR Manager</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-grow overflow-y-auto p-8">
          {/* Breadcrumbs and Page Heading */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Dashboard</span>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span>/</span>
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-cyan-600 transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-500 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
            </div>

            {/* Active Company Status Badge */}
            {selectedCompany && (
              <div className="bg-cyan-50 border border-cyan-150 rounded-lg px-4 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-cyan-800">
                  Active Scope: {selectedCompany.name}
                </span>
              </div>
            )}
          </div>

          {/* Children Components Workspaces */}
          {children}
        </main>
      </div>
    </div>
  );
};
