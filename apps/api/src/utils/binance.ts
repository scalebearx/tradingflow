import { BinanceFuturesClient, BinanceSpotClient, schema } from "@tradingflow/lib";
import type { OrderResponseResult, NewOrderResult, FuturesOrderType, OrderType } from "binance";

export const binanceOrderTypeMapping = (
  market: "spot" | "futures",
  { orderParams }: schema.OrderList[number]["batchOrders"][number],
  currentPrice: number
): OrderType | FuturesOrderType => {
  const isBuy = orderParams.side === "buy";
  const isStopPriceAbove = orderParams.stopPrice! > currentPrice;

  switch (orderParams.type) {
    case "limit":
      return "LIMIT";
    case "market":
      return "MARKET";
    case "stop_loss_limit":
      if (isBuy) {
        if (isStopPriceAbove) {
          return market === "spot" ? "STOP_LOSS_LIMIT" : "STOP";
        } else {
          return market === "spot" ? "TAKE_PROFIT_LIMIT" : "TAKE_PROFIT";
        }
      } else {
        if (isStopPriceAbove) {
          return market === "spot" ? "TAKE_PROFIT_LIMIT" : "TAKE_PROFIT";
        } else {
          return market === "spot" ? "STOP_LOSS_LIMIT" : "STOP";
        }
      }
    case "stop_loss_market":
      if (isBuy) {
        if (isStopPriceAbove) {
          return market === "spot" ? "STOP_LOSS" : "STOP_MARKET";
        } else {
          return market === "spot" ? "TAKE_PROFIT" : "TAKE_PROFIT_MARKET";
        }
      } else {
        if (isStopPriceAbove) {
          return market === "spot" ? "TAKE_PROFIT" : "TAKE_PROFIT_MARKET";
        } else {
          return market === "spot" ? "STOP_LOSS" : "STOP_MARKET";
        }
      }
  }
};

export const getFlattenedOrders = (orderList: schema.OrderList, orderResp: OrderResponseResult | NewOrderResult, brokerId: string) => {
  const flattenedOrders = [];

  for (const item of orderList) {
    const { market, symbol, batchOrders, subOrderList } = item;

    for (const [idx, order] of batchOrders.entries()) {
      const { orderParams, orderId, parentOrderId } = order;
      const { side, type, quantity, price, stopPrice } = orderParams;

      if (idx === 0 && orderResp.status === "FILLED") {
        flattenedOrders.push({
          status: "filled" as const,
          market,
          symbol,
          side,
          type,
          quantity,
          price,
          stopPrice,
          id: orderId,
          parentOrderId,
          brokerId,
        });
      } else {
        flattenedOrders.push({
          market,
          symbol,
          side,
          type,
          quantity,
          price,
          stopPrice,
          id: orderId,
          parentOrderId,
          brokerId,
        });
      }

      for (const subItem of subOrderList) {
        const { batchOrders } = subItem;

        for (const order of batchOrders) {
          const { orderParams, orderId, parentOrderId } = order;
          const { side, type, quantity, price, stopPrice } = orderParams;

          flattenedOrders.push({
            market,
            symbol,
            side,
            type,
            quantity,
            price,
            stopPrice,
            id: orderId,
            parentOrderId,
            brokerId,
          });
        }
      }
    }
  }
  return flattenedOrders;
};

export const submitBinanceOrder = async (client: BinanceSpotClient | BinanceFuturesClient, currentOrderItem: schema.OrderList[number], currentPrice: number) => {
  const currentOrder = currentOrderItem.batchOrders[0]!;
  return await client.submitNewOrder({
    symbol: currentOrderItem.symbol,
    side: currentOrder.orderParams.side === "buy" ? "BUY" : "SELL",
    // @ts-ignore
    type: binanceOrderTypeMapping(currentOrderItem.market, currentOrder, currentPrice),
    quantity: currentOrder.orderParams.quantity,
    ...(currentOrder.orderParams.type.endsWith("limit") ? { price: currentOrder.orderParams.price } : {}),
    ...(currentOrder.orderParams.type.startsWith("stop_loss")
      ? {
          stopPrice: currentOrder.orderParams.stopPrice,
        }
      : {}),
    ...(currentOrder.orderParams.type.endsWith("limit") ? { timeInForce: "GTC" } : {}),
    newClientOrderId: currentOrder.orderId,
    newOrderRespType: "RESULT",
  })
};