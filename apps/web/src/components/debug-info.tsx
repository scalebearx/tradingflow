"use client";

import React from "react";

export function DebugInfo() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  return (
    <div className="rounded-lg border p-4 text-xs">
      <h3 className="font-semibold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>API URL: {apiUrl || "Not set"}</div>
        <div>Current Path: {typeof window !== "undefined" ? window.location.pathname : "SSR"}</div>
        <div>Environment: {process.env.NODE_ENV}</div>
      </div>
    </div>
  );
} 