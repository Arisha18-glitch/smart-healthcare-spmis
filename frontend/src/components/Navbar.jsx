import React from 'react';
import { NavLink } from 'react-router-dom';
import { resetSampleData } from '../api';

export function TopAppBar() {
  const [resetting, setResetting] = React.useState(false);

  const handleReset = async () => {
    if (window.confirm("Reset project database to case study baseline? All edits will be reverted.")) {
      try {
        setResetting(true);
        await resetSampleData();
        window.location.reload();
      } catch (err) {
        alert("Failed to reset: " + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <header className="flex justify-between items-center w-full px-space-lg h-12 fixed top-0 left-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-none">
      {/* Left: Brand Title & Global Search */}
      <div className="flex items-center gap-space-lg">
        <NavLink to="/" className="flex items-center gap-space-sm text-decoration-none">
          <span className="material-symbols-outlined text-primary text-xl">local_hospital</span>
          <span className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight whitespace-nowrap">
            Smart Healthcare PMIS - 5 Hospitals Network
          </span>
        </NavLink>

        <div className="relative hidden md:flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px]">search</span>
          <input 
            className="h-8 pl-8 pr-3 text-label-sm font-label-sm bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary w-64 transition-all" 
            placeholder="Search tasks, WBS, resources..." 
            type="text"
          />
        </div>
      </div>

      {/* Center: Top Bar Metadata */}
      <div className="hidden lg:flex items-center gap-space-md border-x border-outline-variant px-space-md h-7">
        <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-primary">calendar_month</span>
          <span>2026-10-26 (Week 8 of 16)</span>
        </div>
        <div className="h-3 w-px bg-outline-variant"></div>
        <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
          <span>PKR 5.0M | 16w</span>
        </div>
        <div className="h-3 w-px bg-outline-variant"></div>
        <div className="flex items-center gap-1.5 text-label-sm font-label-sm font-semibold text-error">
          <span className="material-symbols-outlined text-[15px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <span>Critical: Supply Path Delay</span>
        </div>
      </div>

      {/* Right: Actions & Reset */}
      <div className="flex items-center gap-space-sm">
        <button 
          onClick={handleReset} 
          disabled={resetting}
          className="h-8 px-space-sm bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface rounded-lg text-label-sm font-label-sm font-semibold transition-colors flex items-center gap-1"
          title="Reset to Case Study Baseline"
        >
          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
          {resetting ? 'Resetting…' : 'Reset Data'}
        </button>

        <a 
          href="http://127.0.0.1:8000/api/report" 
          target="_blank" 
          rel="noreferrer"
          className="h-8 px-space-sm bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface rounded-lg text-label-sm font-label-sm font-semibold transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">file_download</span>
          Export EVM
        </a>

        <NavLink 
          to="/report"
          className="h-8 px-space-sm bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface rounded-lg text-label-sm font-label-sm font-semibold transition-colors flex items-center gap-1 text-decoration-none"
          title="Printable Academic Examination Report (Times New Roman)"
        >
          <span className="material-symbols-outlined text-[15px]">print</span>
          Academic Report
        </NavLink>

        <NavLink 
          to="/hospital"
          className="h-8 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-lg text-label-sm font-label-sm font-semibold transition-colors shadow-none flex items-center gap-1 text-decoration-none"
        >
          <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
          Hospital Console
        </NavLink>

        <div className="flex items-center gap-0.5 ml-1 border-l border-outline-variant pl-2">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors" title="Notifications">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
          </button>
          <NavLink to="/integrity" className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors" title="Audit Center">
            <span className="material-symbols-outlined text-[18px]">policy</span>
          </NavLink>
        </div>

        <div className="flex items-center ml-1 pl-2">
          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant text-primary font-bold text-xs">
            DS
          </div>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed top-12 left-0 h-[calc(100vh-3rem)] w-60 z-30 flex flex-col justify-between p-space-md bg-surface-container-lowest border-r border-outline-variant shadow-none">
      <div className="flex flex-col gap-space-md">
        {/* Brand Header */}
        <div className="px-space-xs pb-space-sm border-b border-outline-variant flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-headline-sm">
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-headline-sm font-headline-sm font-bold text-on-surface">HealthOps PMIS</span>
            <span className="text-label-xs font-label-xs text-on-surface-variant mt-0.5">5-Hospital Clinical Rollout</span>
          </div>
        </div>

        {/* CTA Button */}
        <NavLink 
          to="/schedule"
          className="w-full h-8 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm font-label-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 text-decoration-none border border-primary/20"
        >
          <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
          Log Variance
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            end
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/scope" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            <span>Scope &amp; WBS</span>
          </NavLink>

          <NavLink 
            to="/schedule" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_view_month</span>
            <span>Schedule &amp; Gantt</span>
          </NavLink>

          <NavLink 
            to="/cost" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            <span>Cost &amp; EVM</span>
          </NavLink>

          <NavLink 
            to="/quality" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Quality &amp; Risks</span>
          </NavLink>

          <NavLink 
            to="/integrity" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">policy</span>
            <span>Integrity &amp; Audit</span>
          </NavLink>

          <NavLink 
            to="/charter" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            <span>Charter &amp; Plan</span>
          </NavLink>

          <NavLink 
            to="/report" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>Academic Report</span>
          </NavLink>

          <NavLink 
            to="/hospital" 
            className={({ isActive }) => `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-medium text-label-md font-label-md transition-all duration-150 text-decoration-none ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">medical_services</span>
            <span>Hospital Console</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="pt-space-sm border-t border-outline-variant flex flex-col gap-1">
        <NavLink 
          to="/integrity" 
          className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant font-medium text-label-md font-label-md hover:bg-surface-container-low transition-all duration-150 text-decoration-none"
        >
          <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
          <span>System Health</span>
        </NavLink>
        <NavLink 
          to="/charter" 
          className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant font-medium text-label-md font-label-md hover:bg-surface-container-low transition-all duration-150 text-decoration-none"
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>Compliance Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default function Navbar() {
  return (
    <>
      <TopAppBar />
      <Sidebar />
    </>
  );
}
