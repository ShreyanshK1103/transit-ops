"use client";

import React, { createContext, useContext, useState } from "react";

export type TabType = "dashboard" | "registry" | "dispatcher" | "maintenance";

export interface Vehicle {
  regNo: string; // Unique
  model: string;
  type: "Electric Bus" | "Light Rail Tram" | "Metro Train";
  maxWeight: number; // in kg
  odometer: number;
  acquisitionCost: number;
  status: "Available" | "On Trip" | "In Shop" | "Retired";
  region: "North" | "Downtown" | "West" | "Tech" | "East" | "South";
}

export interface Driver {
  licenseNo: string;
  name: string;
  expiryDate: string; // YYYY-MM-DD
  safetyScore: number; // 0 to 100
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleReg: string;
  driverLicense: string;
  cargoWeight: number;
  distance: number;
  status: "Active" | "Completed" | "Pending";
  revenue: number;
}

export interface Expense {
  id: string;
  vehicleReg: string;
  liters: number;
  fuelCost: number;
  tolls: number;
  date: string;
}

export interface WorkOrder {
  id: string;
  vehicleReg: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Diagnosing" | "In Progress" | "Resolved";
  date: string;
}

interface TransitOpsContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  expenses: Expense[];
  workOrders: WorkOrder[];
  addVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (regNo: string) => void;
  updateVehicleStatus: (regNo: string, status: Vehicle["status"]) => void;
  addDriver: (driver: Driver) => void;
  deleteDriver: (licenseNo: string) => void;
  updateDriverStatus: (licenseNo: string, status: Driver["status"]) => void;
  dispatchTrip: (trip: Omit<Trip, "id" | "status" | "revenue">) => void;
  completeTrip: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  addWorkOrder: (workOrder: Omit<WorkOrder, "id" | "status" | "date">) => void;
  resolveWorkOrder: (id: string) => void;
}

const TransitOpsContext = createContext<TransitOpsContextType | undefined>(undefined);

