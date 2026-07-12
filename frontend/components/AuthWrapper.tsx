"use client";

import React, { useState } from "react";
import { useTransitOps } from "@/context/TransitOpsContext";
import LoginPage from "@/components/LoginPage";
import RegisterPage from "@/components/RegisterPage";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { token } = useTransitOps();
  const [isLoginView, setIsLoginView] = useState(true);

  if (!token) {
    if (isLoginView) {
      return <LoginPage onToggleRegister={() => setIsLoginView(false)} />;
    }
    return <RegisterPage onToggleLogin={() => setIsLoginView(true)} />;
  }

  return <>{children}</>;
}
