import { drizzle } from "drizzle-orm/postgres-js";
import {
  MainClient as BinanceSpotClient,
  USDMClient as BinanceFuturesClient,
  WebsocketClient as BinanceWsClient,
} from "binance";
import Keyv from "keyv";
import KeyvRedis from "@keyv/redis";
import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL!, {
  casing: "snake_case",
});

const binanceRedisStore = new Keyv(
  new KeyvRedis({
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD!,
  }),
  {
    namespace: "binance",
  }
);

const binanceMemoryStore = new Keyv({ namespace: "binance" });

export {
  db,
  BinanceSpotClient,
  BinanceFuturesClient,
  BinanceWsClient,
  binanceRedisStore,
  binanceMemoryStore,
  schema,
};
