import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { TransitOpsProvider } from "@/context/TransitOpsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TransitOps | AI Smart Transport Operations Platform",
  description: "AI-powered platform for smart transport operations, real-time tracking, fleet dispatching, and predictive maintenance.",
};

import AuthWrapper from "@/components/AuthWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col lg:flex-row bg-[#0b0f19] text-slate-100 font-sans">
        <TransitOpsProvider>
          <AuthWrapper>
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
                {children}
              </div>
            </main>
          </AuthWrapper>
        </TransitOpsProvider>
      </body>
    </html>
  );
}
