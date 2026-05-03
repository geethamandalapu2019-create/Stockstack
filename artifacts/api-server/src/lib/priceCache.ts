import YahooFinanceCtor from "yahoo-finance2";
import { STOCKS, setLivePrice } from "./stockData.js";
import { logger } from "./logger.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceCtor as any)({ suppressNotices: ["yahooSurvey"] });

const CACHE_TTL_MS = 5 * 60 * 1000;
const BATCH_SIZE = 10;

function toYahooSymbol(symbol: string, exchange: string): string {
  if (exchange === "NSE" || exchange === "BSE") return `${symbol}.NS`;
  return symbol;
}

async function fetchBatch(entries: Array<{ symbol: string; yahoo: string }>): Promise<void> {
  const yahooSymbols = entries.map(e => e.yahoo);

  const results = await yahooFinance.quote(yahooSymbols, {
    fields: ["regularMarketPrice", "regularMarketChange", "regularMarketChangePercent"],
  });

  const resultArray = Array.isArray(results) ? results : [results];
  let updated = 0;

  for (const r of resultArray) {
    if (!r || r.regularMarketPrice == null) continue;
    const nseSymbol = (r.symbol ?? "").replace(/\.(NS|BO)$/, "");
    setLivePrice(nseSymbol, {
      price: +r.regularMarketPrice.toFixed(2),
      change: +((r.regularMarketChange ?? 0).toFixed(2)),
      changePercent: +((r.regularMarketChangePercent ?? 0).toFixed(2)),
    });
    updated++;
  }

  logger.info({ updated, total: entries.length }, "Live prices fetched from Yahoo Finance");
}

export async function refreshAllPrices(): Promise<void> {
  const entries = STOCKS.map(s => ({
    symbol: s.symbol,
    yahoo: toYahooSymbol(s.symbol, s.exchange),
  }));

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    try {
      await fetchBatch(batch);
    } catch (err) {
      logger.warn(
        { err, symbols: batch.map(e => e.yahoo) },
        "Price batch fetch failed — keeping previous/base prices",
      );
    }
    // small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < entries.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
}

export function startPriceRefresh(): void {
  logger.info("Starting live NSE price refresh via Yahoo Finance");
  refreshAllPrices().catch(err =>
    logger.warn({ err }, "Initial live price fetch failed — using base prices"),
  );
  setInterval(() => {
    refreshAllPrices().catch(err =>
      logger.warn({ err }, "Periodic live price refresh failed"),
    );
  }, CACHE_TTL_MS);
}
