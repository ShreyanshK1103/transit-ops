"use client";

import React, { useState, useEffect } from "react";
import { Bus, MapPin, Eye, Compass, Info, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

// Define Types
interface Hub {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "terminal" | "hub" | "station";
  passengers: number;
}

interface Vehicle {
  id: string;
  name: string;
  route: string;
  status: "active" | "available" | "maintenance" | "suspended";
  speed: number;
  battery: number;
  load: number;
  type: "Bus" | "Tram" | "Metro";
  progress: number; // 0 to 1 along its route
  startNode: string;
  endNode: string;
}

interface Route {
  id: string;
  name: string;
  color: string;
  path: string; // SVG path string
  nodes: string[]; // Hub IDs in sequence
}

export default function Map() {
  // Hubs coordinates inside a 600x500 viewBox
  const hubs: Hub[] = [
    { id: "north", name: "North Hub", x: 280, y: 50, type: "terminal", passengers: 142 },
    { id: "tech", name: "Tech District", x: 480, y: 120, type: "station", passengers: 89 },
    { id: "downtown", name: "Downtown Central", x: 300, y: 220, type: "hub", passengers: 310 },
    { id: "west", name: "West Port Terminal", x: 80, y: 280, type: "terminal", passengers: 175 },
    { id: "east", name: "East Hub", x: 500, y: 300, type: "station", passengers: 64 },
    { id: "south", name: "South Station", x: 300, y: 400, type: "terminal", passengers: 215 },
  ];

  // Route definitions
  const routes: Route[] = [
    { id: "R1", name: "Route 101 (North-South Express)", color: "#10b981", path: "M 280 50 L 300 220 L 300 400", nodes: ["north", "downtown", "south"] },
    { id: "R2", name: "Route 202 (East-West Shuttle)", color: "#06b6d4", path: "M 80 280 L 300 220 L 500 300", nodes: ["west", "downtown", "east"] },
    { id: "R3", name: "Route 303 (Tech Loop)", color: "#8b5cf6", path: "M 480 120 L 300 220 L 300 400", nodes: ["tech", "downtown", "south"] },
  ];

  // Live vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: "V1", name: "Bus 12", route: "Route 101", status: "active", speed: 38, battery: 74, load: 64, type: "Bus", progress: 0.15, startNode: "north", endNode: "downtown" },
    { id: "V2", name: "Tram 04", route: "Route 202", status: "active", speed: 24, battery: 89, load: 45, type: "Tram", progress: 0.7, startNode: "downtown", endNode: "east" },
    { id: "V3", name: "Bus 88", route: "Route 101", status: "available", speed: 0, battery: 98, load: 0, type: "Bus", progress: 0, startNode: "north", endNode: "north" },
    { id: "V4", name: "Bus 42", route: "Route 303", status: "active", speed: 35, battery: 52, load: 82, type: "Bus", progress: 0.45, startNode: "tech", endNode: "downtown" },
    { id: "V5", name: "Tram 09", route: "Route 202", status: "maintenance", speed: 0, battery: 18, load: 0, type: "Tram", progress: 1.0, startNode: "south", endNode: "south" },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Move active vehicles in a loop to simulate live telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status !== "active") return vehicle;

          let nextProgress = vehicle.progress + 0.015;
          let nextStart = vehicle.startNode;
          let nextEnd = vehicle.endNode;

          if (nextProgress >= 1.0) {
            nextProgress = 0;
            // Swap start and end to reverse path direction
            nextStart = vehicle.endNode;
            // Route logic swaps
            if (vehicle.route === "Route 101") {
              nextEnd = vehicle.endNode === "downtown" ? "south" : vehicle.endNode === "south" ? "north" : "downtown";
            } else if (vehicle.route === "Route 202") {
              nextEnd = vehicle.endNode === "downtown" ? "east" : vehicle.endNode === "east" ? "west" : "downtown";
            } else {
              nextEnd = vehicle.endNode === "downtown" ? "south" : vehicle.endNode === "south" ? "tech" : "downtown";
            }
          }

          // Randomize speed slightly
          const speedVariation = (Math.random() - 0.5) * 4;
          const nextSpeed = Math.max(10, Math.min(50, Math.round(vehicle.speed + speedVariation)));
          // Decrease battery slightly
          const batteryDrop = Math.random() < 0.1 ? 1 : 0;
          const nextBattery = Math.max(5, vehicle.battery - batteryDrop);

          return {
            ...vehicle,
            progress: nextProgress,
            startNode: nextStart,
            endNode: nextEnd,
            speed: nextSpeed,
            battery: nextBattery,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update selected vehicle telemetry fields in sync
  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find((v) => v.id === selectedVehicle.id);
      if (updated) setSelectedVehicle(updated);
    }
  }, [vehicles]);

  // Helper to interpolate coordinates along route lines
  const getVehicleCoordinates = (vehicle: Vehicle) => {
    const startHub = hubs.find((h) => h.id === vehicle.startNode);
    const endHub = hubs.find((h) => h.id === vehicle.endNode);

    if (!startHub || !endHub) return { x: 300, y: 220 };

    // Linear interpolation
    const x = startHub.x + (endHub.x - startHub.x) * vehicle.progress;
    const y = startHub.y + (endHub.y - startHub.y) * vehicle.progress;
    return { x, y };
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filterStatus === "all") return true;
    return v.status === filterStatus;
  });

  return (
    <Card className="col-span-3 lg:col-span-2 overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 px-1">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Live Operations Control Map
              <span className="inline-flex w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            </h3>
            <p className="text-xs text-slate-400">Simulating live network telemetry & routing nodes</p>
          </div>
        </div>
        <div className="flex gap-1.5 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          {["all", "active", "available", "maintenance"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all capitalize cursor-pointer ${
                filterStatus === st
                  ? "bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 h-[420px] lg:h-[500px]">
        {/* SVG Live Map */}
        <div className="lg:col-span-2 relative bg-obsidian-950/40 flex items-center justify-center p-4 border-r border-slate-850">
          <svg
            viewBox="0 0 600 480"
            className="w-full h-full max-h-[460px] text-slate-800"
          >
            {/* Route lines */}
            {routes.map((route) => (
              <path
                key={route.id}
                d={route.path}
                fill="none"
                stroke={route.color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-25 hover:opacity-60 transition-opacity cursor-pointer"
                strokeDasharray="4 4"
              />
            ))}

            {/* Glowing route line animations */}
            {routes.map((route) => (
              <path
                key={`${route.id}-glow`}
                d={route.path}
                fill="none"
                stroke={route.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70 animate-pulse-slow"
              />
            ))}

            {/* Hub Nodes */}
            {hubs.map((hub) => (
              <g key={hub.id} className="cursor-pointer group">
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r="14"
                  className="fill-obsidian-900 stroke-slate-700 stroke-2 group-hover:stroke-cyan-400 transition-all duration-300"
                />
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r="5"
                  className="fill-cyan-400 group-hover:fill-cyan-300 animate-pulse-slow"
                />
                <text
                  x={hub.x}
                  y={hub.y - 20}
                  textAnchor="middle"
                  className="fill-slate-350 text-[10px] font-bold tracking-wide pointer-events-none group-hover:fill-slate-100 transition-colors"
                >
                  {hub.name}
                </text>
              </g>
            ))}

            {/* Simulated Vehicles on Map */}
            {filteredVehicles.map((veh) => {
              const coords = getVehicleCoordinates(veh);
              const isSelected = selectedVehicle?.id === veh.id;

              return (
                <g
                  key={veh.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedVehicle(veh)}
                >
                  {/* Glowing selection circle */}
                  {isSelected && (
                    <circle
                      r="22"
                      className="fill-transparent stroke-cyan-400 stroke-[1.5] animate-ping"
                      style={{ transformOrigin: "0px 0px" }}
                    />
                  )}
                  
                  {/* Status Ring */}
                  <circle
                    r="12"
                    className={`stroke-2 transition-all ${
                      veh.status === "active"
                        ? "fill-emerald-950/90 stroke-emerald-400"
                        : veh.status === "available"
                        ? "fill-cyan-950/90 stroke-cyan-400"
                        : veh.status === "maintenance"
                        ? "fill-amber-950/90 stroke-amber-400"
                        : "fill-red-950/90 stroke-red-400"
                    }`}
                  />

                  {/* Vehicle icon / dot inside */}
                  <circle
                    r="4"
                    className={`transition-colors ${
                      veh.status === "active"
                        ? "fill-emerald-400"
                        : veh.status === "available"
                        ? "fill-cyan-400"
                        : veh.status === "maintenance"
                        ? "fill-amber-400"
                        : "fill-red-400"
                    }`}
                  />
                  
                  {/* Custom tiny text badge */}
                  <text
                    y="22"
                    textAnchor="middle"
                    className={`text-[9px] font-extrabold px-1 rounded transition-colors ${
                      isSelected
                        ? "fill-cyan-400 font-bold"
                        : "fill-slate-400"
                    }`}
                  >
                    {veh.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Compass layout absolute helper */}
          <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            AI Dynamic Tracker Online
          </div>
        </div>

        {/* Telemetry Detail Panel */}
        <div className="p-4 bg-obsidian-950/10 flex flex-col justify-between overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Fleet Live Telemetry
            </h4>

            {selectedVehicle ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      {selectedVehicle.name}
                      <span className="text-xs text-slate-400 font-normal">({selectedVehicle.type})</span>
                    </h5>
                    <p className="text-xs text-slate-400 font-medium">Route: {selectedVehicle.route}</p>
                  </div>
                  <StatusBadge status={selectedVehicle.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Speed</span>
                    <span className="text-sm font-bold text-slate-200">{selectedVehicle.speed} mph</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Est. Battery</span>
                    <span className={`text-sm font-bold ${selectedVehicle.battery < 25 ? 'text-red-400' : 'text-slate-200'}`}>
                      {selectedVehicle.battery}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Pass. Load</span>
                    <span className="text-sm font-bold text-slate-200">{selectedVehicle.load}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Heading</span>
                    <span className="text-sm font-bold text-slate-200 capitalize">
                      {selectedVehicle.status === "active" ? selectedVehicle.endNode : "Stationary"}
                    </span>
                  </div>
                </div>

                {selectedVehicle.status === "active" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Progress to {hubs.find(h => h.id === selectedVehicle.endNode)?.name}</span>
                      <span>{Math.round(selectedVehicle.progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${selectedVehicle.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedVehicle.status === "maintenance" && (
                  <div className="bg-amber-950/20 border border-amber-900/30 text-amber-300 rounded-lg p-3 text-xs leading-relaxed flex gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Critical Diagnostic</strong>
                      Cell imbalance detected in battery modules 4 & 5. Under repair at South Station depot.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a vehicle node on the map to inspect live telemetry dashboard
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-850 pt-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Available Units
            </h5>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {filteredVehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all ${
                    selectedVehicle?.id === v.id
                      ? "bg-slate-900 border-cyan-500/30 text-slate-100"
                      : "bg-slate-950/30 border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-350"
                  }`}
                >
                  <span className="text-xs font-semibold flex items-center gap-2">
                    <Bus className="w-3.5 h-3.5 text-cyan-400" />
                    {v.name}
                  </span>
                  <span className="text-[10px] font-medium">{v.route}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
