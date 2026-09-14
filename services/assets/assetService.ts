import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  Asset,
  AssetClass,
  AssetMarket,
  AssetStatus,
} from "../../types/asset";


const ASSETS_COLLECTION = "assets";


/* =========================================================
   CREATE ASSET
========================================================= */

export async function createAsset({
  symbol,
  name,
  assetClass,
  exchange,
  currency = "INR",
  market = "INDIA",
  country,
  sector,
  currentPrice,
  priceSource,
  tradable = true,
  status = "ACTIVE",
}: {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  exchange?: string;
  currency?: string;
  market?: AssetMarket;
  country?: string;
  sector?: string;
  currentPrice?: number;
  priceSource?: string;
  tradable?: boolean;
  status?: AssetStatus;
}) {
  const cleanSymbol =
    symbol.trim().toUpperCase();

  const cleanName =
    name.trim();


  if (!cleanSymbol) {
    throw new Error(
      "Asset symbol is required."
    );
  }

  if (!cleanName) {
    throw new Error(
      "Asset name is required."
    );
  }


  if (
    currentPrice !== undefined &&
    (
      !Number.isFinite(
        currentPrice
      ) ||
      currentPrice < 0
    )
  ) {
    throw new Error(
      "Current price must be a valid non-negative number."
    );
  }


  /*
   * Prevent duplicate symbols.
   *
   * We intentionally query by symbol only,
   * keeping this operation free from composite
   * index requirements.
   */
  const duplicateQuery =
    query(
      collection(
        db,
        ASSETS_COLLECTION
      ),
      where(
        "symbol",
        "==",
        cleanSymbol
      )
    );


  const duplicateSnapshot =
    await getDocs(
      duplicateQuery
    );


  if (
    !duplicateSnapshot.empty
  ) {
    throw new Error(
      `Asset ${cleanSymbol} already exists.`
    );
  }


  const assetData = {
    symbol: cleanSymbol,

    name: cleanName,

    assetClass,

    ...(exchange
      ? {
          exchange:
            exchange.trim().toUpperCase(),
        }
      : {}),

    currency:
      currency.trim().toUpperCase(),

    market,

    ...(country
      ? {
          country:
            country.trim(),
        }
      : {}),

    ...(sector
      ? {
          sector:
            sector.trim(),
        }
      : {}),

    ...(currentPrice !==
    undefined
      ? {
          currentPrice,
        }
      : {}),

    ...(priceSource
      ? {
          priceSource:
            priceSource.trim(),
        }
      : {}),

    tradable,

    status,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };


  const assetRef =
    await addDoc(
      collection(
        db,
        ASSETS_COLLECTION
      ),
      assetData
    );


  return assetRef.id;
}


/* =========================================================
   GET ALL ASSETS
========================================================= */

export async function getAssets(): Promise<
  Asset[]
> {
  const snapshot =
    await getDocs(
      collection(
        db,
        ASSETS_COLLECTION
      )
    );


  const assets =
    snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Asset
    );


  return assets.sort(
    (
      a: Asset,
      b: Asset
    ) =>
      a.symbol.localeCompare(
        b.symbol
      )
  );
}


/* =========================================================
   GET ACTIVE ASSETS
========================================================= */

export async function getActiveAssets(): Promise<
  Asset[]
> {
  const assets =
    await getAssets();

  return assets.filter(
    (asset: Asset) =>
      asset.status ===
      "ACTIVE"
  );
}


/* =========================================================
   GET TRADABLE ASSETS
========================================================= */

export async function getTradableAssets(): Promise<
  Asset[]
> {
  const assets =
    await getAssets();

  return assets.filter(
    (asset: Asset) =>
      asset.status ===
        "ACTIVE" &&
      asset.tradable
  );
}


/* =========================================================
   GET ASSET
========================================================= */

export async function getAsset(
  assetId: string
): Promise<Asset | null> {
  if (!assetId) {
    throw new Error(
      "Asset ID is required."
    );
  }


  const assetRef =
    doc(
      db,
      ASSETS_COLLECTION,
      assetId
    );


  const snapshot =
    await getDoc(
      assetRef
    );


  if (!snapshot.exists()) {
    return null;
  }


  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Asset;
}


/* =========================================================
   FIND BY SYMBOL
========================================================= */

export async function getAssetBySymbol(
  symbol: string
): Promise<Asset | null> {
  const cleanSymbol =
    symbol.trim().toUpperCase();


  if (!cleanSymbol) {
    return null;
  }


  const assetQuery =
    query(
      collection(
        db,
        ASSETS_COLLECTION
      ),
      where(
        "symbol",
        "==",
        cleanSymbol
      )
    );


  const snapshot =
    await getDocs(
      assetQuery
    );


  if (snapshot.empty) {
    return null;
  }


  const document =
    snapshot.docs[0];


  return {
    id: document.id,
    ...document.data(),
  } as Asset;
}


/* =========================================================
   UPDATE ASSET
========================================================= */

export async function updateAsset(
  assetId: string,
  updates: Partial<
    Omit<
      Asset,
      "id" |
      "createdAt"
    >
  >
) {
  if (!assetId) {
    throw new Error(
      "Asset ID is required."
    );
  }


  const assetRef =
    doc(
      db,
      ASSETS_COLLECTION,
      assetId
    );


  const cleanUpdates: Record<
    string,
    unknown
  > = {
    ...updates,
    updatedAt:
      serverTimestamp(),
  };


  if (
    typeof cleanUpdates.symbol ===
    "string"
  ) {
    cleanUpdates.symbol =
      cleanUpdates.symbol
        .trim()
        .toUpperCase();
  }


  if (
    typeof cleanUpdates.name ===
    "string"
  ) {
    cleanUpdates.name =
      cleanUpdates.name
        .trim();
  }


  await updateDoc(
    assetRef,
    cleanUpdates
  );
}


/* =========================================================
   UPDATE MARKET PRICE
========================================================= */

export async function updateAssetPrice({
  assetId,
  currentPrice,
  priceSource,
}: {
  assetId: string;
  currentPrice: number;
  priceSource?: string;
}) {
  if (!assetId) {
    throw new Error(
      "Asset ID is required."
    );
  }


  if (
    !Number.isFinite(
      currentPrice
    ) ||
    currentPrice < 0
  ) {
    throw new Error(
      "Current price must be a valid non-negative number."
    );
  }


  const assetRef =
    doc(
      db,
      ASSETS_COLLECTION,
      assetId
    );


  await updateDoc(
    assetRef,
    {
      currentPrice,

      ...(priceSource
        ? {
            priceSource:
              priceSource.trim(),
          }
        : {}),

      priceUpdatedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    }
  );
}