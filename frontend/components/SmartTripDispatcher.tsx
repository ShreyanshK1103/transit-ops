"use client";

import React, { useState, useMemo } from "react";
import {
  Route,
  Bus,
  User,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Compass,
  Sparkles,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { useTransitOps } from "@/context/TransitOpsContext";

export default function SmartTripDispatcher() {
  const { vehicles, drivers, trips, dispatchTrip, completeTrip } = useTransitOps();

  // Form states
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [distance, setDistance] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const currentDate = new Date("2026-07-12");

  // Helper check: License Expiry relative to 2026-07-12
  const isLicenseExpired = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    return exp.getTime() < currentDate.getTime();
  };

  // 1. Guardrail validation checks
  const selectedVehicleObj = useMemo(() => {
    return vehicles.find((v) => v.regNo === vehicleReg);
  }, [vehicleReg, vehicles]);

  const isOverloaded = useMemo(() => {
    if (!selectedVehicleObj || !cargoWeight) return false;
    return Number(cargoWeight) > selectedVehicleObj.maxWeight;
  }, [selectedVehicleObj, cargoWeight]);

  const selectedDriverObj = useMemo(() => {
    return drivers.find((d) => d.licenseNo === driverLicense);
  }, [driverLicense, drivers]);

  const isDriverUnavailable = useMemo(() => {
    if (!selectedDriverObj) return false;
    return (
      selectedDriverObj.status === "On Trip" ||
      selectedDriverObj.status === "Suspended" ||
      isLicenseExpired(selectedDriverObj.expiryDate)
    );
  }, [selectedDriverObj]);

  // Dropdown list derivations (formatting statuses and graying out)
  const vehicleOptions = useMemo(() => {
    return vehicles.map((v) => {
      const isSelectable = v.status !== "In Shop" && v.status !== "Retired";
      let statusLabel = "";
      if (v.status === "In Shop") statusLabel = " [In Depot/Shop]";
      else if (v.status === "Retired") statusLabel = " [Retired]";
      else if (v.status === "On Trip") statusLabel = " [Active Trip]";

      return {
        regNo: v.regNo,
        model: v.model,
        maxWeight: v.maxWeight,
        isSelectable,
        label: `${v.regNo} - ${v.model}${statusLabel}`,
      };
    });
  }, [vehicles]);

  const driverOptions = useMemo(() => {
    return drivers.map((d) => {
      const isExpired = isLicenseExpired(d.expiryDate);
      const isSelectable = d.status !== "Suspended" && d.status !== "On Trip" && !isExpired;
      
      let statusLabel = "";
      if (isExpired) statusLabel = " [License Expired]";
      else if (d.status === "Suspended") statusLabel = " [Suspended]";
      else if (d.status === "On Trip") statusLabel = " [On Trip]";
      else if (d.status === "Off Duty") statusLabel = " [Off Duty - Override]";

      return {
        licenseNo: d.licenseNo,
        name: d.name,
        isSelectable,
        label: `${d.name} (${d.licenseNo})${statusLabel}`,
      };
    });
  }, [drivers]);

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination || !vehicleReg || !driverLicense || !cargoWeight || !distance) return;

    if (isOverloaded) {
      alert("Cannot dispatch: Cargo weight exceeds chosen vehicle's weight limit!");
      return;
    }

    if (isDriverUnavailable) {
      alert("Cannot dispatch: Assigned driver is currently unavailable or has expired licensing!");
      return;
    }

    setIsSubmitting(true);
    setToastMessage("");

    setTimeout(() => {
      dispatchTrip({
        source,
        destination,
        vehicleReg,
        driverLicense,
        cargoWeight: Number(cargoWeight),
        distance: Number(distance),
      });

      setIsSubmitting(false);
      setToastMessage(`Dispatched vehicle ${vehicleReg} from ${source} to ${destination} successfully!`);
      
      // Reset form
      setSource("");
      setDestination("");
      setVehicleReg("");
      setDriverLicense("");
      setCargoWeight("");
      setDistance("");

      // Clear toast
      setTimeout(() => setToastMessage(""), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Smart Trip Dispatcher
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Launch transit trips, assign drivers, and enforce vehicle compliance guardrails
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane: Trip Creation Form */}
        <Card className="lg:col-span-1 relative overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle>Trip Deployment Launcher</CardTitle>
              <CardDescription>
                Assign drivers to cargo weights with active rule enforcement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleDispatchSubmit} className="space-y-4">
                {/* Source & Destination */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Starting Terminal</label>
                    <input
                      type="text"
                      placeholder="e.g. North Hub"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Destination</label>
                    <input
                      type="text"
                      placeholder="e.g. South Depot"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>

                {/* Distance & Cargo Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Distance (mi)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Cargo Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Dropdown (grey out In Shop / Retired) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Choose Transit Asset</label>
                  <select
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Active Vehicle --</option>
                    {vehicleOptions.map((opt) => (
                      <option
                        key={opt.regNo}
                        value={opt.regNo}
                        disabled={!opt.isSelectable}
                        className={!opt.isSelectable ? "text-slate-600 bg-slate-950" : ""}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver Dropdown (grey out Suspended, Expired, Busy) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Assign Driver Profile</label>
                  <select
                    value={driverLicense}
                    onChange={(e) => setDriverLicense(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    <option value="">-- Assign Driver --</option>
                    {driverOptions.map((opt) => (
                      <option
                        key={opt.licenseNo}
                        value={opt.licenseNo}
                        disabled={!opt.isSelectable}
                        className={!opt.isSelectable ? "text-slate-600 bg-slate-950" : ""}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Overload Alert Banner */}
                {isOverloaded && selectedVehicleObj && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex gap-2 text-red-400 text-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Overload Warning!</strong> Cargo weight ({cargoWeight}kg) exceeds vehicle maximum weight threshold limit ({selectedVehicleObj.maxWeight}kg). Please choose a larger asset or decrease cargo volume.
                    </div>
                  </div>
                )}
                
                {/* Live Driver Warnings Banner */}
                {selectedDriverObj && isLicenseExpired(selectedDriverObj.expiryDate) && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex gap-2 text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">License Compliance Block!</strong> Assigned operator {selectedDriverObj.name} has an expired license. Selection blocked until licensing credentials are updated.
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || isOverloaded || isDriverUnavailable || !vehicleReg || !driverLicense}
                  className="w-full font-semibold h-10 justify-center cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      Broadcasting dispatch telemetry...
                    </>
                  ) : (
                    <>
                      Dispatch Operations
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </div>

          {toastMessage && (
            <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/95 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce shadow-2xl z-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-450 shrink-0" />
              {toastMessage}
            </div>
          )}

          <div className="p-4 bg-slate-950/20 border-t border-slate-850 text-[11px] text-slate-500 flex gap-2 leading-relaxed">
            <Scale className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            Live validations compare assigned weight with physical maximum loads. Retired and maintenance status assets are filtered from selectors automatically.
          </div>
        </Card>

        {/* Right Pane: Active Dispatches Tracking Panel */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle>Active Operational Dispatches</CardTitle>
              <CardDescription>
                Live dashboard of transit fleets currently deployed on routes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Route Path</TableHead>
                    <TableHead>Driver License</TableHead>
                    <TableHead>Cargo (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Est. Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="py-3.5 font-bold font-mono text-cyan-400">
                        {trip.id}
                      </TableCell>
                      <TableCell className="py-3.5 font-semibold text-slate-200">
                        {trip.vehicleReg}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-350 leading-relaxed">
                        <span className="block font-medium">{trip.source}</span>
                        <span className="text-slate-550 flex items-center gap-1">
                          to {trip.destination} ({trip.distance} mi)
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-450 font-mono">
                        {trip.driverLicense}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-300 font-mono">
                        {trip.cargoWeight.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            trip.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 beacon-emerald animate-pulse"
                              : trip.status === "Completed"
                              ? "bg-slate-700/20 text-slate-400 border-slate-700/30"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 text-right font-extrabold text-xs text-emerald-400 font-mono">
                        <div className="flex items-center justify-end gap-2.5">
                          <span>${trip.revenue.toLocaleString()}</span>
                          {trip.status === "Active" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                completeTrip(trip.id);
                                setToastMessage(`Trip ${trip.id} completed. Vehicle and Driver released.`);
                                setTimeout(() => setToastMessage(""), 4000);
                              }}
                              className="h-7 text-[10px] font-semibold border-slate-800"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {trips.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 text-xs py-12">
                        No active dispatches. Select a standby asset and run a route dispatch launcher above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </div>
          <div className="p-3 bg-slate-900/10 border-t border-slate-850 text-right text-xs text-slate-500">
            Total active revenue load: <strong className="text-emerald-450 font-bold">${trips.reduce((acc, t) => acc + t.revenue, 0).toLocaleString()}</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
