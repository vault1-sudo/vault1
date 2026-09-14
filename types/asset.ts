export type AssetClass =
  | "EQUITY"
  | "ETF"
  | "MUTUAL FUND"
  | "CRYPTO"
  | "GOLD"
  | "FOREX"
  | "COMMODITY"
  | "FIXED INCOME"
  | "CASH"
  | "OTHER";

export type AssetMarket =
  | "INDIA"
  | "US"
  | "GLOBAL"
  | "CRYPTO"
  | "OTHER";

export type AssetStatus =
  | "ACTIVE"
  | "INACTIVE";


export type Asset = {
  id: string;

  symbol: string;
  name: string;

  assetClass: AssetClass;

  exchange?: string;
  currency: string;

  market: AssetMarket;

  country?: string;
  sector?: string;

  currentPrice?: number;
  priceSource?: string;
  priceUpdatedAt?: any;

  tradable: boolean;

  status: AssetStatus;

  createdAt?: any;
  updatedAt?: any;
};