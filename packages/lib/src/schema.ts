import { pgTable, text, timestamp, boolean, unique, doublePrecision } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const brokers = pgTable(
  "brokers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    exchange: text("exchange").$type<"binance" | "bybit">().notNull(),
    label: text("label").notNull(),
    apiKey: text("api_key").notNull(),
    apiSecret: text("api_secret").notNull(),
    status: text("status").$type<"ok" | "bad">().notNull(),
    ipRestricted: boolean("ip_restricted").default(false).notNull(),
    credentialsCreatedAt: timestamp("credentials_created_at").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique("broker_user_label_unique").on(t.userId, t.label), unique("broker_api_key_api_secret_unique").on(t.apiKey, t.apiSecret)]
);

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  parentOrderId: text("parent_order_id"),
  symbol: text("symbol").notNull(),
  market: text("market").$type<"spot" | "futures">().notNull(),
  side: text("side").$type<"buy" | "sell">().notNull(),
  type: text("type").$type<"market" | "limit" | "stop_loss_limit" | "stop_loss_market">().notNull(),
  price: doublePrecision("price"),
  quantity: doublePrecision("quantity").notNull(),
  stopPrice: doublePrecision("stop_price"),
  status: text("status").$type<"open" | "pending" | "filled" | "cancelled" | "rejected">().default("pending").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
  brokerId: text("broker_id")
    .notNull()
    .references(() => brokers.id, { onDelete: "cascade" }),
});

import { z } from "zod/v4";

export const orderSchema = z
  .object({
    orderId: z.string(),
    parentOrderId: z.string().optional(),
    orderParams: z.object({
      type: z.union([z.literal("market"), z.literal("limit"), z.literal("stop_loss_limit"), z.literal("stop_loss_market")]),
      quantity: z.number().positive(),
      side: z.union([z.literal("buy"), z.literal("sell")]),
      price: z.number().positive().optional(),
      stopPrice: z.number().positive().optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.orderParams.type.endsWith("limit")) {
        return data.orderParams.price !== undefined;
      }
      if (data.orderParams.type.startsWith("stop_loss")) {
        return data.orderParams.stopPrice !== undefined;
      }
      return true;
    },
    {
      error: "Invalid order parameters",
    }
  );

export const orderListSchema = z
  .array(
    z.object({
      market: z.union([z.literal("spot"), z.literal("futures")]),
      symbol: z.string(),
      batchOrders: z.array(orderSchema).min(1),
      subOrderList: z.array(
        z.object({
          batchOrders: z.array(orderSchema).min(1),
        })
      ),
    })
  )
  .min(1);

export type OrderList = z.infer<typeof orderListSchema>;
