"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Bus,
  Wrench,
  Route,
  BrainCircuit,
  Bell,
  Menu,
  X,
  Radio,
  Settings,
  AlertCircle,
  LogOut
} from "lucide-react";
import { useTransitOps, TabType } from "@/context/TransitOpsContext";

export default function Sidebar() {
  const { activeTab, setActiveTab, workOrders, drivers, logout, role } = useTransitOps();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const allNav = [
    { id: "dashboard", name: "Executive Dashboard", icon: LayoutDashboard },
    { id: "registry", name: "Registry & Profiles", icon: Bus },
    { id: "dispatcher", name: "Smart Dispatcher", icon: Route },
    { id: "maintenance", name: "Maintenance & Expenses", icon: Wrench },
  ];

  let navigation = allNav;
  if (role === "driver") {
    navigation = allNav.filter(n => n.id === "dispatcher");
  } else if (role === "safety_officer") {
    navigation = allNav.filter(n => n.id === "registry");
  } else if (role === "financial_analyst") {
    navigation = allNav.filter(n => n.id === "dashboard" || n.id === "maintenance");
  }

  // Derive dynamic notifications based on state
  const pendingOrdersCount = workOrders.filter(w => w.status !== "Resolved").length;
  
  // Expiry check logic (expiring within 30 days of 2026-07-12)
  const currentDate = new Date("2026-07-12");
  const warningsCount = drivers.filter(d => {
    const exp = new Date(d.expiryDate);
    const diffTime = exp.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const notifications = [
    ...(pendingOrdersCount > 0 ? [{ id: 1, text: `${pendingOrdersCount} vehicles checked in Maintenance shop.`, type: "alert" }] : []),
    ...(warningsCount > 0 ? [{ id: 2, text: `${warningsCount} driver license(s) expiring within 30 days!`, type: "warn" }] : []),
    { id: 3, text: "AI Dispatch optimization calculation complete.", type: "info" }
  ];

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 glass-panel bg-obsidian-900 border-b border-slate-800 text-slate-100 z-50 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg text-obsidian-950">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-wider text-lg">Transit<span className="text-cyan-400">Ops</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 hover:bg-slate-800 rounded-lg relative text-slate-400 hover:text-slate-100"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse beacon-cyan" />
            )}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-obsidian-900/95 lg:bg-obsidian-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative h-screen`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-xl text-obsidian-950 shadow-md shadow-violet-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-xl text-slate-100">
                Transit<span className="text-cyan-400">Ops</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                AI Platform v2.5
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group text-left cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-950/40 to-cyan-900/10 text-cyan-400 border-l-2 border-cyan-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-2 border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-350"
                  }`} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Dynamic AI Status widgets */}
          <div className="mt-auto pt-6 border-t border-slate-850">
            <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  AI Engine Status
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-cyan-500/15">
                  98.4%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 mb-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full w-[98.4%]" />
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Predictive rerouting active. {workOrders.length} work orders logged.
              </p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-850 flex items-center justify-between bg-obsidian-950/45">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
                alt="Ops Supervisor"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-obsidian-900" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Terminal Access</span>
              <span className="text-[11px] text-slate-400 capitalize">{role ? role.replace("_", " ") : "Supervisor"}</span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            title="Secure Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Notifications Drawer (Absolute Panel) */}
      {showNotifications && (
        <div className="absolute right-4 top-16 w-85 glass-panel rounded-xl border border-slate-800 shadow-2xl z-50 p-4 divide-y divide-slate-800">
          <div className="flex justify-between items-center pb-2.5">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-cyan-400" />
              Live Alerts Feed
            </h4>
            <button 
              onClick={() => setShowNotifications(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <div className="space-y-3 pt-3 max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="text-xs leading-normal flex gap-2">
                <AlertCircle className={`w-4 h-4 shrink-0 ${n.type === "alert" ? "text-red-400" : n.type === "warn" ? "text-amber-400" : "text-cyan-400"}`} />
                <p className="text-slate-250 font-medium">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
