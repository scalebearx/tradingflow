"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Types
interface Broker {
  id: string;
  userId: string;
  exchange: "binance" | "bybit";
  label: string;
  apiKey: string;
  apiSecret: string;
  status: string;
  ipRestricted: boolean;
  credentialsCreatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBrokerRequest {
  exchange: "binance" | "bybit";
  label: string;
  apiKey: string;
  apiSecret: string;
}

interface UpdateBrokerRequest {
  exchange: "binance" | "bybit";
  label: string;
  apiKey: string;
  apiSecret: string;
}

// Get all brokers
export function useBrokers() {
  return useQuery({
    queryKey: ["brokers"],
    queryFn: async (): Promise<Broker[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch brokers");
      }
      
      return response.json();
    },
    staleTime: 0, // Always refetch when component mounts
    gcTime: 0, // Don't cache the data
  });
}

// Get single broker
export function useBroker(id: string) {
  return useQuery({
    queryKey: ["brokers", id],
    queryFn: async (): Promise<Broker[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch broker");
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

// Create broker
export function useCreateBroker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBrokerRequest) => {
      const response = await fetch(`${API_BASE_URL}/api/brokers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to create broker";
        
        if (response.status === 400) {
          errorMessage = "Invalid API credentials or insufficient permissions. Please ensure your API key has Spot Trading, Futures Trading, and Reading permissions enabled.";
        } else if (response.status === 401) {
          errorMessage = "Authentication required. Please sign in again.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        // Try to get error details from response
        try {
          const errorData = await response.text();
          if (errorData) {
            console.error("API Error Details:", errorData);
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        throw new Error(errorMessage);
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brokers"] });
    },
  });
}

// Update broker
export function useUpdateBroker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBrokerRequest }) => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update broker");
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return null;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["brokers"] });
      queryClient.invalidateQueries({ queryKey: ["brokers", id] });
    },
  });
}

// Delete broker
export function useDeleteBroker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete broker");
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brokers"] });
    },
  });
}

// Refresh brokers manually
export function useRefreshBrokers() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ["brokers"] });
  };
} 