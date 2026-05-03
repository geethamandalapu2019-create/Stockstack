import { Router } from "express";
import {
  STOCKS,
  generateCandles,
  periodToDays,
  calcSMA,
  calcEMA,
  calcRSI,
  calcMACD,
  calcBollingerBands,
  calcStochastic,
  calcCCI,
  calcWilliamsR,
  calcATR,
  calcOBV,
  calcADX,
  computeSignals,
  getCurrentPrice,
  getStockBySymbol,
} from "../lib/stockData.js";

const router = Router();

// GET /stocks/search?q=
router.get("/search", (req, res) => {
  const q = (req.query.q as string ?? "").toLowerCase().trim();
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  const results = STOCKS.filter(
    s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 10).map(s => ({
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    exchange: s.exchange,
    currency: s.currency,
  }));
  res.json(results);
});

// GET /stocks/:symbol/quote
router.get("/:symbol/quote", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = getStockBySymbol(symbol);
  if (!stock) {
    res.status(404).json({ error: `Symbol '${symbol}' not found` });
    return;
  }

  const candles = generateCandles(symbol, 365, "1d");
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const week52 = candles.slice(-252);
  const change = +(latest.close - prev.close).toFixed(2);
  const changePercent = +((change / prev.close) * 100).toFixed(2);

  res.json({
    symbol: stock.symbol,
    name: stock.name,
    price: latest.close,
    change,
    changePercent,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
    marketCap: stock.marketCapB ?? null,
    week52High: +Math.max(...week52.map(c => c.high)).toFixed(2),
    week52Low: +Math.min(...week52.map(c => c.low)).toFixed(2),
    pe: stock.pe ?? null,
    sector: stock.sector,
    exchange: stock.exchange,
    currency: stock.currency,
  });
});

// GET /stocks/:symbol/history
router.get("/:symbol/history", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = getStockBySymbol(symbol);
  if (!stock) {
    res.status(404).json({ error: `Symbol '${symbol}' not found` });
    return;
  }

  const period = (req.query.period as string) ?? "3mo";
  const interval = (req.query.interval as string) ?? "1d";
  const days = periodToDays(period);
  const candles = generateCandles(symbol, days, interval as "1d" | "1w");

  res.json({ symbol, period, interval, currency: stock.currency, candles });
});

// GET /stocks/:symbol/indicators
router.get("/:symbol/indicators", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = getStockBySymbol(symbol);
  if (!stock) {
    res.status(404).json({ error: `Symbol '${symbol}' not found` });
    return;
  }

  const period = (req.query.period as string) ?? "3mo";
  const days = periodToDays(period);
  const candles = generateCandles(symbol, days, "1d");
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);
  const dates = candles.map(c => c.date);

  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const rsi = calcRSI(closes);
  const macd = calcMACD(closes);
  const bb = calcBollingerBands(closes);
  const stoch = calcStochastic(highs, lows, closes);
  const cci = calcCCI(highs, lows, closes);
  const wr = calcWilliamsR(highs, lows, closes);
  const atr = calcATR(highs, lows, closes);
  const obv = calcOBV(closes, volumes);
  const adx = calcADX(highs, lows, closes);
  const signals = computeSignals(closes);

  // Current values for sidebar summary
  const lastStoch = stoch[stoch.length - 1];
  const lastCci = cci[cci.length - 1];
  const lastWr = wr[wr.length - 1];
  const lastAdx = adx[adx.length - 1];

  const stochSignal = lastStoch.k == null ? "neutral"
    : lastStoch.k < 20 ? "oversold" : lastStoch.k > 80 ? "overbought" : "neutral";
  const cciSignal = lastCci == null ? "neutral"
    : lastCci < -100 ? "oversold" : lastCci > 100 ? "overbought" : "neutral";
  const williamsRSignal = lastWr == null ? "neutral"
    : lastWr < -80 ? "oversold" : lastWr > -20 ? "overbought" : "neutral";
  const adxTrend = lastAdx.adx == null ? "weak"
    : lastAdx.adx > 25 ? (lastAdx.plusDI! > lastAdx.minusDI! ? "bullish" : "bearish") : "weak";
  const comboSignals = [
    signals.rsiSignal === "oversold" && signals.macdSignal === "bullish" ? "RSI + MACD bullish momentum confirmation" : null,
    stochSignal === "oversold" && cciSignal === "oversold" ? "Stochastic + CCI oversold reversal setup" : null,
    bb?.[bb.length - 1]?.lower != null && obv[obv.length - 1] != null && obv[obv.length - 1] > obv[Math.max(0, obv.length - 11)] ? "Bollinger + OBV accumulation breakout setup" : null,
    adxTrend === "bullish" && lastAdx.plusDI! > lastAdx.minusDI! ? "ADX + DI trend confirmation" : null,
  ].filter((v): v is string => Boolean(v));

  res.json({
    symbol,
    period,
    rsi: dates.map((date, i) => ({ date, value: rsi[i] ?? null })),
    sma20: dates.map((date, i) => ({ date, value: sma20[i] ?? null })),
    sma50: dates.map((date, i) => ({ date, value: sma50[i] ?? null })),
    ema12: dates.map((date, i) => ({ date, value: ema12[i] ?? null })),
    ema26: dates.map((date, i) => ({ date, value: ema26[i] ?? null })),
    macd: dates.map((date, i) => ({
      date,
      macd: macd[i]?.macd ?? null,
      signal: macd[i]?.signal ?? null,
      histogram: macd[i]?.histogram ?? null,
    })),
    bollingerBands: dates.map((date, i) => ({
      date, upper: bb[i]?.upper ?? null, middle: bb[i]?.middle ?? null, lower: bb[i]?.lower ?? null,
    })),
    stochastic: dates.map((date, i) => ({ date, k: stoch[i]?.k ?? null, d: stoch[i]?.d ?? null })),
    cci: dates.map((date, i) => ({ date, value: cci[i] ?? null })),
    williamsR: dates.map((date, i) => ({ date, value: wr[i] ?? null })),
    atr: dates.map((date, i) => ({ date, value: atr[i] ?? null })),
    obv: dates.map((date, i) => ({ date, value: obv[i] ?? null })),
    adx: dates.map((date, i) => ({
      date, adx: adx[i]?.adx ?? null, plusDI: adx[i]?.plusDI ?? null, minusDI: adx[i]?.minusDI ?? null,
    })),
    // Current values
    currentRsi: signals.currentRsi,
    currentStochK: lastStoch.k,
    currentStochD: lastStoch.d,
    currentCci: lastCci,
    currentWilliamsR: lastWr,
    currentAdx: lastAdx.adx,
    currentPlusDI: lastAdx.plusDI,
    currentMinusDI: lastAdx.minusDI,
    // Signals
    rsiSignal: signals.rsiSignal,
    macdSignal: signals.macdSignal,
    bbSignal: signals.bbSignal,
    stochSignal,
    cciSignal,
    williamsRSignal,
    adxTrend,
    comboSignals,
    overallSignal: signals.overallSignal,
  });
});

export default router;
