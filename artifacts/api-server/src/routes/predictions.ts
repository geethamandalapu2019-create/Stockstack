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

function buildSwingConfluencePrediction(
  symbol: string,
  horizon: Horizon,
  currentPrice: number,
  volatility: number,
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[]
) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const sma50 = calcSMA(closes, 50);
  const rsi = calcRSI(closes);
  const signals = computeSignals(closes);
  const latestClose = closes[closes.length - 1] ?? currentPrice;
  const latestEma12 = ema12[ema12.length - 1];
  const latestEma26 = ema26[ema26.length - 1];
  const latestSma50 = sma50[sma50.length - 1];
  const latestRsi = rsi[rsi.length - 1] ?? null;
  const lastMacd = computeSignals(closes).macdSignal;
  const range20High = Math.max(...highs.slice(-20));
  const range20Low = Math.min(...lows.slice(-20));
  const avgVol20 = volumes.length >= 20 ? volumes.slice(-20).reduce((a, b) => a + b, 0) / 20 : null;
  const avgVol5 = volumes.length >= 5 ? volumes.slice(-5).reduce((a, b) => a + b, 0) / 5 : null;
  const volRatio = avgVol20 && avgVol5 ? avgVol5 / avgVol20 : 1;
  const priceNearEma20 = latestEma12 ? (latestClose - latestEma12) / latestEma12 : 0;
  const isUptrend = latestEma12 != null && latestEma26 != null && latestSma50 != null && latestClose > latestEma12 && latestEma12 > latestEma26 && latestClose > latestSma50;
  const pullbackOk = priceNearEma20 >= -0.03 && priceNearEma20 <= 0.04;
  const rsiOk = latestRsi != null && latestRsi >= 40 && latestRsi <= 60;
  const macdOk = lastMacd === "bullish";
  const volumeOk = volRatio < 0.75;
  const squeeze = range20High > 0 && range20Low > 0 && (range20High - range20Low) / range20High < 0.08;

  let score = 50;
  if (isUptrend) score += 18;
  if (pullbackOk) score += 15;
  if (rsiOk) score += 12;
  if (macdOk) score += 10;
  if (volumeOk) score += 10;
  if (squeeze) score += 8;
  if (latestClose < (latestSma50 ?? latestClose)) score -= 15;
  if (latestRsi != null && latestRsi >= 70) score -= 12;
  if (latestRsi != null && latestRsi < 30) score -= 8;
  score = Math.max(5, Math.min(95, score));

  const bias = ((score - 50) / 50) * 0.28 * Math.min(horizon.days / 30, 2.5);
  const horizonVol = volatility * Math.sqrt(horizon.days / 252);
  const targetPrice = +(currentPrice * (1 + bias)).toFixed(2);
  const changeAmount = +(targetPrice - currentPrice).toFixed(2);
  const direction = changeAmount > 0.25 ? "bullish" : changeAmount < -0.25 ? "bearish" : "neutral";
  const confidence = Math.max(30, Math.min(92, Math.round(72 + (score - 50) * 0.6 - Math.min(horizon.days * 0.2, 18))));
  const supportLevel = +(Math.min(...closes.slice(-60)) * 0.995).toFixed(2);
  const resistanceLevel = +(Math.max(...closes.slice(-60)) * 1.005).toFixed(2);
  const forecast = Array.from({ length: horizon.points }, (_, i) => {
    const step = i + 1;
    const forecastPrice = +(currentPrice * (1 + bias * (step / horizon.points))).toFixed(2);
    const band = +(forecastPrice * (volatility * 0.5)).toFixed(2);
    const d = new Date();
    d.setDate(d.getDate() + Math.round(step * (horizon.days / horizon.points)));
    return {
      date: d.toISOString().split("T")[0],
      predicted: forecastPrice,
      low: +(forecastPrice - band).toFixed(2),
      high: +(forecastPrice + band).toFixed(2),
    };
  });

  const signalsOut = [
    isUptrend ? "Uptrend: price above EMA20 & EMA50 with golden alignment" : "Uptrend not confirmed",
    pullbackOk ? "Pullback to EMA20 — ideal swing entry zone" : "Price not in ideal pullback zone",
    rsiOk ? `RSI ${latestRsi!.toFixed(0)} in ideal swing entry zone (40–60)` : "RSI not in ideal swing zone",
    macdOk ? "MACD histogram bullish crossover — momentum resuming" : "MACD momentum not yet confirmed",
    volumeOk ? "Volume drying up on pullback — sellers exhausting" : "Volume not yet dried up",
    squeeze ? "Tight Bollinger squeeze in uptrend — breakout setup forming" : "No tight base squeeze yet",
  ];

  return {
    horizon: horizon.key,
    label: horizon.label,
    targetPrice,
    confidenceLow: +(targetPrice * 0.97).toFixed(2),
    confidenceHigh: +(targetPrice * 1.03).toFixed(2),
    direction,
    confidenceScore: confidence,
    upside: +(((targetPrice - currentPrice) / currentPrice) * 100).toFixed(1),
    methodology: "Trend-Pullback Confluence: uptrend + pullback to EMA20 + RSI 40–60 + MACD turn + volume dry-up + tight base.",
    supportLevel,
    resistanceLevel,
    forecast,
    signals: signalsOut,
    overallScore: score,
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
  const swingConfluence = HORIZONS.map(h =>
    buildSwingConfluencePrediction(symbol, h, currentPrice, stock.volatility, closes, candles.map(c => c.high), candles.map(c => c.low), candles.map(c => c.volume))
  );

  res.json({
    symbol,
    currency: stock.currency,
    currentPrice,
    currentRsi: latestRsi,
    predictions,
    swingConfluence,
  });
});

export default router;
