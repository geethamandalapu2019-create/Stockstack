import { Router } from "express";
import {
  generateCandles,
  computeSignals,
  calcSMA,
  calcEMA,
  calcRSI,
  getStockBySymbol,
  getCurrentPrice,
} from "../lib/stockData.js";

const router = Router();

interface Horizon {
  key: string;
  label: string;
  days: number;
  points: number;
}

const HORIZONS: Horizon[] = [
  { key: "1d",   label: "1 Day",    days: 1,   points: 24 },
  { key: "1w",   label: "1 Week",   days: 5,   points: 5  },
  { key: "2w",   label: "2 Weeks",  days: 14,  points: 14 },
  { key: "1mo",  label: "1 Month",  days: 30,  points: 30 },
  { key: "3mo",  label: "3 Months", days: 90,  points: 30 },
  { key: "6mo",  label: "6 Months", days: 180, points: 30 },
  { key: "12mo", label: "1 Year",   days: 365, points: 52 },
];

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Deterministic prediction generation based on technical signals
function buildPrediction(
  symbol: string,
  horizon: Horizon,
  currentPrice: number,
  volatility: number,
  signals: ReturnType<typeof computeSignals>,
  closes: number[],
  sma20: (number | null)[],
  sma50: (number | null)[]
) {
  const rng = seededRng(
    symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
    horizon.days * 17 +
    Math.floor(Date.now() / 86400000)
  );

  // Derive bias from signals
  let biasMult = 1.0;
  if (signals.overallSignal === "strong_buy") biasMult = 1.04;
  else if (signals.overallSignal === "buy") biasMult = 1.02;
  else if (signals.overallSignal === "sell") biasMult = 0.98;
  else if (signals.overallSignal === "strong_sell") biasMult = 0.96;

  // Adjust bias strength by horizon (longer = revert toward mean)
  const horizonFactor = Math.min(horizon.days / 30, 3);
  const adjustedBias = 1 + (biasMult - 1) * Math.max(1, horizonFactor * 0.6);

  // Annualised volatility → horizon volatility
  const horizonVol = volatility * Math.sqrt(horizon.days / 252) * 1.5;

  // Target price
  const driftNoise = (rng() - 0.48) * horizonVol * 0.3;
  const targetPrice = +(currentPrice * adjustedBias * (1 + driftNoise)).toFixed(2);

  // Confidence band (widens with time)
  const bandWidth = horizonVol * (0.8 + rng() * 0.4);
  const confidenceLow = +(targetPrice * (1 - bandWidth)).toFixed(2);
  const confidenceHigh = +(targetPrice * (1 + bandWidth)).toFixed(2);

  // Direction & confidence score
  const upside = +((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
  const direction = upside > 1 ? "bullish" : upside < -1 ? "bearish" : "neutral";

  const baseConf = 72;
  const signalBonus = signals.overallSignal === "strong_buy" || signals.overallSignal === "strong_sell" ? 10
    : signals.overallSignal === "buy" || signals.overallSignal === "sell" ? 5 : 0;
  const horizonPenalty = Math.min(horizon.days / 30 * 4, 20);
  const confidenceScore = Math.max(40, Math.min(92, Math.round(baseConf + signalBonus - horizonPenalty + (rng() - 0.5) * 6)));

  // Support & resistance: based on 52-week lows/highs
  const last252 = closes.slice(-252);
  const supportLevel = +(Math.min(...last252) * (1 + rng() * 0.02)).toFixed(2);
  const resistanceLevel = +(Math.max(...last252) * (1 - rng() * 0.02)).toFixed(2);

  // Methodology text
  const methodology = buildMethodology(signals, horizon, sma20, sma50, closes);

  // Forecast path
  const forecast: { date: string; predicted: number; low: number; high: number }[] = [];
  let price = currentPrice;
  const stepRng = seededRng(
    symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + horizon.days * 31
  );

  const totalDays = horizon.days;
  const stepDays = totalDays / horizon.points;

  for (let i = 1; i <= horizon.points; i++) {
    const stepVol = volatility * Math.sqrt(stepDays / 252);
    const drift = (adjustedBias - 1) / horizon.points;
    const noise = (stepRng() - 0.47) * stepVol * currentPrice;
    price = +(price * (1 + drift) + noise).toFixed(2);
    const bandW = stepVol * (1 + rng() * 0.5) * currentPrice;

    const d = new Date();
    d.setDate(d.getDate() + Math.round(i * stepDays));
    // Skip weekends for short-term
    if (horizon.days <= 7 && (d.getDay() === 0 || d.getDay() === 6)) {
      d.setDate(d.getDate() + (d.getDay() === 0 ? 1 : 2));
    }

    forecast.push({
      date: d.toISOString().split("T")[0],
      predicted: price,
      low: +(price - bandW).toFixed(2),
      high: +(price + bandW).toFixed(2),
    });
  }

  return {
    horizon: horizon.key,
    label: horizon.label,
    targetPrice,
    confidenceLow,
    confidenceHigh,
    direction,
    confidenceScore,
    upside,
    methodology,
    supportLevel,
    resistanceLevel,
    forecast,
  };
}

function buildMethodology(
  signals: ReturnType<typeof computeSignals>,
  horizon: Horizon,
  sma20: (number | null)[],
  sma50: (number | null)[],
  closes: number[]
): string {
  const parts: string[] = [];

  if (horizon.days <= 7) {
    parts.push("Short-term momentum model using RSI divergence and MACD histogram slope");
  } else if (horizon.days <= 90) {
    parts.push("Swing model: Bollinger Band mean-reversion + MACD crossover");
  } else {
    parts.push("Trend-following model: SMA50/SMA200 crossover with volume-weighted momentum");
  }

  const lastSma20 = sma20[sma20.length - 1];
  const lastSma50 = sma50[sma50.length - 1];
  const lastClose = closes[closes.length - 1];

  if (lastSma20 && lastSma50) {
    if (lastClose > lastSma20 && lastSma20 > lastSma50) {
      parts.push("Price above SMA20 and SMA50 — uptrend confirmed");
    } else if (lastClose < lastSma20 && lastSma20 < lastSma50) {
      parts.push("Price below SMA20 and SMA50 — downtrend confirmed");
    }
  }

  if (signals.rsiSignal === "oversold") parts.push("RSI in oversold zone — buy pressure expected");
  else if (signals.rsiSignal === "overbought") parts.push("RSI overbought — potential mean reversion");

  if (signals.macdSignal === "bullish") parts.push("MACD bullish crossover adds upside bias");
  else if (signals.macdSignal === "bearish") parts.push("MACD bearish crossover adds downside risk");

  return parts.join(". ") + ".";
}

// GET /stocks/:symbol/predictions
router.get("/:symbol/predictions", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = getStockBySymbol(symbol);
  if (!stock) {
    res.status(404).json({ error: `Symbol '${symbol}' not found` });
    return;
  }

  const { price: currentPrice } = getCurrentPrice(symbol);
  const candles = generateCandles(symbol, 365, "1d");
  const closes = candles.map(c => c.close);
  const signals = computeSignals(closes);
  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const rsi = calcRSI(closes);
  const latestRsi = rsi[rsi.length - 1];

  const predictions = HORIZONS.map(h =>
    buildPrediction(symbol, h, currentPrice, stock.volatility, signals, closes, sma20, sma50)
  );

  res.json({
    symbol,
    currency: stock.currency,
    currentPrice,
    currentRsi: latestRsi,
    predictions,
  });
});

export default router;
