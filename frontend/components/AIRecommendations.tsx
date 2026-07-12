"use client";

import React, { useState } from "react";
import { Brain, ArrowUpRight, Zap, Sparkles, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Recommendation {
  id: string;
  title: string;
  category: "rerouting" | "capacity" | "maintenance" | "power";
  impact: string;
  problem: string;
  solution: string;
  applied: boolean;
  applying: boolean;
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "rec-1",
      title: "Reroute Route 101 (Bus 12)",
      category: "rerouting",
      impact: "-14m Delay",
      problem: "Heavy traffic buildup detected on I-95 North corridor.",
      solution: "Divert Bus 12 via Broad Street bypass immediately.",
      applied: false,
      applying: false,
    },
    {
      id: "rec-2",
      title: "Deploy Auxiliary Unit on Route 202",
      category: "capacity",
      impact: "+35% Capacity",
      problem: "Tech District terminal experiencing passenger surge (+140%).",
      solution: "Dispatch standby Electric Bus 88 to run Route 202 Shuttle.",
      applied: false,
      applying: false,
    },
    {
      id: "rec-3",
      title: "Schedule Preemptive Repair (Tram 09)",
      category: "maintenance",
      impact: "Prevent Breakdown",
      problem: "Anomalous heat index detected on front braking resistor coil.",
      solution: "Schedule immediate service check at next terminal depot.",
      applied: false,
      applying: false,
    },
    {
      id: "rec-4",
      title: "Optimize Depot Power Grid Charging",
      category: "power",
      impact: "-18% Power Cost",
      problem: "Peak electric grid pricing spike active for next 2 hours.",
      solution: "Throttle charging rates on Trams 01-05 to 40kW grid draw.",
      applied: false,
      applying: false,
    },
  ]);

  const [toast, setToast] = useState<{ show: boolean; text: string } | null>(null);

  const applyOptimization = (id: string) => {
    // Set applying state
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, applying: true } : rec))
    );

    // Simulate API request
    setTimeout(() => {
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === id ? { ...rec, applying: false, applied: true } : rec
        )
      );
      
      const target = recommendations.find((r) => r.id === id);
      if (target) {
        setToast({
          show: true,
          text: `Applied optimization: "${target.title}" successful!`,
        });
        setTimeout(() => setToast(null), 4000);
      }
    }, 1500);
  };

  const resetOptimizations = () => {
    setRecommendations((prev) =>
      prev.map((rec) => ({ ...rec, applied: false, applying: false }))
    );
  };

  return (
    <Card className="relative overflow-hidden h-full flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 gradient-bg-ai rounded-lg text-violet-300">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                AI Ops Recommendations
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </CardTitle>
            </div>
            <CardDescription>
              Real-time suggestions calculated from live network telemetry
            </CardDescription>
          </div>
          
          <button 
            onClick={resetOptimizations}
            title="Reset recommendations"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-3 pt-3 overflow-y-auto max-h-[360px] pr-1">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 ${
                rec.applied
                  ? "bg-emerald-950/10 border-emerald-500/20 opacity-80"
                  : "bg-slate-900/30 hover:bg-slate-900/50 border-slate-800/80"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    rec.category === "rerouting" ? "bg-cyan-400" :
                    rec.category === "capacity" ? "bg-emerald-400" :
                    rec.category === "maintenance" ? "bg-amber-400" : "bg-violet-400"
                  }`} />
                  {rec.category}
                </span>
                <span className="text-xs bg-slate-950/70 border border-slate-850 px-2 py-0.5 rounded font-bold text-cyan-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                  {rec.impact}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-200 mb-1">{rec.title}</h4>
              <p className="text-[11px] text-slate-400 leading-normal mb-2.5">
                {rec.problem} <span className="text-slate-300 font-semibold">{rec.solution}</span>
              </p>

              <div className="flex justify-end">
                {rec.applied ? (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Applied & Dynamic Rerouted
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant={rec.category === "capacity" || rec.category === "rerouting" ? "primary" : "ai"}
                    disabled={rec.applying}
                    onClick={() => applyOptimization(rec.id)}
                    className="h-7 text-[11px] font-semibold"
                  >
                    {rec.applying ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-slate-900" />
                        Applying...
                      </>
                    ) : (
                      <>
                        Apply
                        <ArrowUpRight className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </div>

      {/* Floating success toast */}
      {toast && (
        <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/95 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}
    </Card>
  );
}
