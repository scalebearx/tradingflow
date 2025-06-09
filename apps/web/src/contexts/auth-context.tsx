"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import type { User, Session } from "@/types/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { data, isLoading, error } = useAuth();

  const user = data?.user || null;
  const session = data?.session || null;
  const isAuthenticated = !!user && !!session;

  // Redirect to sign-in if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Only redirect if we're not already on the sign-in page
      if (typeof window !== "undefined" && !window.location.pathname.includes("/sign-in")) {
        router.push("/sign-in");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
} 