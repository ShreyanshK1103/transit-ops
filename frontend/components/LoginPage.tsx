"use client";

import React, { useState } from "react";
import { Lock, Mail, Activity, ArrowRight } from "lucide-react";
import { useTransitOps } from "@/context/TransitOpsContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type LoginPageProps = {
  onToggleRegister: () => void;
};

export default function LoginPage({ onToggleRegister }: LoginPageProps) {
  const { login } = useTransitOps();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to authenticate");
      }

      if (data.token) {
        login(data.token, data.role || "fleet_manager");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0f19] relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in-up">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
            <Activity className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            TransitOps
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            AI Smart Transport Operations Platform
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#111727]/80 backdrop-blur-md rounded-2xl border border-white/5 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@transitops.com"
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-[#0b0f19]/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-[#0b0f19]/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <span className="text-sm font-medium text-red-400">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#0b0f19] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating Server...
                </span>
              ) : (
                <span className="flex items-center">
                  Access Secure Terminal
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center px-4">
             <button onClick={onToggleRegister} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors mb-4 block w-full text-center">
               New to TransitOps? Request Terminal Access.
             </button>
             <p className="text-[11px] text-slate-500">
               Secured via FleetCommand Core <br/> Authorized Personnel Only.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