export const TransitOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Mock initial vehicles (with regions)
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { regNo: "TX-1001", model: "eBus Max 300", type: "Electric Bus", maxWeight: 8000, odometer: 18450, acquisitionCost: 280000, status: "Available", region: "North" },
    { regNo: "TX-1002", model: "FlexRail Tram S2", type: "Light Rail Tram", maxWeight: 14000, odometer: 42900, acquisitionCost: 750000, status: "On Trip", region: "Downtown" },
    { regNo: "TX-1003", model: "eBus Shuttle X", type: "Electric Bus", maxWeight: 4000, odometer: 8200, acquisitionCost: 150000, status: "Available", region: "West" },
    { regNo: "TX-1004", model: "eBus City Express", type: "Electric Bus", maxWeight: 7500, odometer: 32600, acquisitionCost: 240000, status: "In Shop", region: "Tech" },
    { regNo: "TX-1005", model: "RedLine Metro Train", type: "Metro Train", maxWeight: 35000, odometer: 124800, acquisitionCost: 1800000, status: "On Trip", region: "East" },
    { regNo: "TX-1006", model: "eBus Vintage", type: "Electric Bus", maxWeight: 6000, odometer: 29400, acquisitionCost: 110000, status: "Retired", region: "South" },
  ]);

  // Mock initial drivers
  const [drivers, setDrivers] = useState<Driver[]>([
    { licenseNo: "DL-64210", name: "Alex Rivera", expiryDate: "2026-08-01", safetyScore: 98, status: "Available" },
    { licenseNo: "DL-90831", name: "Sarah Jenkins", expiryDate: "2027-10-15", safetyScore: 96, status: "On Trip" },
    { licenseNo: "DL-11048", name: "Marcus Vance", expiryDate: "2026-06-30", safetyScore: 82, status: "Off Duty" },
    { licenseNo: "DL-88349", name: "Linda Thorne", expiryDate: "2026-07-28", safetyScore: 94, status: "Available" },
    { licenseNo: "DL-24519", name: "David Kim", expiryDate: "2029-05-20", safetyScore: 78, status: "Suspended" },
  ]);

  // Mock initial trips
  const [trips, setTrips] = useState<Trip[]>([
    { id: "TR-201", source: "North Depot", destination: "Downtown Central", vehicleReg: "TX-1002", driverLicense: "DL-90831", cargoWeight: 4500, distance: 18.5, status: "Active", revenue: 850 },
    { id: "TR-202", source: "West Port", destination: "Tech District", vehicleReg: "TX-1005", driverLicense: "DL-90831", cargoWeight: 18000, distance: 34.2, status: "Active", revenue: 2200 },
  ]);

  // Mock initial expenses
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "EX-501", vehicleReg: "TX-1001", liters: 0, fuelCost: 250, tolls: 45, date: "2026-07-10" },
    { id: "EX-502", vehicleReg: "TX-1002", liters: 0, fuelCost: 400, tolls: 80, date: "2026-07-11" },
    { id: "EX-503", vehicleReg: "TX-1004", liters: 0, fuelCost: 1200, tolls: 0, date: "2026-07-12" },
  ]);

  // Mock initial work orders
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    { id: "WO-901", vehicleReg: "TX-1004", description: "Diagnostics scan reported braking coil overheating.", priority: "High", status: "In Progress", date: "2026-07-12" },
  ]);

  // Actions
  const addVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) => [...prev, vehicle]);
  };

  const deleteVehicle = (regNo: string) => {
    setVehicles((prev) => prev.filter((v) => v.regNo !== regNo));
  };

  const updateVehicleStatus = (regNo: string, status: Vehicle["status"]) => {
    setVehicles((prev) =>
      prev.map((v) => (v.regNo === regNo ? { ...v, status } : v))
    );
  };

  const addDriver = (driver: Driver) => {
    setDrivers((prev) => [...prev, driver]);
  };

  const deleteDriver = (licenseNo: string) => {
    setDrivers((prev) => prev.filter((d) => d.licenseNo !== licenseNo));
  };

  const updateDriverStatus = (licenseNo: string, status: Driver["status"]) => {
    setDrivers((prev) =>
      prev.map((d) => (d.licenseNo === licenseNo ? { ...d, status } : d))
    );
  };

  const dispatchTrip = (tripInput: Omit<Trip, "id" | "status" | "revenue">) => {
    const tripId = `TR-${201 + trips.length}`;
    const estimatedRevenue = Math.round(100 + tripInput.distance * 15 + tripInput.cargoWeight * 0.05);

    const newTrip: Trip = {
      ...tripInput,
      id: tripId,
      status: "Active",
      revenue: estimatedRevenue,
    };

    setTrips((prev) => [newTrip, ...prev]);

    // Update vehicle and driver status to "On Trip"
    updateVehicleStatus(tripInput.vehicleReg, "On Trip");
    updateDriverStatus(tripInput.driverLicense, "On Trip");
  };

  const completeTrip = (id: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t))
    );
    
    // Release the assigned vehicle and driver back to "Available"
    const targetTrip = trips.find((t) => t.id === id);
    if (targetTrip) {
      updateVehicleStatus(targetTrip.vehicleReg, "Available");
      updateDriverStatus(targetTrip.driverLicense, "Available");
    }
  };

  const addExpense = (expenseInput: Omit<Expense, "id">) => {
    const expenseId = `EX-${501 + expenses.length}`;
    const newExpense: Expense = {
      ...expenseInput,
      id: expenseId,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const addWorkOrder = (workOrderInput: Omit<WorkOrder, "id" | "status" | "date">) => {
    const workOrderId = `WO-${901 + workOrders.length}`;
    const newWorkOrder: WorkOrder = {
      ...workOrderInput,
      id: workOrderId,
      status: "In Progress",
      date: new Date().toISOString().split("T")[0],
    };
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    updateVehicleStatus(workOrderInput.vehicleReg, "In Shop");
  };

  const resolveWorkOrder = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === id ? { ...wo, status: "Resolved" } : wo))
    );
    const targetWo = workOrders.find((wo) => wo.id === id);
    if (targetWo) {
      updateVehicleStatus(targetWo.vehicleReg, "Available");
    }
  };

  return (
    <TransitOpsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        vehicles,
        drivers,
        trips,
        expenses,
        workOrders,
        addVehicle,
        deleteVehicle,
        updateVehicleStatus,
        addDriver,
        deleteDriver,
        updateDriverStatus,
        dispatchTrip,
        completeTrip,
        addExpense,
        addWorkOrder,
        resolveWorkOrder,
      }}
    >
      {children}
    </TransitOpsContext.Provider>
  );
};

export const useTransitOps = () => {
  const context = useContext(TransitOpsContext);
  if (!context) {
    throw new Error("useTransitOps must be used within a TransitOpsProvider");
  }
  return context;
};
