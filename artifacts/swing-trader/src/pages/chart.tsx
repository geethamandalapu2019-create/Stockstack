import { useEffect, useState, useMemo } from "react";
import { useParams } from "wouter";
import {
  useGetStockHistory,
  useGetStockIndicators,
  useGetStockQuote,
  useGetStockFundamentals,
  getGetStockHistoryQueryKey,
  getGetStockIndicatorsQueryKey,
  getGetStockQuoteQueryKey,
  getGetStockFundamentalsQueryKey,
} from "@workspace/api-client-react";
import {
  ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, Bar, ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SignalBadge } from "./dashboard";
import {
  Activity, TrendingUp, TrendingDown, Minus,
  Building2, BarChart3, X, LineChart as LineChartIcon, ChevronDown, Check, Search, RefreshCw
} from "lucide-react";

type Tab = "chart" | "technical" | "predictions" | "fundamentals";
type Horizon = "1d" | "1w" | "2w" | "1mo" | "3mo" | "6mo" | "12mo";
type TechOption = { key: string; label: string; color: string };
type StockImpact = { national?: string[]; global?: string[]; verdict?: string; note?: string };
type IndicatorKey = "app" | "swing_confluence" | "rsi" | "macd" | "sma" | "ema" | "bb" | "price_action";
type TopPredictionResponse = {
  indicator: IndicatorKey;
  stocks: Array<{
    symbol: string;
    name: string;
    sector: string;
    exchange: string;
    currency: string;
    capCategory: "large" | "mid" | "small";
    currentPrice: number;
    overallScore: number;
    direction: string;
    overallSignal: string;
    signals: string[];
    currentRsi: number | null;
    indicator: IndicatorKey;
    indicatorLabel: string;
    predictions: Record<string, { targetPrice: number; changeAmount: number; direction: string; confidence: number; label: string }>;
  }>;
};

