"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Types
interface OrderItem {
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  price?: number;
  stopPrice?: number;
  market: "spot" | "futures";
  positionSide?: "both" | "long" | "short";
}

// Order schema types matching the API
interface OrderParams {
  type: "market" | "limit" | "stop_loss_limit" | "stop_loss_market";
  quantity: number;
  side: "buy" | "sell";
  price?: number;
  stopPrice?: number;
}

interface OrderSchema {
  orderId: string;
  parentOrderId?: string;
  orderParams: OrderParams;
}

interface OrderListItem {
  market: "spot" | "futures";
  symbol: string;
  batchOrders: OrderSchema[];
  subOrderList: {
    batchOrders: OrderSchema[];
  }[];
}

type OrderList = OrderListItem[];

interface Holding {
  symbol: string;
  amount: number;
}

interface Position {
  symbol: string;
  positionSide: "both" | "long" | "short";
  quantity: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  amount: number;
  entryPrice: number;
  markPrice: number;
  updatedAt: Date;
}

interface Balance {
  account: "spot" | "futures";
  balance: number;
}

interface OpenOrder {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  positionSide?: "both" | "long" | "short";
  type: string;
  price?: number;
  stopPrice?: number;
  quantity: number;
  filledQuantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Submit order list
export function useSubmitOrderList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ brokerId, orderList }: { brokerId: string; orderList: OrderList }) => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${brokerId}/order-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderList),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit order list");
      }
    },
    onSuccess: (_, { brokerId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["orders", brokerId] });
      queryClient.invalidateQueries({ queryKey: ["open-orders", brokerId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", brokerId] });
      queryClient.invalidateQueries({ queryKey: ["positions", brokerId] });
    },
  });
}

// Get holdings
export function useHoldings(brokerId: string) {
  return useQuery({
    queryKey: ["holdings", brokerId],
    queryFn: async (): Promise<Holding[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${brokerId}/holdings`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch holdings");
      }
      
      return response.json();
    },
    enabled: !!brokerId,
    staleTime: 30 * 1000, // 30 seconds (matches API cache)
  });
}

// Get positions
export function usePositions(brokerId: string) {
  return useQuery({
    queryKey: ["positions", brokerId],
    queryFn: async (): Promise<Position[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${brokerId}/positions`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }
      
      return response.json();
    },
    enabled: !!brokerId,
    staleTime: 30 * 1000, // 30 seconds (matches API cache)
  });
}

// Get balance history
export function useBalanceHistory(brokerId: string, days: number = 30) {
  return useQuery({
    queryKey: ["balance-history", brokerId, days],
    queryFn: async (): Promise<{ date: string; balance: Balance[] | null }[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${brokerId}/balance?days=${days}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch balance history");
      }
      
      return response.json();
    },
    enabled: !!brokerId,
    staleTime: 30 * 1000, // 30 seconds (matches API cache)
  });
}

// Get current balance (for backward compatibility)
export function useBalance(brokerId: string) {
  return useQuery({
    queryKey: ["balance", brokerId],
    queryFn: async (): Promise<Balance[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${brokerId}/balance?days=1`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      
      const data = await response.json();
      return data[0]?.balance || [];
    },
    enabled: !!brokerId,
    staleTime: 30 * 1000, // 30 seconds (matches API cache)
  });
}

// Get open orders
export function useOpenOrders(brokerId: string, market: "spot" | "futures") {
  return useQuery({
    queryKey: ["open-orders", brokerId, market],
    queryFn: async (): Promise<OpenOrder[]> => {
      const response = await fetch(`${API_BASE_URL}/api/brokers/${brokerId}/open-orders/${market}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch open orders");
      }
      
      return response.json();
    },
    enabled: !!brokerId && !!market,
    staleTime: 30 * 1000, // 30 seconds (matches API cache)
  });
}

// Get spot open orders
export function useSpotOpenOrders(brokerId: string) {
  return useOpenOrders(brokerId, "spot");
}

// Get futures open orders
export function useFuturesOpenOrders(brokerId: string) {
  return useOpenOrders(brokerId, "futures");
}

// Get orders by broker ID
export function useOrders(brokerId: string) {
  return useQuery({
    queryKey: ["orders", brokerId],
    queryFn: async (): Promise<Order[]> => {
      const response = await fetch(`${API_BASE_URL}/api/orders/${brokerId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      
      return response.json();
    },
    enabled: !!brokerId,
  });
}