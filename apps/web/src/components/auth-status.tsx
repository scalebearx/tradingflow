"use client";

import React from "react";
import { useAuth } from "@/hooks";

export function AuthStatus() {
  const { data, isLoading, error } = useAuth();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Checking authentication...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Auth error: {error.message}</div>;
  }

  if (data?.user) {
    return (
      <div className="text-sm text-green-600">
        Authenticated as: {data.user.name} ({data.user.email})
      </div>
    );
  }

  return <div className="text-sm text-yellow-600">Not authenticated</div>;
} 