import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@tradingflow/lib";

export const auth = betterAuth({
  appName: "Tradingflow App",
  advanced: {
    cookiePrefix: "tradingflow",
    database: {
      generateId: false,
    },
  },
  trustedOrigins: [process.env.ORIGIN_URL!],
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
    usePlural: true
  }),
  rateLimit: {
    enabled: false
  },
});
