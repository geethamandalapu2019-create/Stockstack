import { Router } from "express";
import { generateCandles, getStockBySymbol } from "../lib/stockData.js";

const router = Router();

// GET /stocks/:symbol/fundamentals
router.get("/:symbol/fundamentals", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = getStockBySymbol(symbol);
  if (!stock) {
    res.status(404).json({ error: `Symbol '${symbol}' not found` });
    return;
  }

  const candles = generateCandles(symbol, 365, "1d");
  const week52 = candles;
  const week52High = +Math.max(...week52.map(c => c.high)).toFixed(2);
  const week52Low = +Math.min(...week52.map(c => c.low)).toFixed(2);

  // Compute a fundamental score (0-100)
  let score = 50;
  const pe = stock.pe ?? null;
  const roe = stock.roe ?? null;
  const debtToEquity = stock.debtToEquity ?? null;
  const dividendYield = stock.dividendYield ?? null;
  const pb = stock.pb ?? null;

  // Lower P/E = better (for value)
  if (pe !== null) {
    if (pe < 15) score += 10;
    else if (pe < 25) score += 5;
    else if (pe > 60) score -= 10;
    else if (pe > 40) score -= 5;
  }

  // Higher ROE = better
  if (roe !== null) {
    if (roe > 25) score += 10;
    else if (roe > 15) score += 5;
    else if (roe < 5) score -= 8;
  }

  // Lower D/E = better
  if (debtToEquity !== null) {
    if (debtToEquity < 0.3) score += 8;
    else if (debtToEquity < 1) score += 4;
    else if (debtToEquity > 3) score -= 8;
  }

  // Dividend yield bonus
  if (dividendYield !== null && dividendYield > 2) score += 5;

  // P/B check
  if (pb !== null) {
    if (pb < 1) score += 8;
    else if (pb < 3) score += 3;
    else if (pb > 15) score -= 5;
  }

  score = Math.max(20, Math.min(95, score));

  // Valuation verdict based on P/E relative to sector norm
  let valuationVerdict: "undervalued" | "fairly_valued" | "overvalued" = "fairly_valued";
  if (pe !== null) {
    const sectorPE: Record<string, number> = {
      "Banking": 15,
      "Information Technology": 28,
      "FMCG": 45,
      "Energy": 12,
      "Pharmaceuticals": 30,
      "Automobile": 22,
      "Metals": 12,
      "Telecom": 35,
      "NBFC": 25,
      "Infrastructure": 28,
      "Cement": 30,
      "Power": 20,
      "Internet & Technology": 80,
      "Technology": 35,
      "Financials": 18,
      "Consumer Discretionary": 40,
      "Communication Services": 30,
      "Conglomerate": 35,
    };
    const norm = sectorPE[stock.sector] ?? 25;
    if (pe < norm * 0.8) valuationVerdict = "undervalued";
    else if (pe > norm * 1.3) valuationVerdict = "overvalued";
  }

  res.json({
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    exchange: stock.exchange,
    currency: stock.currency,
    marketCap: stock.marketCapB ?? null,
    pe: stock.pe ?? null,
    pb: stock.pb ?? null,
    eps: stock.eps ?? null,
    roe: stock.roe ?? null,
    debtToEquity: stock.debtToEquity ?? null,
    dividendYield: stock.dividendYield ?? null,
    revenueB: stock.revenueB ?? null,
    netProfitB: stock.netProfitB ?? null,
    promoterHolding: stock.promoterHolding ?? null,
    fiiHolding: stock.fiiHolding ?? null,
    diiHolding: stock.diiHolding ?? null,
    week52High,
    week52Low,
    bookValue: stock.bookValue ?? null,
    description: stock.description ?? `${stock.name} listed on ${stock.exchange}.`,
    valuationVerdict,
    fundamentalScore: score,
  });
});

export default router;
