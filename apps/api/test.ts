import { BinanceFuturesClient } from "@tradingflow/lib";

const binanceSpotClient = new BinanceFuturesClient({
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_API_SECRET,
});

const balance = await binanceSpotClient.getPositionsV3();
console.log(balance);