"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
  apiFetch,
} from "@/lib/api-client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  companyId?: number | null;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  canManage: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isEmployee: boolean;
  login: (token: string, user: User) => void;
  signup: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage and verify with /api/auth/me
  const initAuth = async () => {
    try {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) setUser(storedUser);

        // Verify token with backend GET /api/auth/me
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const freshUserData = await res.json();
          setUser(freshUserData);
          setStoredAuth(storedToken, freshUserData);
        } else {
          // Token invalid or expired
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setStoredAuth(newToken, newUser);
  };

  const signup = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setStoredAuth(newToken, newUser);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const refreshUser = async () => {
    const res = await apiFetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      if (token) setStoredAuth(token, data);
    }
  };

  const isAdmin = user?.role === "ADMIN";
  const isHR = user?.role === "HR";
  const isEmployee = user?.role === "EMPLOYEE";
  const canManage = isAdmin || isHR;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        canManage,
        isAdmin,
        isHR,
        isEmployee,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
