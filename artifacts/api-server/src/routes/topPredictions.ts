import { Router } from "express";
import {
  STOCKS,
  generateCandles,
  getCurrentPrice,
  computeComprehensiveScore,
  computeIndicatorModeScore,
  generateHorizonPrediction,
  getStockBySymbol,
  type IndicatorMode,
} from "../lib/stockData.js";

const router = Router();

const HORIZONS = [
  { key: "1d",  label: "1 Day",   days: 1 },
  { key: "1w",  label: "1 Week",  days: 5 },
  { key: "2w",  label: "2 Weeks", days: 14 },
  { key: "1mo", label: "1 Month", days: 30 },
];

function buildStockPrediction(symbol: string, indicator: IndicatorMode) {
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
  const analysis = computeIndicatorModeScore(indicator, closes, highs, lows, volumes);

  const predictions: Record<string, {
    targetPrice: number; changeAmount: number; direction: string; confidence: number; label: string;
  }> = {};

  const last = closes[closes.length - 1] ?? currentPrice;
  const prev5 = closes[Math.max(0, closes.length - 6)] ?? last;
  const prev20 = closes[Math.max(0, closes.length - 21)] ?? last;
  const prev60 = closes[Math.max(0, closes.length - 61)] ?? last;
  const momentum5 = prev5 ? (last - prev5) / prev5 : 0;
  const momentum20 = prev20 ? (last - prev20) / prev20 : 0;
  const momentum60 = prev60 ? (last - prev60) / prev60 : 0;

  const modeScore = (() => {
    if (indicator === "app") {
      return Math.max(5, Math.min(95, Math.round(analysis.score)));
    }
    if (indicator === "rsi") {
      return Math.max(5, Math.min(95, Math.round((analysis.currentRsi != null ? 100 - analysis.currentRsi : 50) * 0.9 + momentum5 * 1200)));
    }
    if (indicator === "macd") {
      return Math.max(5, Math.min(95, Math.round(50 + momentum20 * 1400 + momentum60 * 500)));
    }
    if (indicator === "sma") {
      return Math.max(5, Math.min(95, Math.round(50 + momentum20 * 900 + momentum60 * 700)));
    }
    if (indicator === "ema") {
      return Math.max(5, Math.min(95, Math.round(50 + momentum5 * 1000 + momentum20 * 700)));
    }
    return Math.max(5, Math.min(95, Math.round((analysis.overallSignal === "strong_buy" ? 72 : analysis.overallSignal === "strong_sell" ? 28 : analysis.score))));
  })();

  for (const h of HORIZONS) {
    const pred = generateHorizonPrediction(symbol, currentPrice, stock.volatility, modeScore, h.days);
    predictions[h.key] = { ...pred, label: h.label };
  }

  const indicatorLabel =
    indicator === "app" ? "App Suggested" :
    indicator === "rsi" ? "RSI" :
    indicator === "macd" ? "MACD" :
    indicator === "sma" ? "SMA" :
    indicator === "ema" ? "EMA" : "Bollinger Bands";

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
    indicator,
    indicatorLabel,
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
  if (stock.marketCapB >= 500) return "mid";
  return "small";
}

// GET /predictions/top?q=&limit=10
router.get("/top", (req, res) => {
  const q = ((req.query.q as string) ?? "").toLowerCase().trim();
  const cap = getCapCategoryFilter((req.query.cap as string) ?? "all");
  const indicator = ((req.query.indicator as string) ?? "app") as IndicatorMode;
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
    .map(s => buildStockPrediction(s.symbol, indicator))
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
    indicator,
    total: results.length,
    stocks: results.slice(0, limit),
  });
});

export default router;
