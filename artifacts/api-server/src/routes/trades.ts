import { Router } from "express";
import { db, tradesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function computePnl(trade: typeof tradesTable.$inferSelect) {
  if (!trade.exitPrice || trade.status !== "closed") return { pnl: null, pnlPercent: null };
  const diff = trade.side === "long"
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice;
  const pnl = +(diff * trade.shares).toFixed(2);
  const pnlPercent = +((diff / trade.entryPrice) * 100).toFixed(2);
  return { pnl, pnlPercent };
}

function formatTrade(trade: typeof tradesTable.$inferSelect) {
  const { pnl, pnlPercent } = computePnl(trade);
  return {
    id: trade.id,
    symbol: trade.symbol,
    name: trade.name,
    side: trade.side,
    status: trade.status,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice ?? null,
    shares: trade.shares,
    entryDate: trade.entryDate,
    exitDate: trade.exitDate ?? null,
    stopLoss: trade.stopLoss ?? null,
    takeProfit: trade.takeProfit ?? null,
    notes: trade.notes ?? null,
    strategy: trade.strategy ?? null,
    pnl,
    pnlPercent,
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
  };
}

// GET /trades
router.get("/", async (req, res) => {
  try {
    const { status, symbol } = req.query as { status?: string; symbol?: string };
    let query = db.select().from(tradesTable);

    const conditions = [];
    if (status) conditions.push(eq(tradesTable.status, status));
    if (symbol) conditions.push(eq(tradesTable.symbol, symbol.toUpperCase()));

    const trades = conditions.length > 0
      ? await db.select().from(tradesTable).where(and(...conditions))
      : await db.select().from(tradesTable);

    res.json(trades.map(formatTrade));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trades");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /trades
router.post("/", async (req, res) => {
  try {
    const body = req.body as {
      symbol: string;
      name: string;
      side: string;
      entryPrice: number;
      shares: number;
      entryDate: string;
      stopLoss?: number | null;
      takeProfit?: number | null;
      notes?: string | null;
      strategy?: string | null;
    };

    const [trade] = await db.insert(tradesTable).values({
      symbol: body.symbol.toUpperCase(),
      name: body.name,
      side: body.side,
      status: "open",
      entryPrice: body.entryPrice,
      shares: body.shares,
      entryDate: body.entryDate,
      stopLoss: body.stopLoss ?? null,
      takeProfit: body.takeProfit ?? null,
      notes: body.notes ?? null,
      strategy: body.strategy ?? null,
    }).returning();

    res.status(201).json(formatTrade(trade));
  } catch (err) {
    req.log.error({ err }, "Failed to create trade");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /trades/stats — must be before /:id
router.get("/stats", async (req, res) => {
  try {
    const trades = await db.select().from(tradesTable);
    const closed = trades.filter(t => t.status === "closed" && t.exitPrice != null);
    const open = trades.filter(t => t.status === "open");

    const pnls = closed.map(t => computePnl(t).pnl ?? 0);
    const wins = pnls.filter(p => p > 0);
    const losses = pnls.filter(p => p <= 0);

    const winRate = closed.length === 0 ? 0 : +((wins.length / closed.length) * 100).toFixed(1);
    const totalPnl = +pnls.reduce((a, b) => a + b, 0).toFixed(2);
    const avgWin = wins.length > 0 ? +(wins.reduce((a, b) => a + b, 0) / wins.length).toFixed(2) : 0;
    const avgLoss = losses.length > 0 ? +(Math.abs(losses.reduce((a, b) => a + b, 0)) / losses.length).toFixed(2) : 0;
    const bestTrade = pnls.length > 0 ? +Math.max(...pnls).toFixed(2) : null;
    const worstTrade = pnls.length > 0 ? +Math.min(...pnls).toFixed(2) : null;
    const profitFactor = avgLoss === 0 ? null : +(avgWin / avgLoss).toFixed(2);

    const holdingDays = closed.map(t => {
      if (!t.exitDate) return 0;
      const entry = new Date(t.entryDate).getTime();
      const exit = new Date(t.exitDate).getTime();
      return (exit - entry) / (1000 * 60 * 60 * 24);
    });
    const avgHoldingDays = holdingDays.length > 0
      ? +(holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length).toFixed(1)
      : null;

    res.json({
      totalTrades: trades.length,
      openTrades: open.length,
      closedTrades: closed.length,
      winRate,
      totalPnl,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
      profitFactor,
      avgHoldingDays,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trade stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /trades/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [trade] = await db.select().from(tradesTable).where(eq(tradesTable.id, id));
    if (!trade) {
      res.status(404).json({ error: "Trade not found" });
      return;
    }
    res.json(formatTrade(trade));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trade");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /trades/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body as {
      exitPrice?: number | null;
      exitDate?: string | null;
      status?: string;
      stopLoss?: number | null;
      takeProfit?: number | null;
      notes?: string | null;
      strategy?: string | null;
    };

    const updateData: Record<string, unknown> = {};
    if (body.exitPrice !== undefined) updateData.exitPrice = body.exitPrice;
    if (body.exitDate !== undefined) updateData.exitDate = body.exitDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.stopLoss !== undefined) updateData.stopLoss = body.stopLoss;
    if (body.takeProfit !== undefined) updateData.takeProfit = body.takeProfit;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.strategy !== undefined) updateData.strategy = body.strategy;

    const [updated] = await db.update(tradesTable)
      .set(updateData)
      .where(eq(tradesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Trade not found" });
      return;
    }
    res.json(formatTrade(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update trade");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /trades/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await db.delete(tradesTable).where(eq(tradesTable.id, id)).returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Trade not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete trade");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
