import { Router } from "express";
import { db, watchlistTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getCurrentPrice, getStockBySymbol, generateCandles, periodToDays, computeSignals } from "../lib/stockData.js";

const router = Router();

function computeWatchlistSignal(symbol: string) {
  const candles = generateCandles(symbol, 90, "1d");
  const closes = candles.map(c => c.close);
  return computeSignals(closes);
}

// GET /watchlist
router.get("/", async (req, res) => {
  try {
    const entries = await db.select().from(watchlistTable).orderBy(watchlistTable.addedAt);
    const items = entries.map(entry => {
      const { price, change, changePercent } = getCurrentPrice(entry.symbol);
      const signals = computeWatchlistSignal(entry.symbol);
      return {
        id: entry.id,
        symbol: entry.symbol,
        name: entry.name,
        price,
        change,
        changePercent,
        overallSignal: signals.overallSignal,
        addedAt: entry.addedAt.toISOString(),
      };
    });
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /watchlist
router.post("/", async (req, res) => {
  try {
    const { symbol, name } = req.body as { symbol: string; name: string };
    if (!symbol || !name) {
      res.status(400).json({ error: "symbol and name are required" });
      return;
    }

    const existing = await db.select().from(watchlistTable).where(eq(watchlistTable.symbol, symbol.toUpperCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: `${symbol} is already in your watchlist` });
      return;
    }

    const [created] = await db.insert(watchlistTable).values({
      symbol: symbol.toUpperCase(),
      name,
    }).returning();

    const { price, change, changePercent } = getCurrentPrice(created.symbol);
    const signals = computeWatchlistSignal(created.symbol);

    res.status(201).json({
      id: created.id,
      symbol: created.symbol,
      name: created.name,
      price,
      change,
      changePercent,
      overallSignal: signals.overallSignal,
      addedAt: created.addedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add to watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /watchlist/:symbol
router.delete("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const deleted = await db.delete(watchlistTable).where(eq(watchlistTable.symbol, symbol)).returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: `${symbol} not found in watchlist` });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove from watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