function fmt(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  if (currency === "INR" && price >= 100000) return `${sym}${(price / 100000).toFixed(2)}L`;
  return `${sym}${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPrice(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function deriveStockImpact(quote?: any, fundamentals?: any): StockImpact {
  const symbol = (quote?.symbol ?? "").toUpperCase();
  const sector = String(quote?.sector ?? fundamentals?.sector ?? "").toLowerCase();
  const pe = fundamentals?.pe ?? quote?.pe ?? null;
  const marketCap = fundamentals?.marketCap ?? quote?.marketCap ?? null;
  const changePercent = quote?.changePercent ?? 0;
  const price = quote?.price ?? 0;
  const near52WHigh = quote?.week52High ? price >= quote.week52High * 0.94 : false;
  const near52WLow = quote?.week52Low ? price <= quote.week52Low * 1.06 : false;

  let verdict = "Neutral — watch for confirmation";
  const national: string[] = [];
  const global: string[] = [];

  if (sector.includes("bank")) {
    national.push("Credit growth and RBI liquidity are major bank drivers.");
    global.push("Global rate expectations and FII flows can re-rate banks.");
  } else if (sector.includes("it") || sector.includes("tech")) {
    national.push("Rupee moves and hiring demand matter for IT earnings.");
    global.push("US enterprise spending and recession risk matter most.");
  } else if (sector.includes("oil") || sector.includes("energy")) {
    national.push("Government fuel policy and domestic demand matter.");
    global.push("Crude prices and OPEC decisions are major catalysts.");
  } else if (sector.includes("pharma") || sector.includes("health")) {
    national.push("Approvals, compliance, and export demand matter.");
    global.push("FDA actions and US healthcare demand can swing the stock.");
  }

  if (changePercent > 1.5 && (pe == null || pe < 35)) verdict = "Momentum strong — watch for continuation";
  else if (changePercent > 0.4 && pe != null && pe < 30) verdict = "Healthy setup — possible buy";
  else if (changePercent < -1.5 && (pe == null || pe > 35)) verdict = "Weak now — avoid chasing";
  else if (changePercent < -2.5 || near52WLow) verdict = "High risk — wait for recovery";

  return { national: national.slice(0, 3), global: global.slice(0, 3), verdict, note: `${symbol} is reacting to live price change and valuation context.` };
}

function getCurrentVerdict(quote?: any, fundamentals?: any) {
  const changePercent = quote?.changePercent ?? 0;
  const pe = fundamentals?.pe ?? quote?.pe ?? null;
  const marketCap = fundamentals?.marketCap ?? quote?.marketCap ?? null;
  let verdict = "Hold / watch";
  if (changePercent > 0.5 && (pe == null || pe < 35)) verdict = "Watch / possible buy";
  if (changePercent > 1.2 && pe != null && pe < 30) verdict = "Good momentum / invest";
  if (changePercent < -1.2 && pe != null && pe > 35) verdict = "Avoid / weak now";
  if (changePercent < -2 && marketCap != null && marketCap > 0) verdict = "High risk / avoid";
  return verdict;
}

export default function ChartPage() {
  const { symbol = "" } = useParams();
  const [period, setPeriod] = useState<"1mo" | "3mo" | "6mo" | "1y">("3mo");
  const [tab, setTab] = useState<Tab>("chart");
  const [horizon, setHorizon] = useState<Horizon>("1mo");
  const [predictionMode, setPredictionMode] = useState<IndicatorKey>("app");
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showEMA12, setShowEMA12] = useState(false);
  const [showEMA26, setShowEMA26] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [showStoch, setShowStoch] = useState(false);
  const [showCCI, setShowCCI] = useState(false);
  const [showWilliamsR, setShowWilliamsR] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showADX, setShowADX] = useState(false);
  const [technicalMenuOpen, setTechnicalMenuOpen] = useState(false);

  const quoteQuery = { enabled: !!symbol, queryKey: getGetStockQuoteQueryKey(symbol), staleTime: 0, gcTime: 0, refetchOnMount: "always" as const, refetchOnWindowFocus: true };
  const { data: quote, isLoading: ql } = useGetStockQuote(symbol, { query: quoteQuery });
  const { data: history, isLoading: hl } = useGetStockHistory(symbol, { period }, { query: { enabled: !!symbol, queryKey: getGetStockHistoryQueryKey(symbol, { period }) } });
  const { data: indicators, isLoading: il } = useGetStockIndicators(symbol, { period }, { query: { enabled: !!symbol, queryKey: getGetStockIndicatorsQueryKey(symbol, { period }) } });
  const { data: fundamentals, isLoading: fl } = useGetStockFundamentals(symbol, { query: { enabled: !!symbol && tab === "fundamentals", queryKey: getGetStockFundamentalsQueryKey(symbol) } });
  const currency = quote?.currency ?? "INR";

  const chartData = useMemo(() => {
    if (!history?.candles || !indicators) return [];
    return history.candles.map((c, i) => ({
      date: c.date.split("T")[0],
      isBullish: c.close >= c.open,
      candleRange: [Math.min(c.open, c.close), Math.max(c.open, c.close)],
      wickRange: [c.low, c.high],
      sma20: indicators.sma20[i]?.value,
      sma50: indicators.sma50[i]?.value,
      ema12: indicators.ema12[i]?.value,
      ema26: indicators.ema26[i]?.value,
      bbUpper: indicators.bollingerBands[i]?.upper,
      bbLower: indicators.bollingerBands[i]?.lower,
      bbRange: [indicators.bollingerBands[i]?.lower, indicators.bollingerBands[i]?.upper],
    }));
  }, [history, indicators]);

  const rsiData = useMemo(() => indicators?.rsi?.map(p => ({ date: p.date.split("T")[0], value: p.value })) ?? [], [indicators]);
  const macdData = useMemo(() => indicators?.macd?.map(p => ({ date: p.date.split("T")[0], macd: p.macd, signal: p.signal, histogram: p.histogram, isPositive: (p.histogram || 0) > 0 })) ?? [], [indicators]);
  const stochData = useMemo(() => indicators?.stochastic?.map(p => ({ date: p.date.split("T")[0], k: p.k, d: p.d })) ?? [], [indicators]);
  const cciData = useMemo(() => indicators?.cci?.map(p => ({ date: p.date.split("T")[0], value: p.value })) ?? [], [indicators]);
  const wrData = useMemo(() => indicators?.williamsR?.map(p => ({ date: p.date.split("T")[0], value: p.value })) ?? [], [indicators]);
  const volumeData = useMemo(() => history?.candles?.map((c, i) => ({ date: c.date.split("T")[0], volume: c.volume, obv: indicators?.obv[i]?.value, isBullish: c.close >= c.open })) ?? [], [history, indicators]);
  const adxData = useMemo(() => indicators?.adx?.map(p => ({ date: p.date.split("T")[0], adx: p.adx, plusDI: p.plusDI, minusDI: p.minusDI })) ?? [], [indicators]);
  const impactNotes = deriveStockImpact(quote, fundamentals);

  return <div />;
}
