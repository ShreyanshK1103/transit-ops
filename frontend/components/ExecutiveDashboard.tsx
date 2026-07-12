"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bus,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Zap,
  Wrench,
  AlertTriangle,
  Coins,
  ShieldAlert
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTransitOps } from "@/context/TransitOpsContext";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function ExecutiveDashboard() {
  const { vehicles, drivers, trips, expenses, workOrders, setActiveTab } = useTransitOps();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Calculations for Bento grid KPIs
  const totalVehiclesCount = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "On Trip").length;
  const availableVehicles = vehicles.filter((v) => v.status === "Available").length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === "In Shop").length;
  
  const activeTrips = trips.filter((t) => t.status === "Active").length;
  const pendingTrips = trips.filter((t) => t.status === "Pending").length;
  
  const driversOnDuty = drivers.filter((d) => d.status === "Available" || d.status === "On Trip").length;

  const fleetUtilization = useMemo(() => {
    const totalUtilizationVehicles = activeVehicles + availableVehicles;
    if (totalUtilizationVehicles === 0) return 0;
    return Math.round((activeVehicles / totalUtilizationVehicles) * 100);
  }, [activeVehicles, availableVehicles]);

  // 2. Calculations for ROI Chart
  // Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  const roiData = useMemo(() => {
    return vehicles.map((v) => {
      // Find trips assigned to this vehicle and sum revenue
      const vTrips = trips.filter((t) => t.vehicleReg === v.regNo);
      const tripRevenue = vTrips.reduce((acc, t) => acc + t.revenue, 0);

      // Find expenses (fuelCost + tolls)
      const vExpenses = expenses.filter((e) => e.vehicleReg === v.regNo);
      const fuelCost = vExpenses.reduce((acc, e) => acc + e.fuelCost, 0);
      const tollsCost = vExpenses.reduce((acc, e) => acc + e.tolls, 0);

      // Calculate maintenance costs from unresolved/resolved work orders (estimated at $450 per order)
      const vWorkOrders = workOrders.filter((w) => w.vehicleReg === v.regNo);
      const maintenanceCost = vWorkOrders.length * 450;

      const totalOpsCosts = fuelCost + tollsCost + maintenanceCost;
      const profit = tripRevenue - totalOpsCosts;
      
      // Calculate ROI: percentage relative to acquisition cost
      const roiDecimal = v.acquisitionCost > 0 ? profit / v.acquisitionCost : 0;
      const roiPercentage = Number((roiDecimal * 100).toFixed(2));

      // Calculate mock fuel efficiency based on type & odometer
      // Electric buses: kWh per mile equivalent (e.g. 1.2 to 2.5), lower is more efficient.
      // Light Rail: lower grid consumption, Metro: high capacity grid.
      let mockEfficiency = 2.4; 
      if (v.type === "Electric Bus") mockEfficiency = Number((1.5 + (v.odometer % 1000) / 1000).toFixed(2));
      else if (v.type === "Light Rail Tram") mockEfficiency = Number((3.1 + (v.odometer % 500) / 500).toFixed(2));
      else if (v.type === "Metro Train") mockEfficiency = Number((4.5 + (v.odometer % 2000) / 2000).toFixed(2));

      return {
        regNo: v.regNo,
        model: v.model,
        revenue: tripRevenue,
        costs: totalOpsCosts,
        roi: roiPercentage,
        efficiency: mockEfficiency, // Liters or kWh equivalent/mi
      };
    });
  }, [vehicles, trips, expenses, workOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Executive Control Dashboard
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Financial trends, fleet utilization performance indexes, and operations logs
          </p>
        </div>
        <div className="text-xs bg-slate-900 border border-slate-800 text-slate-400 font-normal px-3 py-1 rounded-full flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          Central State Synchronized
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Active Vehicles</span>
            <span className="text-2xl font-extrabold text-slate-100">{activeVehicles}</span>
          </CardContent>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Available Fleet</span>
            <span className="text-2xl font-extrabold text-cyan-400">{availableVehicles}</span>
          </CardContent>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">In Maintenance</span>
            <span className="text-2xl font-extrabold text-amber-400">{maintenanceVehicles}</span>
          </CardContent>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Active Trips</span>
            <span className="text-2xl font-extrabold text-emerald-400">{activeTrips}</span>
          </CardContent>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Pending Trips</span>
            <span className="text-2xl font-extrabold text-slate-400">{pendingTrips}</span>
          </CardContent>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Drivers On Duty</span>
            <span className="text-2xl font-extrabold text-slate-100">{driversOnDuty}</span>
          </CardContent>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <CardContent className="p-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Fleet Util.</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-violet-400">{fleetUtilization}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROI and Fuel Efficiency Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-850">
            <CardTitle>Financial ROI & Power Consumption by Vehicle Asset</CardTitle>
            <CardDescription>
              ROI (%) calculated relative to Acquisition costs against Fuel/Energy discharge rates (kWh/mi)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 mt-4">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={roiData}
                  margin={{ top: 10, right: -10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                  <XAxis dataKey="regNo" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#475569" fontSize={11} tickLine={false} label={{ value: 'Vehicle ROI (%)', angle: -90, position: 'insideLeft', fill: '#475569', offset: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={11} tickLine={false} label={{ value: 'Energy consumption (kWh/mi)', angle: 90, position: 'insideRight', fill: '#475569', offset: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 text-xs space-y-1 text-slate-200">
                            <p className="font-bold text-cyan-400">{data.regNo} ({data.model})</p>
                            <p>Revenue Generated: <span className="font-bold text-slate-100">${data.revenue}</span></p>
                            <p>Total Ops Costs: <span className="font-bold text-slate-100">${data.costs}</span></p>
                            <p>Calculated ROI: <span className={`font-bold ${data.roi < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{data.roi}%</span></p>
                            <p>Power Rate: <span className="font-bold text-violet-300">{data.efficiency} kWh/mi</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="roi" name="Vehicle ROI (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Energy consumption rate" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-900/10 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                Compiling ROI parameters...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-850">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Quick Operations Panel
            </CardTitle>
            <CardDescription>
              Deploy dispatches, log maintenance fees, and track drivers in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <button
              onClick={() => setActiveTab("dispatcher")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all cursor-pointer group"
            >
              <div className="text-left">
                <span className="font-bold text-xs text-slate-200 block">Dispatch New Trip</span>
                <span className="text-[10px] text-slate-500">Route standby assets and assign drivers</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setActiveTab("maintenance")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all cursor-pointer group"
            >
              <div className="text-left">
                <span className="font-bold text-xs text-slate-200 block">Log Fuel/Expense</span>
                <span className="text-[10px] text-slate-500">Record costs, liters, and highway tolls</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setActiveTab("maintenance")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all cursor-pointer group"
            >
              <div className="text-left">
                <span className="font-bold text-xs text-slate-200 block">Check In Vehicle to Shop</span>
                <span className="text-[10px] text-slate-500">Toggle asset status to Maintenance</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </CardContent>
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 text-xs text-slate-500 leading-normal flex gap-2">
            <Coins className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            Active operational expenses: <span className="font-bold text-slate-350">${expenses.reduce((acc, e) => acc + e.fuelCost + e.tolls, 0).toLocaleString()}</span> logged across {expenses.length} audits.
          </div>
        </Card>
      </div>
    </div>
  );
}
