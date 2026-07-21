"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Structure definition for Company records
interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string | null;
  website?: string | null;
  status: string;
}

// Company context properties definition
interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: number | null;
  selectedCompany: Company | null;
  setSelectedCompanyId: (id: number | null) => void;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

// Create React Context
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

/**
 * CompanyProvider Component
 * Manages the list of companies and the globally selected company state.
 * Syncs the selected company ID with localStorage to maintain selection across reloads.
 */
export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all companies from the API
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
        
        // Initialize selection from localStorage or default to the first active company
        const savedId = localStorage.getItem("selectedCompanyId");
        if (savedId) {
          const parsed = parseInt(savedId, 10);
          if (data.some((c: Company) => c.id === parsed)) {
            setSelectedCompanyIdState(parsed);
            setLoading(false);
            return;
          }
        }

        // Default to first active company if no valid saved ID
        const firstActive = data.find((c: Company) => c.status === "ACTIVE");
        if (firstActive) {
          setSelectedCompanyIdState(firstActive.id);
          localStorage.setItem("selectedCompanyId", firstActive.id.toString());
        } else if (data.length > 0) {
          setSelectedCompanyIdState(data[0].id);
          localStorage.setItem("selectedCompanyId", data[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Error loading companies context:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run company list fetching on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Update selected ID and save to local storage
  const setSelectedCompanyId = (id: number | null) => {
    setSelectedCompanyIdState(id);
    if (id !== null) {
      localStorage.setItem("selectedCompanyId", id.toString());
    } else {
      localStorage.removeItem("selectedCompanyId");
    }
  };

  // Find the full company object matching the selected ID
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompanyId,
        selectedCompany,
        setSelectedCompanyId,
        loading,
        refreshCompanies: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

/**
 * useCompany custom hook
 * Standard React hook to consume CompanyContext values easily in children components.
 */
export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
