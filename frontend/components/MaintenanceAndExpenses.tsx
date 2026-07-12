"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  Coins,
  Bus,
  Plus,
  CheckCircle,
  AlertTriangle,
  History,
  FileCheck,
  TrendingUp,
  FolderLock,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  Fuel,
  Calculator,
  UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { useTransitOps, Vehicle, WorkOrder, Expense } from "@/context/TransitOpsContext";

export default function MaintenanceAndExpenses() {
  const {
    vehicles,
    workOrders,
    expenses,
    addWorkOrder,
    resolveWorkOrder,
    updateVehicleStatus,
    addExpense
  } = useTransitOps();

  // Maintenance form states
  const [maintVehicle, setMaintVehicle] = useState("");
  const [maintDesc, setMaintDesc] = useState("");
  const [maintPriority, setMaintPriority] = useState<WorkOrder["priority"]>("Medium");
  
  // Expense form states
  const [expVehicle, setExpVehicle] = useState("");
  const [expLiters, setExpLiters] = useState("");
  const [expCost, setExpCost] = useState("");
  const [expTolls, setExpTolls] = useState("");
  const [expDate, setExpDate] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  // Calculations for dynamic operational expenses per vehicle
  const totalCostPerVehicle = useMemo(() => {
    const costMap: Record<string, { fuel: number; tolls: number; total: number }> = {};
    
    // Initialize map
    vehicles.forEach((v) => {
      costMap[v.regNo] = { fuel: 0, tolls: 0, total: 0 };
    });

    // Populate
    expenses.forEach((e) => {
      if (costMap[e.vehicleReg]) {
        costMap[e.vehicleReg].fuel += e.fuelCost;
        costMap[e.vehicleReg].tolls += e.tolls;
        costMap[e.vehicleReg].total += e.fuelCost + e.tolls;
      }
    });

    return costMap;
  }, [vehicles, expenses]);

  // Total expenses summed
  const grandTotalCost = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.fuelCost + e.tolls, 0);
  }, [expenses]);

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintVehicle || !maintDesc) return;

    addWorkOrder({
      vehicleReg: maintVehicle,
      description: maintDesc,
      priority: maintPriority,
    });

    setToastMsg(`Checked vehicle ${maintVehicle} into Shop. Status set to "In Shop" globally.`);
    setMaintVehicle("");
    setMaintDesc("");
    setMaintPriority("Medium");

    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVehicle || !expCost || !expTolls || !expDate) return;

    addExpense({
      vehicleReg: expVehicle,
      liters: Number(expLiters) || 0,
      fuelCost: Number(expCost),
      tolls: Number(expTolls),
      date: expDate,
    });

    setToastMsg(`Logged operational expenses for vehicle ${expVehicle} successfully!`);
    setExpVehicle("");
    setExpLiters("");
    setExpCost("");
    setExpTolls("");
    setExpDate("");

    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleQuickRelease = (id: string) => {
    resolveWorkOrder(id);
    setToastMsg(`Work order resolved. Asset released back to Available status.`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Maintenance & Expense Control Room
            <Wrench className="w-5 h-5 text-cyan-400" />
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Review service work orders, log fuel costs, and check operational cost summaries
          </p>
        </div>
      </div>

      {/* Dynamic Summary Banner: Operational Cost per Vehicle */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 to-[#121826]/75 border border-slate-800/80">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden md:block">
          <Calculator className="w-20 h-20 text-cyan-400" />
        </div>
        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Dynamic Operational Cost Summary Banner
            </span>
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              Total Logged Expenses:
              <span className="text-xl font-extrabold text-cyan-400 font-mono">${grandTotalCost.toLocaleString()}</span>
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {Object.entries(totalCostPerVehicle).map(([reg, item]) => (
                <div key={reg} className="text-xs flex items-center gap-1.5 font-mono">
                  <span className="text-slate-500 font-semibold">{reg}:</span>
                  <span className={`font-bold ${item.total > 1000 ? "text-amber-400" : "text-slate-350"}`}>
                    ${item.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid forms */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Module 1: Maintenance Split-view & Work Order Queue */}
        <div className="xl:col-span-2 space-y-6">
          {/* Active Work Orders */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle>Active Maintenance Work Orders</CardTitle>
              <CardDescription>
                Supervise assets undergoing diagnostic overhauls in mechanical depots
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Asset Reg</TableHead>
                    <TableHead>Diagnostic Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Overhaul</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="py-3 font-bold font-mono text-cyan-400 text-xs">
                        {wo.id}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-slate-200">
                        {wo.vehicleReg}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-slate-350 leading-relaxed max-w-[200px] truncate" title={wo.description}>
                        {wo.description}
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            wo.priority === "Critical"
                              ? "bg-red-500/10 text-red-400 border-red-500/20 beacon-crimson animate-pulse"
                              : wo.priority === "High"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          }`}
                        >
                          {wo.priority}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            wo.status === "Resolved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            wo.status === "Resolved" ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"
                          }`} />
                          {wo.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {wo.status !== "Resolved" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleQuickRelease(wo.id)}
                            className="h-7 text-[10px] font-semibold"
                          >
                            Release Unit
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">Overhauled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {workOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 text-xs py-8">
                        No active maintenance tickets logged
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Check-In Toggles for Split-View */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle>Hardware Status Fast-Toggles</CardTitle>
              <CardDescription>
                Check assets into maintenance to update global statuses immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {vehicles.map((v) => {
                const isInShop = v.status === "In Shop";
                const isBusy = v.status === "On Trip";
                
                return (
                  <div
                    key={v.regNo}
                    className="p-3 bg-slate-900/35 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 font-mono block text-xs">{v.regNo}</span>
                      <span className="text-[10px] text-slate-500 block">{v.model}</span>
                    </div>
                    <div>
                      {isInShop ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // Find corresponding active work order and resolve
                            const activeWo = workOrders.find((w) => w.vehicleReg === v.regNo && w.status !== "Resolved");
                            if (activeWo) handleQuickRelease(activeWo.id);
                            else updateVehicleStatus(v.regNo, "Available");
                          }}
                          className="h-7 text-[10px] font-semibold cursor-pointer"
                        >
                          Release
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => {
                            setMaintVehicle(v.regNo);
                            setMaintDesc(`Supervisor manual check-in: Odometer is ${v.odometer}mi.`);
                          }}
                          className="h-7 text-[10px] font-semibold cursor-pointer border-slate-800"
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Side Pane: Scheduler and Logger forms */}
        <div className="space-y-6">
          {/* Log Maintenance Ticket Form */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Schedule Maintenance Work
              </CardTitle>
              <CardDescription>
                Create work orders to update global vehicle badges immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleMaintSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Select Vehicle Asset</label>
                  <select
                    value={maintVehicle}
                    onChange={(e) => setMaintVehicle(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Asset --</option>
                    {vehicles
                      .filter((v) => v.status !== "In Shop" && v.status !== "Retired")
                      .map((v) => (
                        <option key={v.regNo} value={v.regNo}>
                          {v.regNo} - {v.model} ({v.status})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Priority Severity</label>
                  <select
                    value={maintPriority}
                    onChange={(e) => setMaintPriority(e.target.value as any)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Issue Description</label>
                  <textarea
                    placeholder="Enter diagnostic details..."
                    value={maintDesc}
                    onChange={(e) => setMaintDesc(e.target.value)}
                    className="w-full min-h-[60px] p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-9 text-xs font-semibold justify-center cursor-pointer">
                  Log Ticket & Depot Check In
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Log Fuel/Expenses Form */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-cyan-400" />
                Operational Expense Logger
              </CardTitle>
              <CardDescription>
                Record highway tolls, fuel costs, and liters consumed
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Select Vehicle Asset</label>
                  <select
                    value={expVehicle}
                    onChange={(e) => setExpVehicle(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Asset --</option>
                    {vehicles.map((v) => (
                      <option key={v.regNo} value={v.regNo}>
                        {v.regNo} - {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Fuel Logged (Liters)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={expLiters}
                      onChange={(e) => setExpLiters(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Fuel Cost ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={expCost}
                      onChange={(e) => setExpCost(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Highway Tolls ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={expTolls}
                      onChange={(e) => setExpTolls(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Logging Date</label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-9 text-xs font-semibold justify-center cursor-pointer">
                  Log Expense Audit
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Custom Toast Banner Alert */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-slate-900/95 border border-cyan-500/35 text-cyan-300 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 z-50 animate-bounce max-w-sm">
          <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
