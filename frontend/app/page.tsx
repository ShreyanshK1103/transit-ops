"use client";

import React from "react";
import { useTransitOps } from "@/context/TransitOpsContext";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";
import RegistryAndProfiles from "@/components/RegistryAndProfiles";
import SmartTripDispatcher from "@/components/SmartTripDispatcher";
import MaintenanceAndExpenses from "@/components/MaintenanceAndExpenses";

export default function Home() {
  const { activeTab } = useTransitOps();

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in py-2">
      {activeTab === "dashboard" && <ExecutiveDashboard />}
      {activeTab === "registry" && <RegistryAndProfiles />}
      {activeTab === "dispatcher" && <SmartTripDispatcher />}
      {activeTab === "maintenance" && <MaintenanceAndExpenses />}
    </div>
  );
}
