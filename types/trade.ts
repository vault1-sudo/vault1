export type TradeSide = "BUY" | "SELL";

export type TradeStatus = "OPEN" | "CLOSED";

export type Trade = {
  id: string;
  userId: string;

  asset: string;
  side: TradeSide;

  quantity: number;
  entryPrice: number;
  exitPrice?: number;

  fees: number;
  strategy: string;

  status: TradeStatus;

  createdAt?: any;
  updatedAt?: any;
};