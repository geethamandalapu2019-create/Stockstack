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
  const dates = candles.map(c => c.date);

  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const rsi = calcRSI(closes);
  const macd = calcMACD(closes);
  const bb = calcBollingerBands(closes);
  const signals = computeSignals(closes);

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
      date,
      upper: bb[i]?.upper ?? null,
      middle: bb[i]?.middle ?? null,
      lower: bb[i]?.lower ?? null,
    })),
    currentRsi: signals.currentRsi,
    rsiSignal: signals.rsiSignal,
    macdSignal: signals.macdSignal,
    bbSignal: signals.bbSignal,
    overallSignal: signals.overallSignal,
  });
});

export default router;
