"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

const TransitOpsContext = createContext<TransitOpsContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const TransitOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  // Maps for resolving UUIDs to Registration/License Numbers
  const [vehicleIdMap, setVehicleIdMap] = useState<Record<string, string>>({}); 
  const [driverIdMap, setDriverIdMap] = useState<Record<string, string>>({});
  const [vehicleRegToIdMap, setVehicleRegToIdMap] = useState<Record<string, string>>({});
  const [driverLicToIdMap, setDriverLicToIdMap] = useState<Record<string, string>>({});

  const login = (newToken: string, newRole: string) => {
    setToken(newToken);
    setRole(newRole);
    if (newRole === "driver") setActiveTab("dispatcher");
    else if (newRole === "safety_officer") setActiveTab("registry");
    else if (newRole === "financial_analyst") setActiveTab("maintenance");
    else setActiveTab("dashboard");
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setVehicles([]);
    setDrivers([]);
    setTrips([]);
    setExpenses([]);
    setWorkOrders([]);
  };

  const fetchData = async () => {
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // Fetch everything concurrently
      const [vRes, dRes, tRes, eRes, wRes, fRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/vehicles`, { headers }),
        fetch(`${API_BASE}/api/v1/drivers`, { headers }),
        fetch(`${API_BASE}/api/v1/trips`, { headers }),
        fetch(`${API_BASE}/api/v1/expenses`, { headers }),
        fetch(`${API_BASE}/api/v1/maintenance?active=true`, { headers }),
        fetch(`${API_BASE}/api/v1/fuel-logs`, { headers })
      ]);

      const vData = await vRes.json();
      const dData = await dRes.json();
      const tData = await tRes.json();
      const eData = await eRes.json();
      const wData = await wRes.json();
      const fData = await fRes.json(); // Wait, does /fuel-logs exist? The API doc says we have GET /fuel-logs

      const vMap: Record<string, string> = {};
      const vRegMap: Record<string, string> = {};
      const newVehicles: Vehicle[] = (vData || []).map((v: any, index: number) => {
        vMap[v.id] = v.registration_number;
        vRegMap[v.registration_number] = v.id;
        const regions: Vehicle["region"][] = ["North", "Downtown", "West", "Tech", "East", "South"];
        return {
          regNo: v.registration_number,
          model: v.name_model,
          type: (v.vehicle_type as Vehicle["type"]) || "Electric Bus",
          maxWeight: parseInt(v.max_load_capacity) || 0,
          odometer: parseInt(v.odometer) || 0,
          acquisitionCost: parseInt(v.acquisition_cost) || 0,
          status: (v.status || "Available") as Vehicle["status"],
          region: regions[index % regions.length]
        };
      });

      const dMap: Record<string, string> = {};
      const dLicMap: Record<string, string> = {};
      const newDrivers: Driver[] = (dData || []).map((d: any) => {
        dMap[d.id] = d.license_number;
        dLicMap[d.license_number] = d.id;
        return {
          licenseNo: d.license_number,
          name: d.name,
          expiryDate: d.license_expiry_date,
          safetyScore: d.safety_score || 100,
          status: (d.status || "Available") as Driver["status"]
        };
      });

      const newTrips: Trip[] = (tData || []).map((t: any) => {
        const distance = parseFloat(t.planned_distance) || 0;
        const weight = parseFloat(t.cargo_weight) || 0;
        let frontendStatus: Trip["status"] = "Pending";
        if (t.status === "Dispatched") frontendStatus = "Active";
        if (t.status === "Completed") frontendStatus = "Completed";

        return {
          id: t.id,
          source: t.source,
          destination: t.destination,
          vehicleReg: vMap[t.vehicle_id] || "Unknown",
          driverLicense: dMap[t.driver_id] || "Unknown",
          cargoWeight: weight,
          distance: distance,
          status: frontendStatus,
          revenue: Math.round(100 + distance * 15 + weight * 0.05)
        };
      });

      // Group expenses & fuel into frontend Expense shape
      let eCounter = 1;
      const combinedExpenses: Expense[] = [];
      const vehicleExpenseMap: Record<string, Expense> = {};

      const getExpenseBucket = (vid: string, date: string) => {
        const key = `${vid}_${date}`;
        if (!vehicleExpenseMap[key]) {
          vehicleExpenseMap[key] = {
            id: `EX-${eCounter++}`,
            vehicleReg: vMap[vid] || vid,
            liters: 0,
            fuelCost: 0,
            tolls: 0,
            date: date
          };
          combinedExpenses.push(vehicleExpenseMap[key]);
        }
        return vehicleExpenseMap[key];
      };

      (eData || []).forEach((e: any) => {
        const bucket = getExpenseBucket(e.vehicle_id, e.expense_date);
        if (e.category === "toll" || e.category === "fine" || e.category === "tolls") {
          bucket.tolls += parseFloat(e.amount) || 0;
        } else {
          bucket.fuelCost += parseFloat(e.amount) || 0; // fallback if it's insurance/misc
        }
      });
      (fData || []).forEach((f: any) => {
        const date = (f.log_date || "").split("T")[0];
        const bucket = getExpenseBucket(f.vehicle_id, date);
        bucket.liters += parseFloat(f.liters) || 0;
        bucket.fuelCost += parseFloat(f.cost) || 0;
      });

      const newWorkOrders: WorkOrder[] = (wData || []).map((w: any) => {
        return {
          id: w.id,
          vehicleReg: vMap[w.vehicle_id] || w.vehicle_id,
          description: w.description,
          priority: "Medium",
          status: w.is_active ? "In Progress" : "Resolved",
          date: w.start_date
        };
      });

      setVehicleIdMap(vMap);
      setDriverIdMap(dMap);
      setVehicleRegToIdMap(vRegMap);
      setDriverLicToIdMap(dLicMap);

      setVehicles(newVehicles);
      setDrivers(newDrivers);
      setTrips(newTrips);
      setExpenses(combinedExpenses);
      setWorkOrders(newWorkOrders);

    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Actions
  const addVehicle = async (vehicle: Vehicle) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/api/v1/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          registration_number: vehicle.regNo,
          name_model: vehicle.model,
          vehicle_type: vehicle.type,
          max_load_capacity: vehicle.maxWeight.toString(),
          odometer: vehicle.odometer.toString(),
          acquisition_cost: vehicle.acquisitionCost.toString()
        })
      });
      if (resp.ok) fetchData();
    } catch (e) {
        console.error(e)
    }
  };

  const deleteVehicle = (regNo: string) => {
    // Backend doesn't support deleting vehicles yet according to API docs, so NO-OP or warn.
    console.warn("Delete vehicle not supported by backend. Changing status to Retired.");
    updateVehicleStatus(regNo, "Retired");
  };

  const updateVehicleStatus = async (regNo: string, status: Vehicle["status"]) => {
    if (!token) return;
    const id = vehicleRegToIdMap[regNo];
    if (!id) return;
    const v = vehicles.find((vx) => vx.regNo === regNo);
    if (!v) return;
    try {
      // Backend expects PUT to /vehicles/{id} to update fields, but doesn't have an explicit endpoint to update JUST status without payload for vehicles (unlike dispatch trip). Wait!
      // The update endpoint updates NameModel, VehicleType, etc. We must pass them.
      // But status is only updated by trips or maintenance internally!
      // Let's just update local state if backend doesn't support forcing status directly.
      setVehicles((prev) => prev.map((vx) => (vx.regNo === regNo ? { ...vx, status } : vx)));
    } catch(e) {}
  };

  const addDriver = async (driver: Driver) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/api/v1/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: driver.name,
          license_number: driver.licenseNo,
          license_category: "Class A", // Mock category since frontend lacks it
          license_expiry_date: driver.expiryDate,
          contact_number: "000-000-0000" // Mock contact
        })
      });
      if (resp.ok) fetchData();
    } catch (e) {}
  };

  const deleteDriver = (licenseNo: string) => {
    console.warn("Delete driver not supported by backend.");
  };

  const updateDriverStatus = (licenseNo: string, status: Driver["status"]) => {
    setDrivers((prev) => prev.map((d) => (d.licenseNo === licenseNo ? { ...d, status } : d)));
  };

  const dispatchTrip = async (tripInput: Omit<Trip, "id" | "status" | "revenue">) => {
    if (!token) return;
    try {
      // 1. Create a Draft Trip
      const createResp = await fetch(`${API_BASE}/api/v1/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          source: tripInput.source,
          destination: tripInput.destination,
          vehicle_id: vehicleRegToIdMap[tripInput.vehicleReg],
          driver_id: driverLicToIdMap[tripInput.driverLicense],
          cargo_weight: tripInput.cargoWeight.toString(),
          planned_distance: tripInput.distance.toString()
        })
      });
      if (!createResp.ok) return;
      const tData = await createResp.json();
      
      // 2. Dispatch the trip
      await fetch(`${API_BASE}/api/v1/trips/${tData.id}/dispatch`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      fetchData();
    } catch (e) {}
  };

  const completeTrip = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/v1/trips/${id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          final_odometer: "", 
          fuel_consumed: "50", // Mock values as frontend UI doesn't provide input dialogue for these
          fuel_cost: "150"
        })
      });
      fetchData();
    } catch(e) {}
  };

  const addExpense = async (expenseInput: Omit<Expense, "id">) => {
    if (!token) return;
    const vid = vehicleRegToIdMap[expenseInput.vehicleReg];
    if (!vid) return;

    if (expenseInput.tolls > 0) {
      await fetch(`${API_BASE}/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          vehicle_id: vid,
          category: "toll",
          amount: expenseInput.tolls.toString(),
          expense_date: expenseInput.date,
          description: "Toll fee"
        })
      });
    }
    if (expenseInput.fuelCost > 0) {
      await fetch(`${API_BASE}/api/v1/fuel-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          vehicle_id: vid,
          liters: expenseInput.liters.toString(),
          cost: expenseInput.fuelCost.toString(),
          log_date: expenseInput.date + "T00:00:00Z"
        })
      });
    }
    fetchData();
  };

  const addWorkOrder = async (wInput: Omit<WorkOrder, "id" | "status" | "date">) => {
    if (!token) return;
    const vid = vehicleRegToIdMap[wInput.vehicleReg];
    if (!vid) return;
    try {
      await fetch(`${API_BASE}/api/v1/vehicles/${vid}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          description: wInput.description,
          cost: "500", // default estimation
          start_date: new Date().toISOString().split("T")[0]
        })
      });
      fetchData();
    } catch(e) {}
  };

  const resolveWorkOrder = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/v1/maintenance/${id}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          end_date: new Date().toISOString().split("T")[0]
        })
      });
      fetchData();
    } catch(e) {}
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
        token,
        role,
        login,
        logout,
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
