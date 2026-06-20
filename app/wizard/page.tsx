"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WizardProvider, useWizard } from "../../components/wizard/WizardContext";
import StepEmployment from "../../components/wizard/StepEmployment";
import StepExpenses from "../../components/wizard/StepExpenses";
import StepBuffer from "../../components/wizard/StepBuffer";
import StepInvesting from "../../components/wizard/StepInvesting";
import NavbarAuth from "../../components/NavbarAuth";
import { useAuth } from "../../lib/AuthContext";
import { 
  ShieldCheck, 
  User, 
  Briefcase, 
  Receipt,
  Hexagon,
  Settings,
  HelpCircle,
  RefreshCw,
  Bell,
  History
} from "lucide-react";

function WizardForm() {
  const { step, isCompleted } = useWizard();
  const router = useRouter();

  const { user, login, signup, error, clearError, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAuthSuccess("");
    if (authMode === "login") {
      await login(authEmail, authPassword);
    } else {
      const ok = await signup(authName, authEmail, authPassword);
      if (ok) {
        setAuthSuccess("Profile created! You can now sign in.");
        setTimeout(() => setAuthMode("login"), 1500);
      }
    }
  };

  useEffect(() => {
    if (isCompleted) {
      router.push("/results");
    }
  }, [isCompleted, router]);

  const stepsList = [
    { label: "Employment", icon: Briefcase },
    { label: "Expenses", icon: Receipt },
    { label: "Safety Buffer", icon: ShieldCheck },
    { label: "Investing Profile", icon: User },
  ];

  if (!user) {
    return (
      <div className="relative min-h-screen w-full bg-[#110f0d] text-[#f5f0e6] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#1c1917] border border-[#28231e] rounded-3xl p-8 shadow-2xl flex flex-col space-y-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#f5f0e6] uppercase tracking-wide">Secure Access Gate</h2>
            <p className="text-xs text-[#a89f91] mt-1">Please sign in or register to launch the volatility planning suite.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-[#151311] border border-[#d97757]/30 text-[#d97757] rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 bg-[#151311] border border-[#7b8c6c]/30 text-[#7b8c6c] rounded-xl text-xs font-semibold">
              {authSuccess}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="jane.doe@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-[#d9b382] hover:bg-[#e0d6c8] active:bg-[#bda07a] disabled:opacity-50 text-[#110f0d] font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(217,179,130,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-[#110f0d] border-t-transparent rounded-full animate-spin" />
              ) : authMode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="flex justify-between items-center text-xs pt-4 border-t border-[#28231e]">
            {authMode === "login" ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  clearError();
                }}
                className="text-[#a89f91] hover:text-[#f5f0e6] font-semibold transition-colors cursor-pointer"
              >
                Create new profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  clearError();
                }}
                className="text-[#a89f91] hover:text-[#f5f0e6] font-semibold transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#110f0d] text-[#f5f0e6] flex overflow-hidden font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 lg:w-72 border-r border-[#28231e] bg-[#151311] flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-6 space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded border border-[#352f2a] flex items-center justify-center bg-[#1c1917]">
              <Hexagon size={20} className="text-[#d9b382]" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg tracking-wide leading-tight">WealthCommand</h1>
              <p className="text-[9px] uppercase tracking-widest text-[#a89f91] font-semibold mt-0.5">Institutional Grade</p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="space-y-2">
            {stepsList.map((s, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              const Icon = s.icon;

              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-[#1c1917] border border-[#352f2a] text-[#f5f0e6] shadow-sm" 
                      : isDone
                      ? "text-[#a89f91] hover:text-[#d9b382]"
                      : "text-[#6b635a]"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-[#d9b382]" : ""} />
                  <span className="text-sm font-medium">{s.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d9b382] ml-auto" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Links */}
        <div className="p-6 space-y-5 border-t border-[#28231e]">
          <button className="flex items-center gap-3 text-[#a89f91] hover:text-[#f5f0e6] text-sm font-medium transition-colors w-full">
            <Settings size={18} />
            Settings
          </button>
          <button className="flex items-center gap-3 text-[#a89f91] hover:text-[#f5f0e6] text-sm font-medium transition-colors w-full">
            <HelpCircle size={18} />
            Support
          </button>
          <Link href="/history" className="flex items-center gap-3 text-[#a89f91] hover:text-[#f5f0e6] text-sm font-medium transition-colors w-full">
            <History size={18} />
            History
          </Link>
          
          <div className="mt-6">
            <NavbarAuth />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* Background Video */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none z-0"
        >
          <source src="/yy.mp4" type="video/mp4" />
        </video>
        
        {/* Top Header */}
        <header className="px-10 py-6 flex items-center justify-between sticky top-0 bg-[#110f0d]/95 backdrop-blur z-20 border-b border-[#28231e]">
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e6]">Financial Suite</h2>

        </header>

        {/* Form Container */}
        <div className="flex-1 p-6 md:p-12 max-w-5xl w-full">
          {step === 1 && <StepEmployment />}
          {step === 2 && <StepExpenses />}
          {step === 3 && <StepBuffer />}
          {step === 4 && <StepInvesting />}
        </div>
      </main>
    </div>
  );
}

export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardForm />
    </WizardProvider>
  );
}
