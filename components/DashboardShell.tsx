"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import {
  LayoutDashboard,
  Users,
  Banknote,
  FolderKanban,
  Building,
  ChevronDown,
  ChevronUp,
  Bell,
  Search,
  Menu,
  Globe,
  Grid,
  Mail,
  HelpCircle,
  Clock,
  MessageSquare,
  ShieldAlert,
  User,
  LogOut,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  indent?: boolean;
}

// Sidebar individual navigation item
const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon, label, active, indent }) => {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-6 py-3 transition-all duration-200 ${
        indent ? "pl-14 text-cyan-50 hover:bg-[#0089ac] text-xs" : "text-white hover:bg-[#0089ac] text-sm"
      } ${active && !indent ? "bg-[#0089ac] border-l-4 border-white pl-5 font-semibold" : ""} ${
        active && indent ? "bg-[#0089ac] font-semibold text-white" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
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
 * Implements the exact sidebar design from the screenshot:
 * - w-64 width, #00A2CA background
 * - Waving hand hello greeting top bar
 * - Search Here... pill input, English dropdown, envelope, bell, Jhon Smith avatar
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  pageTitle,
  breadcrumbs,
}) => {
  const pathname = usePathname();
  const { companies, selectedCompanyId, setSelectedCompanyId, selectedCompany, loading } = useCompany();
  const [employeeOpen, setEmployeeOpen] = useState(true);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      
      {/* 1. SIDEBAR: Styled matching screenshot (width 256, bg #00A2CA) */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#00A2CA] text-white shadow-lg h-full select-none z-15">
        
        {/* Brand/Logo: 'anez' matching screens */}
        <div className="h-16 flex items-center gap-2 px-6 bg-[#0092B6]">
          {/* Logo waveform icon */}
          <div className="flex items-center gap-1.5">
            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
              <path d="M4 6h2v12H4zm4-2h2v16H8zm4 5h2v10h-2zm4-3h2v14h-2zm4 6h2v8h-2z" />
            </svg>
            <span className="font-extrabold text-2xl tracking-tight">anez</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow py-4 overflow-y-auto space-y-0.5">
          
          {/* Dashboard Link */}
          <SidebarLink
            href="/"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
            active={pathname === "/"}
          />

          {/* Employee Link (Expandable) */}
          <div>
            <button
              onClick={() => setEmployeeOpen(!employeeOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 transition-colors text-white hover:bg-[#0089ac] text-sm ${
                pathname.startsWith("/employees") || pathname.startsWith("/designations") ? "bg-[#0089ac]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Employee</span>
              </div>
              {employeeOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Submenu links */}
            {employeeOpen && (
              <div className="bg-[#0098be] py-1">
                <SidebarLink
                  href="/employees"
                  icon={null}
                  label="Employee"
                  active={pathname === "/employees"}
                  indent
                />
                <SidebarLink
                  href="/designations"
                  icon={null}
                  label="Designation"
                  active={pathname === "/designations"}
                  indent
                />
                <SidebarLink
                  href="/companies"
                  icon={null}
                  label="Companies"
                  active={pathname === "/companies"}
                  indent
                />
              </div>
            )}
          </div>

          {/* Salary Link (Expandable) */}
          <div>
            <button
              onClick={() => setSalaryOpen(!salaryOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 transition-colors text-white hover:bg-[#0089ac] text-sm ${
                pathname.startsWith("/salaries") ? "bg-[#0089ac]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-4 h-4" />
                <span>Salary</span>
              </div>
              {salaryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {salaryOpen && (
              <div className="bg-[#0098be] py-1">
                <SidebarLink
                  href="/salaries"
                  icon={null}
                  label="Salary Sheets"
                  active={pathname === "/salaries"}
                  indent
                />
              </div>
            )}
          </div>

          {/* Projects Link */}
          <SidebarLink
            href="/projects"
            icon={<FolderKanban className="w-4 h-4" />}
            label="Projects"
            active={pathname === "/projects"}
          />

          {/* Dummy links matching the screenshot design */}
          <button className="w-full flex items-center gap-3 px-6 py-3 text-cyan-50/80 hover:bg-[#0089ac] hover:text-white text-sm transition-colors">
            <Clock className="w-4 h-4" />
            <span>Time Sheet</span>
          </button>

          <button className="w-full flex items-center gap-3 px-6 py-3 text-cyan-50/80 hover:bg-[#0089ac] hover:text-white text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>

          <button className="w-full flex items-center gap-3 px-6 py-3 text-cyan-50/80 hover:bg-[#0089ac] hover:text-white text-sm transition-colors">
            <User className="w-4 h-4" />
            <span>Users</span>
          </button>

          <button className="w-full flex items-center gap-3 px-6 py-3 text-cyan-50/80 hover:bg-[#0089ac] hover:text-white text-sm transition-colors">
            <ShieldAlert className="w-4 h-4" />
            <span>Role</span>
          </button>

        </nav>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-grow flex flex-col overflow-hidden">
        
        {/* TOP BAR / NAVBAR (Hello Thomas, Search bar, English, Jhon Smith online) */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm">
          {/* Left: Greeting */}
          <div className="flex items-center gap-4">
            <button className="p-1.5 hover:bg-slate-150 rounded-lg transition-colors text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
              Hello Thomas <span className="inline-block transform origin-bottom hover:animate-wave cursor-default">👋</span>
            </span>

            {/* Scope / Switch Company Indicator */}
            <div className="ml-6 relative">
              <select
                value={selectedCompanyId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCompanyId(val ? parseInt(val, 10) : null);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00A2CA] cursor-pointer min-w-[150px]"
              >
                <option value="">-- Switch Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center gap-6">
            
            {/* Search Bar pill matching screens */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Here ..."
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-4 py-2 pr-9 w-60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00A2CA] placeholder-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Language dropdown */}
            <button className="flex items-center gap-1.5 text-xs font-medium text-slate-650 hover:text-slate-900 transition-colors">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>English</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Fullscreen Grid Icon */}
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
              <Grid className="w-4 h-4" />
            </button>

            {/* Message/Email Icon */}
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
              <Mail className="w-4 h-4" />
            </button>

            {/* Notification bell */}
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Avatar (Jhon Smith, Online) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-4 border-l border-slate-100 hover:opacity-90"
              >
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                    alt="Jhon Smith"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-750">Jhon Smith</div>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> online
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-450" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg border border-slate-150 shadow-lg py-1 text-xs text-slate-700 z-50">
                  <Link href="/employees" className="block px-4 py-2 hover:bg-slate-50">Profile</Link>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-red-650">
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-grow overflow-y-auto p-6 bg-[#f7f8f9]">
          
          {/* Breadcrumbs matching screens (e.g. Home > Employee) */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs text-[#00A2CA] font-semibold">
              <span>Home</span>
              <span className="text-slate-400 font-normal">&gt;</span>
              <span className="text-slate-500 font-medium">
                {breadcrumbs[breadcrumbs.length - 1]?.label || pageTitle}
              </span>
            </div>
          </div>

          {/* Scoped Company Banner alert */}
          {selectedCompany && (
            <div className="mb-4 bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A2CA] animate-pulse"></span>
                <span className="text-xs font-semibold text-cyan-850">
                  Scoped Active Records: {selectedCompany.name}
                </span>
              </div>
              <span className="text-[10px] text-cyan-600 font-medium font-mono uppercase bg-cyan-100/50 px-2 py-0.5 rounded border border-cyan-150">
                PostgreSQL database
              </span>
            </div>
          )}

          {/* Children views */}
          {children}
        </main>
      </div>
    </div>
  );
};
