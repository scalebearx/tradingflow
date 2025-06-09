"use client";

import { useQuery } from "@tanstack/react-query";
import type { CurrentUserResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Get current user
export function useAuth() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<CurrentUserResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/current-user`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch current user");
      }

      return response.json();
    },
  });
}