import { Router } from "express";
import {
  STOCKS,
  generateCandles,
  getCurrentPrice,
  computeComprehensiveScore,
  generateHorizonPrediction,
  getStockBySymbol,
} from "../lib/stockData.js";

const router = Router();

const HORIZONS = [
  { key: "1d",  label: "1 Day",   days: 1 },
  { key: "1w",  label: "1 Week",  days: 5 },
  { key: "2w",  label: "2 Weeks", days: 14 },
  { key: "1mo", label: "1 Month", days: 30 },
];

function buildStockPrediction(symbol: string) {
  const stock = getStockBySymbol(symbol);
  if (!stock) return null;
  if (stock.currency !== "INR" || stock.exchange !== "NSE") return null;

  // Use 6 months of data for comprehensive analysis
  const candles = generateCandles(symbol, 180, "1d");
  if (candles.length < 60) return null;

  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  const { price: currentPrice } = getCurrentPrice(symbol);
  const analysis = computeComprehensiveScore(closes, highs, lows, volumes);

  const predictions: Record<string, {
    targetPrice: number; changeAmount: number; direction: string; confidence: number; label: string;
  }> = {};

  for (const h of HORIZONS) {
    const pred = generateHorizonPrediction(symbol, currentPrice, stock.volatility, analysis.score, h.days);
    predictions[h.key] = { ...pred, label: h.label };
  }

  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    exchange: stock.exchange,
    currency: stock.currency,
    capCategory: getBucket(stock),
    currentPrice,
    overallScore: analysis.score,
    direction: analysis.direction,
    overallSignal: analysis.overallSignal,
    signals: analysis.signals,
    currentRsi: analysis.currentRsi,
    predictions,
  };
}

function getCapCategoryFilter(cap: string | undefined) {
  if (!cap || cap === "all") return null;
  return cap as "large" | "mid" | "small";
}

function getBucket(stock: { marketCapB: number; capCategory?: "large" | "mid" | "small" }): "large" | "mid" | "small" {
  if (stock.capCategory) return stock.capCategory;
  if (stock.marketCapB >= 5000) return "large";
  if (stock.marketCapB >= 1000) return "mid";
  return "small";
}

// GET /predictions/top?q=&limit=10
router.get("/top", (req, res) => {
  const q = ((req.query.q as string) ?? "").toLowerCase().trim();
  const cap = getCapCategoryFilter((req.query.cap as string) ?? "all");
  const limit = Math.min(parseInt((req.query.limit as string) ?? "10", 10), 30);

  let pool = STOCKS;
  if (q) {
    pool = STOCKS.filter(s =>
      s.currency === "INR" &&
      s.exchange === "NSE" &&
      (!cap || getBucket(s) === cap) &&
      (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    );
  } else {
    pool = STOCKS.filter(s => s.currency === "INR" && s.exchange === "NSE" && (!cap || getBucket(s) === cap));
  }

  const results = pool
    .map(s => buildStockPrediction(s.symbol))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .filter(stock => {
      const meta = getStockBySymbol(stock.symbol);
      if (!meta) return false;
      const bucket = getBucket(meta);
      // Large caps always shown; mid/small caps must show net-bullish momentum
      // (composite score ≥ 52 maps to ≥ 2 bullish horizons given the scoring model)
      return bucket === "large" || stock.overallScore >= 52;
    });

  results.sort((a, b) => {
    const scoreDiff = b.overallScore - a.overallScore;
    if (scoreDiff !== 0) return scoreDiff;
    const aTarget = Object.values(a.predictions).reduce((max, p) => Math.max(max, p.targetPrice), 0);
    const bTarget = Object.values(b.predictions).reduce((max, p) => Math.max(max, p.targetPrice), 0);
    return bTarget - aTarget;
  });

  res.json({
    query: q || null,
    cap: cap ?? "all",
    total: results.length,
    stocks: results.slice(0, limit),
  });
});

export default router;
