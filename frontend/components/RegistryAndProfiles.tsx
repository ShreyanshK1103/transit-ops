"use client";

import React, { useState, useMemo } from "react";
import {
  Bus,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  User,
  Calendar,
  Layers,
  CheckCircle,
  FileBadge,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  X,
  Activity,
  SlidersHorizontal,
  Compass
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { useTransitOps, Vehicle, Driver } from "@/context/TransitOpsContext";

export default function RegistryAndProfiles() {
  const {
    vehicles,
    drivers,
    addVehicle,
    deleteVehicle,
    addDriver,
    deleteDriver
  } = useTransitOps();

  // Search/Filter states
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [vehicleRegionFilter, setVehicleRegionFilter] = useState("all");

  // Modals/Forms toggle
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);

  // New vehicle form states
  const [newRegNo, setNewRegNo] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newType, setNewType] = useState<Vehicle["type"]>("Electric Bus");
  const [newMaxWeight, setNewMaxWeight] = useState("");
  const [newOdometer, setNewOdometer] = useState("");
  const [newAcqCost, setNewAcqCost] = useState("");
  const [newRegion, setNewRegion] = useState<Vehicle["region"]>("North");

  // New driver form states
  const [newLicenseNo, setNewLicenseNo] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newSafetyScore, setNewSafetyScore] = useState("95");

  // License checkers relative to 2026-07-12
  const currentDate = new Date("2026-07-12");

  const getLicenseDaysLeft = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const diffTime = exp.getTime() - currentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const checkLicenseStatus = (expiryDateStr: string) => {
    const daysLeft = getLicenseDaysLeft(expiryDateStr);
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 30) return "expiring-soon";
    return "valid";
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegNo || !newModel || !newMaxWeight || !newOdometer || !newAcqCost) return;

    // Check uniqueness
    if (vehicles.some((v) => v.regNo.toLowerCase() === newRegNo.toLowerCase())) {
      alert("Vehicle Registration Number must be unique!");
      return;
    }

    const vehicle: Vehicle = {
      regNo: newRegNo.toUpperCase(),
      model: newModel,
      type: newType,
      maxWeight: Number(newMaxWeight),
      odometer: Number(newOdometer),
      acquisitionCost: Number(newAcqCost),
      status: "Available",
      region: newRegion,
    };

    addVehicle(vehicle);
    setShowAddVehicle(false);
    // Reset
    setNewRegNo("");
    setNewModel("");
    setNewMaxWeight("");
    setNewOdometer("");
    setNewAcqCost("");
    setNewRegion("North");
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicenseNo || !newDriverName || !newExpiryDate || !newSafetyScore) return;

    if (drivers.some((d) => d.licenseNo.toLowerCase() === newLicenseNo.toLowerCase())) {
      alert("License number must be unique!");
      return;
    }

    const driver: Driver = {
      licenseNo: newLicenseNo.toUpperCase(),
      name: newDriverName,
      expiryDate: newExpiryDate,
      safetyScore: Number(newSafetyScore),
      status: "Available",
    };

    addDriver(driver);
    setShowAddDriver(false);
    // Reset
    setNewLicenseNo("");
    setNewDriverName("");
    setNewExpiryDate("");
    setNewSafetyScore("95");
  };

  // 3-Criteria Filter Implementation
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.regNo.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.type.toLowerCase().includes(vehicleSearch.toLowerCase());

      const matchesStatus = vehicleStatusFilter === "all" ? true : v.status === vehicleStatusFilter;
      const matchesType = vehicleTypeFilter === "all" ? true : v.type === vehicleTypeFilter;
      const matchesRegion = vehicleRegionFilter === "all" ? true : v.region === vehicleRegionFilter;

      return matchesSearch && matchesStatus && matchesType && matchesRegion;
    });
  }, [vehicles, vehicleSearch, vehicleStatusFilter, vehicleTypeFilter, vehicleRegionFilter]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase())
    );
  }, [drivers, driverSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Asset Registry & Driver Compliance
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Manage transit fleet registrations, driver safety scores, and licensing regulations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Vehicle Registry Table Card */}
        <Card className="xl:col-span-2 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="pb-3 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Fleet Vehicle Registry</CardTitle>
                <CardDescription>
                  Registration and capacity specifications of active operational hardware
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddVehicle(true)}
                className="h-8 text-xs font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Asset
              </Button>
            </CardHeader>

            {/* Highly Interactive Multi-Criteria Filter Panel */}
            <div className="px-4 py-3 bg-slate-900/20 border-b border-slate-850/80 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search model or reg..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                />
              </div>
              <div>
                <select
                  value={vehicleStatusFilter}
                  onChange={(e) => setVehicleStatusFilter(e.target.value)}
                  className="w-full h-8 px-2 bg-slate-955 border border-slate-850 rounded-lg text-xs text-slate-350 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
              <div>
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) => setVehicleTypeFilter(e.target.value)}
                  className="w-full h-8 px-2 bg-slate-955 border border-slate-850 rounded-lg text-xs text-slate-350 focus:outline-none"
                >
                  <option value="all">All Vehicle Types</option>
                  <option value="Electric Bus">Electric Bus</option>
                  <option value="Light Rail Tram">Light Rail Tram</option>
                  <option value="Metro Train">Metro Train</option>
                </select>
              </div>
              <div>
                <select
                  value={vehicleRegionFilter}
                  onChange={(e) => setVehicleRegionFilter(e.target.value)}
                  className="w-full h-8 px-2 bg-slate-955 border border-slate-850 rounded-lg text-xs text-slate-350 focus:outline-none"
                >
                  <option value="all">All Regions</option>
                  <option value="North">North Region</option>
                  <option value="Downtown">Downtown Region</option>
                  <option value="West">West Region</option>
                  <option value="Tech">Tech Region</option>
                  <option value="East">East Region</option>
                  <option value="South">South Region</option>
                </select>
              </div>
            </div>

            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Model / Type</TableHead>
                    <TableHead>Capacity (kg)</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Acquisition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.regNo} className="hover:bg-slate-800/10">
                      <TableCell className="py-3 font-mono font-bold text-slate-200">
                        <span className="block">{vehicle.regNo}</span>
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">{vehicle.region} Region</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-semibold text-slate-200 block text-xs">{vehicle.model}</span>
                        <span className="text-[10px] text-slate-500 block">{vehicle.type}</span>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-slate-350">
                        {vehicle.maxWeight.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="py-3 text-xs text-slate-350 font-mono">
                        {vehicle.odometer.toLocaleString()} mi
                      </TableCell>
                      <TableCell className="py-3 text-xs text-slate-350 font-mono">
                        ${vehicle.acquisitionCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={vehicle.status} />
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={vehicle.status === "On Trip"}
                          title={vehicle.status === "On Trip" ? "Cannot delete vehicle currently on trip" : "Delete registration"}
                          onClick={() => {
                            if (confirm(`Remove vehicle ${vehicle.regNo} from database?`)) {
                              deleteVehicle(vehicle.regNo);
                            }
                          }}
                          className="h-7 w-7 p-0 justify-center shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 text-xs py-10">
                        No registered vehicles match filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </div>
          <div className="p-3 bg-slate-900/10 border-t border-slate-850 text-right text-xs text-slate-500">
            Total Operational Assets: <strong className="text-slate-350">{vehicles.length} units</strong>
          </div>
        </Card>

        {/* Driver Compliance List Card */}
        <Card className="flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="pb-3 border-b border-slate-850 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Driver Registry & Compliance</CardTitle>
                <CardDescription>
                  Licensing schedules and safety indexes
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAddDriver(true)}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Register
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[480px]">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search drivers by name or license..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                />
              </div>

              {/* Profiles layout */}
              <div className="space-y-3">
                {filteredDrivers.map((driver) => {
                  const licenseStatus = checkLicenseStatus(driver.expiryDate);
                  const daysLeft = getLicenseDaysLeft(driver.expiryDate);

                  return (
                    <div
                      key={driver.licenseNo}
                      className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/20 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 text-xs block">{driver.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">Lic: {driver.licenseNo}</span>
                          </div>
                        </div>
                        <StatusBadge status={driver.status} />
                      </div>

                      {/* Compliance section with warning flags */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5 font-semibold text-[10px] uppercase">
                          <Activity className="w-3.5 h-3.5 text-slate-400" /> Safety Score
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                driver.safetyScore < 85 ? "bg-amber-450" : "bg-emerald-450"
                              }`}
                              style={{ width: `${driver.safetyScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-350">{driver.safetyScore}%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-2 text-[11px]">
                        <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> Expiry Date
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className="font-mono text-slate-350">{driver.expiryDate}</span>
                          {licenseStatus === "expired" ? (
                            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                              Expired
                            </span>
                          ) : licenseStatus === "expiring-soon" ? (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              {daysLeft} days left
                            </span>
                          ) : (
                            <span className="text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-0.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Valid
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Trash action for CRUD deleting */}
                      <div className="flex justify-end pt-1">
                        <button
                          disabled={driver.status === "On Trip"}
                          title={driver.status === "On Trip" ? "Cannot delete driver assigned to active trip" : "Remove Driver"}
                          onClick={() => {
                            if (confirm(`Remove driver ${driver.name} from records?`)) {
                              deleteDriver(driver.licenseNo);
                            }
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Driver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>
          <div className="p-3 bg-slate-900/10 border-t border-slate-850 text-right text-xs text-slate-500">
            Active Drivers: <strong className="text-slate-350">{drivers.length} registered</strong>
          </div>
        </Card>
      </div>

      {/* MODAL WINDOWS FOR CRUD INLINE */}
      {/* 1. Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md relative overflow-hidden bg-slate-950/95 border border-slate-800">
            <button
              onClick={() => setShowAddVehicle(false)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-cyan-400" />
                Register Vehicle Asset
              </CardTitle>
              <CardDescription>
                Record hardware model, capacities, and acquisition cost
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddVehicleSubmit}>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. TX-9999"
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Model Name</label>
                    <input
                      type="text"
                      placeholder="e.g. eBus Gen 3"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Transit Engine Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-350 focus:outline-none"
                    >
                      <option value="Electric Bus">Electric Bus</option>
                      <option value="Light Rail Tram">Light Rail Tram</option>
                      <option value="Metro Train">Metro Train</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Active Region</label>
                    <select
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value as any)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-350 focus:outline-none"
                    >
                      <option value="North">North</option>
                      <option value="Downtown">Downtown</option>
                      <option value="West">West</option>
                      <option value="Tech">Tech</option>
                      <option value="East">East</option>
                      <option value="South">South</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Max Capacity (kg)</label>
                    <input
                      type="number"
                      placeholder="8000"
                      value={newMaxWeight}
                      onChange={(e) => setNewMaxWeight(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Odometer (mi)</label>
                    <input
                      type="number"
                      placeholder="12000"
                      value={newOdometer}
                      onChange={(e) => setNewOdometer(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Cost Price ($)</label>
                    <input
                      type="number"
                      placeholder="220000"
                      value={newAcqCost}
                      onChange={(e) => setNewAcqCost(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 bg-slate-900/30 border-t border-slate-850 flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddVehicle(false)} className="h-8 text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="h-8 text-xs cursor-pointer">
                  Register Asset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Add Driver Modal */}
      {showAddDriver && (
        <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md relative overflow-hidden bg-slate-950/95 border border-slate-800">
            <button
              onClick={() => setShowAddDriver(false)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Register Driver Profile
              </CardTitle>
              <CardDescription>
                Record driver licensing data and compliance targets
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddDriverSubmit}>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-99999"
                      value={newLicenseNo}
                      onChange={(e) => setNewLicenseNo(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Driver Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Richard Roe"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">License Expiry Date</label>
                    <input
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-350 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Initial Safety Score (%)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      placeholder="95"
                      value={newSafetyScore}
                      onChange={(e) => setNewSafetyScore(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none placeholder:text-slate-650"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 bg-slate-900/30 border-t border-slate-850 flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddDriver(false)} className="h-8 text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="h-8 text-xs cursor-pointer">
                  Register Driver
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
