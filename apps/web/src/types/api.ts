// Authentication types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface CurrentUserResponse {
  user: User;
  session: Session;
}

// Broker types
export interface Broker {
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

export interface CreateBrokerRequest {
  exchange: "binance" | "bybit";
  label: string;
  apiKey: string;
  apiSecret: string;
}

export interface UpdateBrokerRequest {
  exchange: "binance" | "bybit";
  label: string;
  apiKey: string;
  apiSecret: string;
}

// Trading types
export interface OrderItem {
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  price?: number;
  stopPrice?: number;
  market: "spot" | "futures";
  positionSide?: "both" | "long" | "short";
}

export interface Holding {
  symbol: string;
  amount: number;
}

export interface Position {
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

export interface Balance {
  account: "spot" | "futures";
  balance: number;
}

export interface OpenOrder {
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

export interface Order {
  id: string;
  brokerId: string;
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

// Market types
export type Market = "spot" | "futures";
export type Exchange = "binance" | "bybit";
export type OrderSide = "buy" | "sell";
export type PositionSide = "both" | "long" | "short"; 