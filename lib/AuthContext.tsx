"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  email: string;
  notionPageUrl?: string;
}

export interface CustomNotionConfig {
  apiKey: string;
  usersDbId: string;
  plansDbId: string;
}

interface AuthContextType {
  user: UserProfile | null;
  customConfig: CustomNotionConfig | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  saveCustomConfig: (config: CustomNotionConfig | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [customConfig, setCustomConfig] = useState<CustomNotionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("aarthiai_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to restore saved user", e);
      }
    }

    const savedConfig = localStorage.getItem("aarthiai_notion_config");
    if (savedConfig) {
      try {
        setCustomConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to restore custom Notion config", e);
      }
    }
  }, []);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (customConfig) {
      if (customConfig.apiKey) headers["x-notion-api-key"] = customConfig.apiKey;
      if (customConfig.usersDbId) headers["x-notion-users-db"] = customConfig.usersDbId;
      if (customConfig.plansDbId) headers["x-notion-plans-db"] = customConfig.plansDbId;
    }

    return headers;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      localStorage.setItem("aarthiai_user", JSON.stringify(data.user));
      return true;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      return true;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aarthiai_user");
  };

  const saveCustomConfig = (config: CustomNotionConfig | null) => {
    setCustomConfig(config);
    if (config) {
      localStorage.setItem("aarthiai_notion_config", JSON.stringify(config));
    } else {
      localStorage.removeItem("aarthiai_notion_config");
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        customConfig,
        isLoading,
        error,
        login,
        signup,
        logout,
        saveCustomConfig,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
