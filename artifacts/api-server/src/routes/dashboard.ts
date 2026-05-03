import { Router } from "express";
import { db, watchlistTable, tradesTable } from "@workspace/db";
import {
  getCurrentPrice,
  generateCandles,
  computeSignals,
  getStockBySymbol,
  STOCKS,
} from "../lib/stockData.js";

const router = Router();

function getWatchlistItemWithSignal(entry: { id: number; symbol: string; name: string; addedAt: Date }) {
  const stock = getStockBySymbol(entry.symbol);
  const { price, change, changePercent } = getCurrentPrice(entry.symbol);
  const candles = generateCandles(entry.symbol, 90, "1d");
  const closes = candles.map(c => c.close);
  const signals = computeSignals(closes);
  return {
    id: entry.id,
    symbol: entry.symbol,
    name: entry.name,
    price,
    change,
    changePercent,
    overallSignal: signals.overallSignal,
    currency: stock?.currency ?? "USD",
    addedAt: entry.addedAt.toISOString(),
  };
}

// GET /dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const watchlist = await db.select().from(watchlistTable);
    const trades = await db.select().from(tradesTable);
    const openTrades = trades.filter(t => t.status === "open");
    const closedTrades = trades.filter(t => t.status === "closed" && t.exitPrice != null);

    const pnls = closedTrades.map(t => {
      const diff = t.side === "long"
        ? (t.exitPrice! - t.entryPrice)
        : (t.entryPrice - t.exitPrice!);
      return diff * t.shares;
    });
    const totalPnl = +pnls.reduce((a, b) => a + b, 0).toFixed(2);
    const wins = pnls.filter(p => p > 0).length;
    const winRate = closedTrades.length === 0 ? 0 : +((wins / closedTrades.length) * 100).toFixed(1);

    let topGainer = null;
    let topLoser = null;

    if (watchlist.length > 0) {
      const withPrices = watchlist.map(entry => getWatchlistItemWithSignal(entry));
      withPrices.sort((a, b) => b.changePercent - a.changePercent);
      topGainer = withPrices[0];
      topLoser = withPrices[withPrices.length - 1];
    }

    const signals = watchlist.map(entry => {
      const candles = generateCandles(entry.symbol, 30, "1d");
      const closes = candles.map(c => c.close);
      return computeSignals(closes).overallSignal;
    });

    const bullishCount = signals.filter(s => s === "buy" || s === "strong_buy").length;
    const bearishCount = signals.filter(s => s === "sell" || s === "strong_sell").length;
    const total = signals.length || 1;

    const marketMood = bullishCount / total > 0.5 ? "bullish"
      : bearishCount / total > 0.5 ? "bearish"
      : "neutral";

    const response: Record<string, unknown> = {
      watchlistCount: watchlist.length,
      openTradesCount: openTrades.length,
      totalPnl,
      winRate,
      marketMood,
    };
    if (topGainer) response.topGainer = topGainer;
    if (topLoser) response.topLoser = topLoser;

    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/signals
router.get("/signals", async (req, res) => {
  try {
    const watchlist = await db.select().from(watchlistTable);

    const stocks = watchlist.length > 0
      ? watchlist.map(e => ({ symbol: e.symbol, name: e.name }))
      : STOCKS.slice(0, 8).map(s => ({ symbol: s.symbol, name: s.name }));

    const signals = stocks.map(({ symbol, name }) => {
      const stock = getStockBySymbol(symbol);
      const candles = generateCandles(symbol, 90, "1d");
      const closes = candles.map(c => c.close);
      const { price, changePercent } = getCurrentPrice(symbol);
      const s = computeSignals(closes);

      const rationale = [
        s.rsiSignal === "oversold" ? "RSI oversold — potential bounce" :
          s.rsiSignal === "overbought" ? "RSI overbought — may pull back" : null,
        s.macdSignal === "bullish" ? "MACD bullish crossover" :
          s.macdSignal === "bearish" ? "MACD bearish crossover" : null,
        s.bbSignal === "near_lower" ? "Price near lower Bollinger Band" :
          s.bbSignal === "near_upper" ? "Price near upper Bollinger Band" : null,
      ].filter(Boolean).join("; ") || "Mixed signals — wait for confirmation";

      return {
        symbol,
        name,
        price,
        changePercent,
        overallSignal: s.overallSignal,
        rsiSignal: s.rsiSignal,
        macdSignal: s.macdSignal,
        bbSignal: s.bbSignal,
        currentRsi: s.currentRsi ?? null,
        rationale,
        currency: stock?.currency ?? "USD",
      };
    });

    const order = ["strong_buy", "buy", "neutral", "sell", "strong_sell"];
    signals.sort((a, b) => order.indexOf(a.overallSignal) - order.indexOf(b.overallSignal));

    res.json(signals);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dashboard signals");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
