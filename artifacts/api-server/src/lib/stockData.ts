export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  basePrice: number;
  volatility: number;
}

export const STOCKS: StockMeta[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 189.5, volatility: 0.018 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", exchange: "NASDAQ", basePrice: 415.2, volatility: 0.016 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", exchange: "NASDAQ", basePrice: 875.0, volatility: 0.032 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ", basePrice: 248.0, volatility: 0.042 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ", basePrice: 185.0, volatility: 0.022 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Communication Services", exchange: "NASDAQ", basePrice: 176.0, volatility: 0.019 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Communication Services", exchange: "NASDAQ", basePrice: 510.0, volatility: 0.025 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", exchange: "NYSE", basePrice: 198.0, volatility: 0.014 },
  { symbol: "BAC", name: "Bank of America Corp.", sector: "Financials", exchange: "NYSE", basePrice: 38.5, volatility: 0.018 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", exchange: "NYSE", basePrice: 108.0, volatility: 0.016 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", exchange: "NYSE", basePrice: 152.0, volatility: 0.012 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", exchange: "NYSE", basePrice: 275.0, volatility: 0.013 },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples", exchange: "NYSE", basePrice: 68.0, volatility: 0.011 },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare", exchange: "NYSE", basePrice: 512.0, volatility: 0.015 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", exchange: "NASDAQ", basePrice: 178.0, volatility: 0.038 },
  { symbol: "COIN", name: "Coinbase Global Inc.", sector: "Financials", exchange: "NASDAQ", basePrice: 225.0, volatility: 0.055 },
  { symbol: "SOFI", name: "SoFi Technologies Inc.", sector: "Financials", exchange: "NASDAQ", basePrice: 8.2, volatility: 0.048 },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", exchange: "NYSE", basePrice: 22.0, volatility: 0.045 },
  { symbol: "RBLX", name: "Roblox Corp.", sector: "Communication Services", exchange: "NYSE", basePrice: 42.0, volatility: 0.05 },
  { symbol: "RIVN", name: "Rivian Automotive Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ", basePrice: 12.5, volatility: 0.06 },
];

// Seeded random number generator for deterministic data
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateCandles(symbol: string, periodDays: number, interval: "1d" | "1w"): Candle[] {
  const stock = STOCKS.find(s => s.symbol === symbol);
  const basePrice = stock?.basePrice ?? 100;
  const volatility = stock?.volatility ?? 0.02;

  const rng = seededRng(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + periodDays);
  const candles: Candle[] = [];

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const step = interval === "1w" ? 7 : 1;
  const totalCandles = Math.ceil(periodDays / step);

  let price = basePrice * (0.85 + rng() * 0.3);

  for (let i = totalCandles - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - i * step);

    // Skip weekends for daily
    if (interval === "1d" && (date.getDay() === 0 || date.getDay() === 6)) continue;

    const dailyReturn = (rng() - 0.48) * volatility * 2;
    const open = price;
    const close = open * (1 + dailyReturn);
    const highMult = 1 + rng() * volatility;
    const lowMult = 1 - rng() * volatility;
    const high = Math.max(open, close) * highMult;
    const low = Math.min(open, close) * lowMult;
    const volume = Math.floor(1_000_000 + rng() * 50_000_000);

    candles.push({
      date: date.toISOString().split("T")[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });

    price = close;
  }

  return candles;
}

export function periodToDays(period: string): number {
  switch (period) {
    case "1mo": return 30;
    case "3mo": return 90;
    case "6mo": return 180;
    case "1y": return 365;
    case "2y": return 730;
    default: return 90;
  }
}

// ── Technical Indicator Calculations ──────────────────────────────────────────

export function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(4);
  });
}

export function calcEMA(closes: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(closes.length).fill(null);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = +ema.toFixed(4);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = +ema.toFixed(4);
  }
  return result;
}

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = +(100 - 100 / (1 + rs)).toFixed(2);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = +(100 - 100 / (1 + r)).toFixed(2);
  }
  return result;
}

export interface MACDData {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export function calcMACD(closes: number[]): MACDData[] {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);

  const macdLine: (number | null)[] = closes.map((_, i) => {
    if (ema12[i] == null || ema26[i] == null) return null;
    return +((ema12[i] as number) - (ema26[i] as number)).toFixed(4);
  });

  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalEMA = calcEMA(macdValues, 9);
  let sigIdx = 0;
  const signalFull: (number | null)[] = macdLine.map(v => {
    if (v === null) return null;
    return signalEMA[sigIdx++];
  });

  return closes.map((_, i) => ({
    macd: macdLine[i],
    signal: signalFull[i],
    histogram: macdLine[i] != null && signalFull[i] != null
      ? +((macdLine[i] as number) - (signalFull[i] as number)).toFixed(4)
      : null,
  }));
}

export interface BBData {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

export function calcBollingerBands(closes: number[], period = 20, stdDev = 2): BBData[] {
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    return {
      upper: +(mean + stdDev * sd).toFixed(4),
      middle: +mean.toFixed(4),
      lower: +(mean - stdDev * sd).toFixed(4),
    };
  });
}

export function getStockBySymbol(symbol: string): StockMeta | undefined {
  return STOCKS.find(s => s.symbol === symbol.toUpperCase());
}

export function getCurrentPrice(symbol: string): { price: number; change: number; changePercent: number } {
  const stock = getStockBySymbol(symbol);
  const candles = generateCandles(symbol.toUpperCase(), 5, "1d");
  if (candles.length < 2) return { price: stock?.basePrice ?? 100, change: 0, changePercent: 0 };
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = +(latest.close - prev.close).toFixed(2);
  const changePercent = +((change / prev.close) * 100).toFixed(2);
  return { price: latest.close, change, changePercent };
}

export function computeSignals(closes: number[]) {
  const rsiValues = calcRSI(closes);
  const macdData = calcMACD(closes);
  const bb = calcBollingerBands(closes);
  const latest = closes[closes.length - 1];

  const currentRsi = rsiValues[rsiValues.length - 1];
  const latestMacd = macdData[macdData.length - 1];
  const latestBB = bb[bb.length - 1];

  const rsiSignal = currentRsi == null ? "neutral"
    : currentRsi < 35 ? "oversold"
    : currentRsi > 65 ? "overbought"
    : "neutral";

  const macdSignal = latestMacd.macd == null || latestMacd.histogram == null ? "neutral"
    : latestMacd.histogram > 0 && latestMacd.macd > 0 ? "bullish"
    : latestMacd.histogram < 0 && latestMacd.macd < 0 ? "bearish"
    : "neutral";

  const bbSignal = latestBB.upper == null ? "neutral"
    : latest > latestBB.upper * 0.99 ? "near_upper"
    : latest < latestBB.lower! * 1.01 ? "near_lower"
    : "neutral";

  // Overall signal scoring
  let score = 0;
  if (rsiSignal === "oversold") score += 2;
  if (rsiSignal === "overbought") score -= 2;
  if (macdSignal === "bullish") score += 2;
  if (macdSignal === "bearish") score -= 2;
  if (bbSignal === "near_lower") score += 1;
  if (bbSignal === "near_upper") score -= 1;

  const overallSignal = score >= 4 ? "strong_buy"
    : score >= 2 ? "buy"
    : score <= -4 ? "strong_sell"
    : score <= -2 ? "sell"
    : "neutral";

  return { currentRsi, rsiSignal, macdSignal, bbSignal, overallSignal };
}
