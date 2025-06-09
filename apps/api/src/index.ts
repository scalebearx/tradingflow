import { Elysia, status, t, type Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth";
import { db, schema, BinanceSpotClient, BinanceFuturesClient, binanceRedisStore } from "@tradingflow/lib";
import { eq } from "drizzle-orm";
import { getFlattenedOrders, submitBinanceOrder } from "@/utils/binance";
const betterAuth = new Elysia({ name: "better-auth" })
  .onError(({ code, error }) => {
    console.log(code, error);
    return status(500);
  })
  .use(
    cors({
      origin: process.env.ORIGIN_URL!,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  )
  .all("/api/auth/*", (context) => auth.handler(context.request))
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

const app = new Elysia()
  .onError(({ code, error }) => {
    if (code === "UNKNOWN") {
      return status(500);
    }
  })
  .use(betterAuth)
  .get(
    "/api/current-user",
    ({ user, session }) => {
      return { user, session };
    },
    {
      auth: true,
    }
  )
  .get("/api/auth/sign-in/google", async ({ headers, redirect }) => {
    const { url } = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: `${process.env.ORIGIN_URL!}/dashboard`,
      },
      headers,
    });
    if (!url) {
      return status(500);
    }
    return redirect(url);
  })
  .post("/api/auth/sign-out", async ({ headers }) => {
    await auth.api.signOut({
      headers,
    });
    return status(200);
  })
  .get("/", () => "Hello World")
  .get(
    "/api/orders/:id",
    async ({ params }) => {
      const orders = await db.select().from(schema.orders).where(eq(schema.orders.brokerId, params.id));
      return orders;
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )

  .post(
    "/api/brokers",
    async ({ body, user }) => {
      // binance
      if (body.exchange === "binance") {
        const binanceSpotClient = new BinanceSpotClient({
          api_key: body.apiKey,
          api_secret: body.apiSecret,
        });

        const apiKeyPermissions = await binanceSpotClient.getApiKeyPermissions();
        const ok =
          apiKeyPermissions.enableSpotAndMarginTrading === true &&
          // @ts-ignore
          apiKeyPermissions.enablePortfolioMarginTrading === false &&
          apiKeyPermissions.enableReading === true &&
          apiKeyPermissions.enableFutures === true;
        if (!ok) return status(400);

        await db.insert(schema.brokers).values({
          userId: user.id,
          exchange: body.exchange,
          label: body.label,
          apiKey: body.apiKey,
          apiSecret: body.apiSecret,
          status: "ok",
          ipRestricted: apiKeyPermissions.ipRestrict,
          credentialsCreatedAt: new Date(apiKeyPermissions.createTime),
        });

        return status(201);
      }
    },
    {
      auth: true,
      body: t.Object({
        exchange: t.Union([t.Literal("binance"), t.Literal("bybit")]),
        label: t.String({ minLength: 1 }),
        apiKey: t.String({ minLength: 1 }),
        apiSecret: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/api/brokers",
    async ({ user }) => {
      const brokers = await db.select().from(schema.brokers).where(eq(schema.brokers.userId, user.id));
      return brokers;
    },
    {
      auth: true,
    }
  )
  .put(
    "/api/brokers/:id",
    async ({ params, body }) => {
      const [currentBroker] = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id)).limit(1);

      if (!currentBroker) {
        return status(400);
      }

      const isCredentialsChanged =
        body.exchange !== currentBroker.exchange || body.apiKey !== currentBroker.apiKey || body.apiSecret !== currentBroker.apiSecret;

      if (isCredentialsChanged) {
        // binance
        if (body.exchange === "binance") {
          const binanceSpotClient = new BinanceSpotClient({
            api_key: body.apiKey,
            api_secret: body.apiSecret,
          });

          const apiKeyPermissions = await binanceSpotClient.getApiKeyPermissions();
          const ok =
            apiKeyPermissions.enableSpotAndMarginTrading === true &&
            // @ts-ignore
            apiKeyPermissions.enablePortfolioMarginTrading === false &&
            apiKeyPermissions.enableReading === true &&
            apiKeyPermissions.enableFutures === true;

          if (!ok) return status(400);

          await db
            .update(schema.brokers)
            .set({
              exchange: body.exchange,
              label: body.label,
              apiKey: body.apiKey,
              apiSecret: body.apiSecret,
              status: "ok",
              ipRestricted: apiKeyPermissions.ipRestrict,
              credentialsCreatedAt: new Date(apiKeyPermissions.createTime),
            })
            .where(eq(schema.brokers.id, params.id));
          return status(204);
        }
      } else {
        await db
          .update(schema.brokers)
          .set({
            label: body.label,
          })
          .where(eq(schema.brokers.id, params.id));
        return status(204);
      }
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      body: t.Object({
        exchange: t.Union([t.Literal("binance"), t.Literal("bybit")]),
        label: t.String({ minLength: 1 }),
        apiKey: t.String({ minLength: 1 }),
        apiSecret: t.String({ minLength: 1 }),
      }),
    }
  )
  .delete(
    "/api/brokers/:id",
    async ({ params, status }) => {
      await db.delete(schema.brokers).where(eq(schema.brokers.id, params.id));
      return status(204);
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/api/brokers/:id",
    async ({ params }) => {
      const broker = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id));
      return broker;
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/api/brokers/:id/order-list",
    async ({ params, body }) => {
      const { data: orderList, success } = schema.orderListSchema.safeParse(body);
      if (!success) {
        return status(400);
      }

      const [currentBroker] = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id));

      if (!currentBroker) {
        return status(400);
      }

      console.log(JSON.stringify(orderList, null, 2));

      // binance
      if (currentBroker.exchange === "binance") {
        const currentOrderItem = orderList[0]!;

        if (currentOrderItem.market === "spot") {
          const binanceSpotClient = new BinanceSpotClient({
            api_key: currentBroker.apiKey,
            api_secret: currentBroker.apiSecret,
          });

          // @ts-ignore
          const currentPriceResp: { symbol: string; price: number } = await binanceSpotClient.getSymbolPriceTicker({ symbol: currentOrderItem.symbol });

          const orderResp = await submitBinanceOrder(binanceSpotClient, currentOrderItem, currentPriceResp.price);

          const flattenedOrders = getFlattenedOrders(orderList, orderResp, currentBroker.id);

          await db.insert(schema.orders).values(flattenedOrders);
          return status(201);
        } else if (currentOrderItem.market === "futures") {
          const binanceFuturesClient = new BinanceFuturesClient({
            api_key: currentBroker.apiKey,
            api_secret: currentBroker.apiSecret,
          });

          // @ts-ignore
          const currentPriceResp: { symbol: string; price: number } = await binanceFuturesClient.getSymbolPriceTickerV2({ symbol: currentOrderItem.symbol });

          const orderResp = await submitBinanceOrder(binanceFuturesClient, currentOrderItem, currentPriceResp.price);

          const flattenedOrders = getFlattenedOrders(orderList, orderResp, currentBroker.id);

          await db.insert(schema.orders).values(flattenedOrders);
          return status(201);
        }
      }
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/api/brokers/:id/holdings",
    async ({ params }) => {
      const holdings = await binanceRedisStore.get(`:${params.id}:holdings`);
      if (holdings) return holdings;

      const [currentBroker] = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id));

      if (!currentBroker) {
        return status(400);
      }

      // binance
      if (currentBroker.exchange === "binance") {
        const binanceSpotClient = new BinanceSpotClient({
          api_key: currentBroker.apiKey,
          api_secret: currentBroker.apiSecret,
        });

        const holdings = (await binanceSpotClient.getAccountInformation()).balances
          .filter((balance) => Number(balance.free) !== 0 || Number(balance.locked) !== 0)
          .map((balance) => ({
            symbol: balance.asset,
            amount: Number(balance.free) + Number(balance.locked),
          }));
        await binanceRedisStore.set(`:${params.id}:holdings`, holdings, 30 * 1000);
        return holdings;
      }
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/api/brokers/:id/positions",
    async ({ params }) => {
      const positions = await binanceRedisStore.get(`:${params.id}:positions`);
      if (positions) return positions;

      const [currentBroker] = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id));

      if (!currentBroker) {
        return status(400);
      }

      // binance
      if (currentBroker.exchange === "binance") {
        const binanceFuturesClient = new BinanceFuturesClient({
          api_key: currentBroker.apiKey,
          api_secret: currentBroker.apiSecret,
        });

        const positions = (await binanceFuturesClient.getPositionsV3())
          .filter((position) => Number(position.positionAmt) !== 0)
          .map((position) => ({
            symbol: position.symbol,
            positionSide: position.positionSide === "BOTH" ? "both" : position.positionSide === "LONG" ? "long" : "short",
            quantity: Number(position.positionAmt),
            liquidationPrice: Number(position.liquidationPrice),
            unrealizedPnl: Number(position.unRealizedProfit),
            amount: Number(position.notional),
            entryPrice: Number(position.entryPrice),
            markPrice: Number(position.markPrice),
            updatedAt: new Date(position.updateTime),
          }));
        await binanceRedisStore.set(`:${params.id}:positions`, positions, 30 * 1000);
        return positions;
      }
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/api/brokers/:id/balance",
    async ({ params, query: { days } }) => {
      interface WalletBalance {
        account: "spot" | "futures";
        balance: number;
      }

      // 定義每日餘額記錄的型別
      interface DailyBalance {
        date: string;
        balance: WalletBalance[] | null;
      }
      // 從資料庫查詢 broker
      const [currentBroker] = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id));

      if (!currentBroker) {
        return status(400, { message: "Broker not found" });
      }

      // Binance 處理
      if (currentBroker.exchange === "binance") {
        const binanceSpotClient = new BinanceSpotClient({
          api_key: currentBroker.apiKey,
          api_secret: currentBroker.apiSecret,
        });

        // 獲取當前餘額並存入 Redis
        const balance: WalletBalance[] = (await binanceSpotClient.getWalletBalances())
          .filter((balance) => balance.walletName === "Spot" || balance.walletName === "USDⓈ-M Futures")
          .map((balance) => ({
            account: balance.walletName === "Spot" ? "spot" : "futures",
            balance: Number(balance.balance),
          }));

        const now = new Date();
        const dateAtMidnight = new Date(now.setHours(0, 0, 0, 0));
        const dateKey = dateAtMidnight.toISOString().split("T")[0];
        const redisKey = `broker:${params.id}:${dateKey}:balance`;
        await binanceRedisStore.set(redisKey, balance, 1000 * 60 * 60 * 24 * 30);

        // 準備批量查詢的 Redis 鍵
        const keys: string[] = [];
        const balancesArray: DailyBalance[] = [];
        const today = new Date();
        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i); // 往前推 i 天
          date.setHours(0, 0, 0, 0); // 進位到 00:00
          const historyDateKey = date.toISOString().split("T")[0] as string;
          const historyRedisKey = `broker:${params.id}:${historyDateKey}:balance`;
          keys.push(historyRedisKey);
          balancesArray.push({ date: historyDateKey, balance: null }); // 預先準備日期和初始餘額
        }

        // 使用 Keyv 的 getMany 批量查詢，並斷言型別
        const balances = (await binanceRedisStore.getMany(keys)) as (WalletBalance[] | undefined)[];

        // 組合日期和餘額數據
        for (let i = 0; i < balancesArray.length; i++) {
          if (balancesArray[i]) {
            balancesArray[i]!.balance = balances[i] || null; // 若無數據，返回 null
          }
        }

        // 按日期排序（從舊到新）
        balancesArray.sort((a, b) => a.date.localeCompare(b.date));
        return balancesArray;
      } else {
        return status(400, { message: "Unsupported exchange" });
      }
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      query: t.Object({
        days: t.Number({ min: 1, max: 30 }),
      }),
    }
  )
  .get(
    "/api/brokers/:id/open-orders/:market",
    async ({ params }) => {
      const openOrders = await binanceRedisStore.get(`:${params.market}:${params.id}:open_orders`);
      if (openOrders) return openOrders;

      const [currentBroker] = await db.select().from(schema.brokers).where(eq(schema.brokers.id, params.id));

      if (!currentBroker) {
        return status(400);
      }

      // binance
      if (currentBroker.exchange === "binance") {
        if (params.market === "spot") {
          const binanceSpotClient = new BinanceSpotClient({
            api_key: currentBroker.apiKey,
            api_secret: currentBroker.apiSecret,
          });

          const openOrders = (await binanceSpotClient.getOpenOrders()).map((openOrder) => ({
            orderId: openOrder.clientOrderId,
            symbol: openOrder.symbol,
            side: openOrder.side === "BUY" ? "buy" : "sell",
            type: openOrder.type === "STOP_LOSS" ? "stop_loss_market" : openOrder.type === "TAKE_PROFIT" ? "take_profit_market" : openOrder.type.toLowerCase(),
            ...(Number(openOrder.price) !== 0 ? { price: Number(openOrder.price) } : {}),
            ...(Number(openOrder.stopPrice) !== 0 ? { stopPrice: Number(openOrder.stopPrice) } : {}),
            quantity: Number(openOrder.origQty),
            filledQuantity: Number(openOrder.executedQty),
            status: openOrder.status === "NEW" ? "open" : openOrder.status.toLowerCase(),
            createdAt: new Date(openOrder.time),
            updatedAt: new Date(openOrder.updateTime),
          }));
          await binanceRedisStore.set(`:${params.market}:${params.id}:open_orders`, openOrders, 30 * 1000);
          return openOrders;
        } else if (params.market === "futures") {
          const binanceFuturesClient = new BinanceFuturesClient({
            api_key: currentBroker.apiKey,
            api_secret: currentBroker.apiSecret,
          });

          const openOrders = (await binanceFuturesClient.getAllOpenOrders()).map((openOrder) => ({
            orderId: openOrder.clientOrderId,
            symbol: openOrder.symbol,
            side: openOrder.side === "BUY" ? "buy" : "sell",
            positionSide: openOrder.positionSide === "BOTH" ? "both" : openOrder.positionSide === "LONG" ? "long" : "short",
            type:
              openOrder.type === "STOP"
                ? "stop_loss_limit"
                : openOrder.type === "STOP_MARKET"
                ? "stop_loss_market"
                : openOrder.type === "TAKE_PROFIT"
                ? "take_profit_limit"
                : openOrder.type.toLowerCase(),
            ...(Number(openOrder.price) !== 0 ? { price: Number(openOrder.price) } : {}),
            ...(Number(openOrder.stopPrice) !== 0 ? { stopPrice: Number(openOrder.stopPrice) } : {}),
            quantity: Number(openOrder.origQty),
            filledQuantity: Number(openOrder.executedQty),
            status: openOrder.status === "NEW" ? "open" : openOrder.status.toLowerCase(),
            createdAt: new Date(openOrder.time),
            updatedAt: new Date(openOrder.updateTime),
          }));
          await binanceRedisStore.set(`:${params.market}:${params.id}:open_orders`, openOrders, 30 * 1000);
          return openOrders;
        }
      }
    },
    {
      auth: true,
      params: t.Object({
        id: t.String({ minLength: 1 }),
        market: t.Union([t.Literal("spot"), t.Literal("futures")]),
      }),
    }
  )
  .listen(process.env.PORT || 4000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
