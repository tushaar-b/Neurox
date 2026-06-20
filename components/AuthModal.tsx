"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { X, KeyRound, Database, UserPlus, Info, Check, LogIn } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "config";
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const { login, signup, customConfig, saveCustomConfig, error, clearError, isLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "config">(initialMode);
  
  // Login / Signup State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Custom Notion Config State
  const [apiKey, setApiKey] = useState("");
  const [usersDbId, setUsersDbId] = useState("");
  const [plansDbId, setPlansDbId] = useState("");

  // Populate config on load or config change
  useEffect(() => {
    if (customConfig) {
      setApiKey(customConfig.apiKey || "");
      setUsersDbId(customConfig.usersDbId || "");
      setPlansDbId(customConfig.plansDbId || "");
    } else {
      setApiKey("");
      setUsersDbId("");
      setPlansDbId("");
    }
  }, [customConfig, isOpen]);

  // Reset errors when changing modes
  useEffect(() => {
    clearError();
    setSuccessMsg("");
  }, [mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg("");

    if (mode === "login") {
      const success = await login(email, password);
      if (success) {
        onClose();
      }
    } else if (mode === "signup") {
      const success = await signup(name, email, password);
      if (success) {
        setSuccessMsg("Account registered successfully! You can now log in.");
        setTimeout(() => setMode("login"), 1500);
      }
    } else if (mode === "config") {
      if (!apiKey || !usersDbId || !plansDbId) {
        saveCustomConfig(null); // Clear custom database setting to fallback to defaults
      } else {
        saveCustomConfig({ apiKey, usersDbId, plansDbId });
      }
      setSuccessMsg("Workspace settings saved successfully!");
      setTimeout(() => setMode("login"), 1000);
    }
  };

  const handleResetConfig = () => {
    saveCustomConfig(null);
    setApiKey("");
    setUsersDbId("");
    setPlansDbId("");
    setSuccessMsg("Reset to default system database connection.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col space-y-6 text-[#f5f0e6] font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#a89f91] hover:text-[#f5f0e6] hover:bg-[#151311] rounded-xl transition-all"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div>
          <h3 className="text-xl font-serif font-bold tracking-wide uppercase text-[#f5f0e6]">
            {mode === "login" && "Sign In"}
            {mode === "signup" && "Create Planner Profile"}
            {mode === "config" && "Workspace API Configuration"}
          </h3>
          <p className="text-xs text-[#a89f91] mt-1">
            {mode === "login" && "Access your financial plans and calculations synced securely."}
            {mode === "signup" && "Register your profile inside the database."}
            {mode === "config" && "Customize database IDs to sync to your own personal workspace."}
          </p>
        </div>

        {/* Info alerts */}
        {mode !== "config" && !customConfig && (
          <div className="p-3 bg-[#151311] border border-[#352f2a] rounded-xl flex gap-2 text-[10px] text-[#a89f91]">
            <Info size={14} className="shrink-0 text-[#d9b382]" />
            <span>Currently connected to the default AarthiAI workspace database.</span>
          </div>
        )}

        {/* Success/Error displays */}
        {error && (
          <div className="p-3.5 bg-[#151311] border border-[#d97757]/30 text-[#d97757] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-[#151311] border border-[#7b8c6c]/30 text-[#7b8c6c] rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check size={14} /> {successMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a]"
              />
            </div>
          )}

          {mode !== "config" && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a]"
                />
              </div>
            </>
          )}

          {mode === "config" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound size={12} className="text-[#d9b382]" /> Internal Integration Secret (API Token)
                </label>
                <input
                  type="password"
                  required
                  placeholder="ntn_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={12} className="text-[#d9b382]" /> Users Database ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 385c2d8e16e7802cbb8cefdc..."
                  value={usersDbId}
                  onChange={(e) => setUsersDbId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={12} className="text-[#d9b382]" /> Financial Plans Database ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 385c2d8e16e7801688c1c64..."
                  value={plansDbId}
                  onChange={(e) => setPlansDbId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#151311] border border-[#28231e] rounded-xl text-sm focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none text-[#f5f0e6] transition-all placeholder:text-[#352f2a] font-mono"
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 bg-[#d9b382] hover:bg-[#e0d6c8] active:bg-[#bda07a] disabled:opacity-50 text-[#110f0d] font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(217,179,130,0.15)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-[#110f0d] border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              <>
                <LogIn size={16} /> Sign In
              </>
            ) : mode === "signup" ? (
              <>
                <UserPlus size={16} /> Register Profile
              </>
            ) : (
              "Save Workspace Settings"
            )}
          </button>
        </form>

        {/* Footer controls & toggles */}
        <div className="flex flex-wrap justify-between items-center text-xs pt-4 border-t border-[#28231e] gap-2">
          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-[#a89f91] hover:text-[#f5f0e6] font-semibold transition-colors"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode("config")}
                className="text-[#d9b382] hover:text-[#e0d6c8] font-semibold transition-colors flex items-center gap-1"
              >
                Custom Workspace
              </button>
            </>
          )}

          {mode === "signup" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[#a89f91] hover:text-[#f5f0e6] font-semibold transition-colors"
            >
              Back to Sign In
            </button>
          )}

          {mode === "config" && (
            <>
              <button
                type="button"
                onClick={handleResetConfig}
                className="text-[#d97757] hover:text-red-400 font-semibold transition-colors"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-[#a89f91] hover:text-[#f5f0e6] font-semibold transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
