"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import AuthModal from "./AuthModal";
import { Database, LogOut, Settings, User } from "lucide-react";

export default function NavbarAuth() {
  const { user, logout, customConfig } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup" | "config">("login");

  const handleOpenLogin = () => {
    setModalMode("login");
    setModalOpen(true);
  };

  const handleOpenConfig = () => {
    setModalMode("config");
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3 font-sans select-none z-40">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-[#f5f0e6]">{user.name}</span>
              <span className="text-[9px] font-bold text-[#7b8c6c] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7b8c6c] animate-pulse" />
                Cloud Active
              </span>
            </div>

            {/* User Icon indicator */}
            <div 
              title={`Logged in as ${user.email}`}
              className="w-8 h-8 rounded-full border border-[#352f2a] flex items-center justify-center bg-[#1c1917] text-[#d9b382] cursor-pointer"
              onClick={handleOpenConfig}
            >
              <User size={14} />
            </div>

            {/* Settings button if custom config is connected */}
            <button
              onClick={handleOpenConfig}
              title="Workspace Config Settings"
              className={`p-1.5 rounded-lg border border-[#28231e] bg-[#151311] hover:border-[#352f2a] hover:bg-[#1c1917] text-[#a89f91] hover:text-[#f5f0e6] transition-colors`}
            >
              <Settings size={14} />
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg border border-[#28231e] bg-[#151311] hover:border-[#d97757]/30 hover:bg-[#1a1715] text-[#a89f91] hover:text-[#d97757] transition-all"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Settings config before login */}
            <button
              onClick={handleOpenConfig}
              title="Workspace DB Setup"
              className="p-2 rounded-xl border border-[#28231e] bg-[#151311] text-[#a89f91] hover:text-[#f5f0e6] hover:border-[#352f2a] transition-all"
            >
              <Settings size={14} />
            </button>

            {/* Connection Trigger */}
            <button
              onClick={handleOpenLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#352f2a] bg-[#1c1917] hover:bg-[#151311] text-[#a89f91] hover:text-[#d9b382] text-xs font-bold rounded-full active:scale-[0.98] transition-all"
            >
              <Database size={13} className="text-[#d9b382]" />
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Embedded Auth Modal */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}
