import { useState, useMemo } from "react";
import { useParams } from "wouter";
import {
  useGetStockHistory,
  useGetStockIndicators,
  useGetStockQuote,
  useGetStockFundamentals,
  useGetStockPredictions,
  getGetStockHistoryQueryKey,
  getGetStockIndicatorsQueryKey,
  getGetStockQuoteQueryKey,
  getGetStockFundamentalsQueryKey,
  getGetStockPredictionsQueryKey,
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
  Building2, BarChart3, X, LineChart as LineChartIcon, ChevronDown, Check
} from "lucide-react";

type Tab = "chart" | "technical" | "predictions" | "fundamentals";
type Horizon = "1d" | "1w" | "2w" | "1mo" | "3mo" | "6mo" | "12mo";
type PredictionItem = {
  horizon: string;
  label: string;
  targetPrice: number;
  confidenceLow: number;
  confidenceHigh: number;
  direction: string;
  confidenceScore: number;
  upside: number;
  methodology: string;
  supportLevel: number;
  resistanceLevel: number;
  forecast: Array<{ date: string; predicted: number; low: number; high: number }>;
  signals?: string[];
  overallScore?: number;
};
type TechOption = { key: string; label: string; color: string };
type StockImpact = { national?: string[]; global?: string[]; verdict?: string; note?: string };
type IndicatorKey = "app" | "swing_confluence" | "rsi" | "macd" | "sma" | "ema" | "bb" | "price_action";

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "2w", label: "2W" },
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "12mo", label: "1Y" },
];

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "chart", label: "Chart", Icon: LineChartIcon },
  { key: "technical", label: "Technicals", Icon: BarChart3 },
  { key: "predictions", label: "Predictions", Icon: TrendingUp },
  { key: "fundamentals", label: "Fundamentals", Icon: Building2 },
];

function fmt(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  if (currency === "INR" && price >= 100000) return `${sym}${(price / 100000).toFixed(2)}L`;
  return `${sym}${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtLarge(n: number | null, currency: string): string {
  if (n == null) return "N/A";
  const sym = currency === "INR" ? "₹" : "$";
  if (currency === "INR") {
    if (n >= 100000) return `${sym}${(n / 100000).toFixed(2)}L Cr`;
    if (n >= 1000) return `${sym}${(n / 1000).toFixed(2)}K Cr`;
    return `${sym}${n.toFixed(2)} Cr`;
  }
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(2)}T`;
  if (n >= 1) return `${sym}${n.toFixed(2)}B`;
  return `${sym}${(n * 1000).toFixed(2)}M`;
}

function sigColor(sig: string) {
  if (sig === "oversold" || sig === "bullish") return "text-bullish";
  if (sig === "overbought" || sig === "bearish") return "text-bearish";
  return "text-muted-foreground";
}

function MiniChart({ children }: { children: React.ReactNode }) {
  return <div className="h-36">{children}</div>;
}

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const SWING_FALLBACK = {
  methodology: "Swing Confluence: uptrend + pullback to EMA20 + RSI 40–60 + MACD turn + volume dry-up + tight base.",
  signals: [
    "Uptrend: price above EMA20 & EMA50 with golden alignment",
    "Pullback to EMA20 — ideal swing entry zone",
    "RSI in 40–60 zone",
    "MACD momentum resuming",
    "Volume drying up on pullback",
    "Tight base / squeeze forming",
  ],
};

function formatImpactList(items?: string[]) {
  return items?.slice(0, 3) ?? [];
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
  const national: string[] = [];
  const global: string[] = [];
  let verdict = "Neutral / wait";

  if (sector.includes("bank")) {
    national.push("RBI policy, credit growth, and deposit costs matter most.");
    national.push("Loan growth and asset quality can re-rate the stock fast.");
    global.push("FII flows and global rates can impact bank valuation.");
  } else if (sector.includes("it") || sector.includes("tech")) {
    national.push("Rupee moves and deal wins affect earnings.");
    national.push("Hiring demand and margin pressure matter near term.");
    global.push("US spending and recession risk are the key swing factors.");
  } else if (sector.includes("energy") || sector.includes("oil")) {
    national.push("Domestic fuel policy and demand trends matter.");
    national.push("Refining margins and subsidy headlines can move it quickly.");
    global.push("Crude prices and OPEC actions are the main catalysts.");
  } else if (sector.includes("pharma")) {
    national.push("Approvals, compliance, and export demand drive momentum.");
    national.push("Any domestic pricing change can affect sentiment.");
    global.push("FDA actions and US demand can swing results.");
  } else if (sector.includes("auto")) {
    national.push("Festive demand, EMI rates, and inventory levels matter.");
    national.push("EV/ICE mix and launch cycles are important now.");
    global.push("Commodity costs and global growth affect margins.");
  } else {
    national.push("Company news, earnings revisions, and sector policy matter.");
    global.push("Global risk appetite and foreign flows can change direction.");
  }

  if (changePercent > 1.5 && (pe == null || pe < 35)) verdict = "Momentum strong — watch for continuation";
  else if (changePercent > 0.4 && pe != null && pe < 30) verdict = "Healthy setup — possible buy";
  else if (changePercent < -1.5 && (pe == null || pe > 35)) verdict = "Weak now — avoid chasing";
  else if (changePercent < -2.5 || near52WLow) verdict = "High risk — wait for recovery";
  else if (near52WHigh) verdict = "Near highs — be selective";

  if (symbol === "TCS" || symbol === "INFY" || symbol === "HCLTECH") global.unshift("US tech spending and recession risk are key.");
  if (symbol === "HDFCBANK" || symbol === "ICICIBANK" || symbol === "SBIN") national.unshift("Credit growth and RBI liquidity are the main domestic drivers.");

  return { national: national.slice(0, 3), global: global.slice(0, 3), verdict, note: `${symbol} is reacting to live price change and valuation context.` };
}

function getCurrentVerdict(quote?: any, fundamentals?: any) {
  const changePercent = quote?.changePercent ?? 0;
  const pe = fundamentals?.pe ?? quote?.pe ?? null;
  const marketCap = fundamentals?.marketCap ?? quote?.marketCap ?? null;
  let verdict = "Neutral / wait";
  if (changePercent > 0.5 && (pe == null || pe < 35)) verdict = "Watch / possible buy";
  if (changePercent > 1.2 && pe != null && pe < 30) verdict = "Good momentum / invest";
  if (changePercent < -1.2 && pe != null && pe > 35) verdict = "Avoid / weak now";
  if (changePercent < -2 && marketCap != null && marketCap > 0) verdict = "High risk / avoid";
  return verdict;
}

const TECH_OPTIONS: TechOption[] = [
  { key: "sma20", label: "SMA 20", color: "hsl(var(--chart-3))" },
  { key: "sma50", label: "SMA 50", color: "hsl(var(--chart-4))" },
  { key: "ema12", label: "EMA 12", color: "hsl(var(--accent))" },
  { key: "ema26", label: "EMA 26", color: "#f59e0b" },
  { key: "bb", label: "Bollinger Bands", color: "hsl(var(--muted-foreground))" },
  { key: "rsi", label: "RSI", color: "#8b5cf6" },
  { key: "macd", label: "MACD", color: "#06b6d4" },
  { key: "stoch", label: "Stochastic", color: "#10b981" },
  { key: "cci", label: "CCI", color: "#f97316" },
  { key: "williamsr", label: "Williams %R", color: "#ef4444" },
  { key: "volume", label: "Volume", color: "#6366f1" },
  { key: "adx", label: "ADX / DI", color: "#22c55e" },
];

const PREDICTION_INDICATORS: { key: IndicatorKey; label: string }[] = [
  { key: "app", label: "App Suggested" },
  { key: "swing_confluence", label: "⭐ Swing Confluence" },
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
  { key: "sma", label: "SMA" },
  { key: "ema", label: "EMA" },
  { key: "bb", label: "Bollinger Bands" },
  { key: "price_action", label: "Price Action" },
];

export default function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
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

  const { data: quote, isLoading: ql } = useGetStockQuote(symbol, {
    query: { enabled: !!symbol, queryKey: getGetStockQuoteQueryKey(symbol) }
  });
  const { data: history, isLoading: hl } = useGetStockHistory(symbol, { period }, {
    query: { enabled: !!symbol, queryKey: getGetStockHistoryQueryKey(symbol, { period }) }
  });
  const { data: indicators, isLoading: il } = useGetStockIndicators(symbol, { period }, {
    query: { enabled: !!symbol, queryKey: getGetStockIndicatorsQueryKey(symbol, { period }) }
  });
  const { data: fundamentals, isLoading: fl } = useGetStockFundamentals(symbol, {
    query: { enabled: !!symbol && tab === "fundamentals", queryKey: getGetStockFundamentalsQueryKey(symbol) }
  });
  const { data: stockPredictions } = useGetStockPredictions(symbol, {
    query: { enabled: !!symbol, queryKey: getGetStockPredictionsQueryKey(symbol) }
  });

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
  const predictionsData = stockPredictions as unknown as { predictions?: PredictionItem[]; swingConfluence?: PredictionItem[] } | undefined;
  const impactNotes = deriveStockImpact(quote, fundamentals);

  const selectedPrediction = useMemo(() => {
    const response = predictionMode === "swing_confluence" ? predictionsData?.swingConfluence : predictionsData?.predictions;
    return response?.find(p => p.horizon === horizon) ?? null;
  }, [predictionMode, predictionsData, horizon]);

  const activeTechs = useMemo(() => {
    const list = [];
    if (showSMA20) list.push("sma20");
    if (showSMA50) list.push("sma50");
    if (showEMA12) list.push("ema12");
    if (showEMA26) list.push("ema26");
    if (showBB) list.push("bb");
    if (showRSI) list.push("rsi");
    if (showMACD) list.push("macd");
    if (showStoch) list.push("stoch");
    if (showCCI) list.push("cci");
    if (showWilliamsR) list.push("williamsr");
    if (showVolume) list.push("volume");
    if (showADX) list.push("adx");
    return list;
  }, [showSMA20, showSMA50, showEMA12, showEMA26, showBB, showRSI, showMACD, showStoch, showCCI, showWilliamsR, showVolume, showADX]);

  const toggleTech = (key: string) => {
    if (key === "sma20") setShowSMA20(v => !v);
    if (key === "sma50") setShowSMA50(v => !v);
    if (key === "ema12") setShowEMA12(v => !v);
    if (key === "ema26") setShowEMA26(v => !v);
    if (key === "bb") setShowBB(v => !v);
    if (key === "rsi") setShowRSI(v => !v);
    if (key === "macd") setShowMACD(v => !v);
    if (key === "stoch") setShowStoch(v => !v);
    if (key === "cci") setShowCCI(v => !v);
    if (key === "williamsr") setShowWilliamsR(v => !v);
    if (key === "volume") setShowVolume(v => !v);
    if (key === "adx") setShowADX(v => !v);
  };

  const tt = {
    contentStyle: { backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" },
    itemStyle: { color: "hsl(var(--foreground))" },
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-w-4xl mx-auto w-full">
      <div className="shrink-0 px-1 pb-2">
        {ql ? (
          <div className="space-y-1.5"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-52" /></div>
        ) : quote ? (
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-base">{currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                <h1 className="text-xl font-bold tracking-tight">{quote.symbol}</h1>
                <span className="text-lg font-data">{fmt(quote.price, currency)}</span>
                <span className={cn("font-data text-sm font-semibold", quote.changePercent >= 0 ? "text-bullish" : "text-bearish")}>{quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%</span>
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5 truncate max-w-xs">{quote.name}</p>
            </div>
            <div className="bg-secondary/60 rounded-lg p-0.5 flex shrink-0">
              {(["1mo","3mo","6mo","1y"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-colors", period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{p.toUpperCase()}</button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-destructive text-sm">Symbol not found</p>
        )}
      </div>

      <div className="shrink-0 bg-secondary/50 rounded-xl p-1 flex gap-1 mb-3">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={cn("flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors", tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}> <Icon className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline truncate">{label}</span></button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-4">
        {tab === "chart" && (
          <div className="flex flex-col gap-3">
            <Card className="bg-card">
              <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-medium">Price Action</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "SMA20", val: showSMA20, set: setShowSMA20, color: "hsl(var(--chart-3))" },
                    { label: "SMA50", val: showSMA50, set: setShowSMA50, color: "hsl(var(--chart-4))" },
                    { label: "EMA12", val: showEMA12, set: setShowEMA12, color: "hsl(var(--accent))" },
                    { label: "EMA26", val: showEMA26, set: setShowEMA26, color: "#f59e0b" },
                    { label: "BB", val: showBB, set: setShowBB, color: "hsl(var(--muted-foreground))" },
                  ].map(o => (
                    <button key={o.label} onClick={() => o.set(!o.val)} className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors", o.val ? "bg-secondary text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent")}> <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: o.val ? o.color : "transparent", border: `1.5px solid ${o.color}` }} /> {o.label}</button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0 relative" style={{ height: 280 }}>
                {(hl || il) && <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/40"><Activity className="w-6 h-6 animate-spin text-primary" /></div>}
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} tickFormatter={v => v.substring(5)} />
                    <YAxis domain={["auto","auto"]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                    <Tooltip {...tt} formatter={(v: any, name: string) => { if (["wickRange","candleRange","bbRange"].includes(name)) return null; return [fmt(Number(v), currency), name]; }} />
                    {showBB && <Area type="monotone" dataKey="bbRange" stroke="none" fill="hsl(var(--muted))" fillOpacity={0.15} isAnimationActive={false} />}
                    <Bar dataKey="wickRange" barSize={1} fill="hsl(var(--muted-foreground))" isAnimationActive={false} />
                    <Bar dataKey="candleRange" barSize={7} fill="hsl(var(--muted-foreground))" isAnimationActive={false} shape={(props: any) => { const { x, y, width, height, payload } = props; return <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={payload.isBullish ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} />; }} />
                    {showSMA20 && <Line type="monotone" dataKey="sma20" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
                    {showSMA50 && <Line type="monotone" dataKey="sma50" stroke="hsl(var(--chart-4))" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
                    {showEMA12 && <Line type="monotone" dataKey="ema12" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />}
                    {showEMA26 && <Line type="monotone" dataKey="ema26" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />}
                    {showBB && <Line type="monotone" dataKey="bbUpper" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" dot={false} strokeWidth={1} isAnimationActive={false} />}
                    {showBB && <Line type="monotone" dataKey="bbLower" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" dot={false} strokeWidth={1} isAnimationActive={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "technical" && (
          <div className="flex flex-col gap-3">
            <Card className="bg-card">
              <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium">Indicators</CardTitle>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => setTechnicalMenuOpen(v => !v)}>
                  Choose indicators <ChevronDown className="ml-1 w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              {technicalMenuOpen && (
                <CardContent className="p-3 border-b border-border">
                  <div className="grid grid-cols-2 gap-2">
                    {TECH_OPTIONS.map(opt => {
                      const active = activeTechs.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          onClick={() => toggleTech(opt.key)}
                          className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors", active ? "bg-secondary border-border text-foreground" : "bg-transparent border-transparent text-muted-foreground")}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                            {opt.label}
                          </span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              )}
              <CardContent className="p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {activeTechs.length ? activeTechs.map(key => {
                    const opt = TECH_OPTIONS.find(o => o.key === key)!;
                    return <button key={key} onClick={() => toggleTech(key)} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-foreground">{opt.label} ×</button>;
                  }) : <div className="text-sm text-muted-foreground">Pick indicators to update the chart.</div>}
                </div>
                <div className="relative" style={{ height: 320 }}>
                  {(hl || il) && <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/40"><Activity className="w-6 h-6 animate-spin text-primary" /></div>}
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} tickFormatter={v => v.substring(5)} />
                      <YAxis domain={["auto","auto"]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                      <Tooltip {...tt} formatter={(v: any, name: string) => { if (["wickRange","candleRange","bbRange"].includes(name)) return null; return [fmt(Number(v), currency), name]; }} />
                      {showBB && <Area type="monotone" dataKey="bbRange" stroke="none" fill="hsl(var(--muted))" fillOpacity={0.15} isAnimationActive={false} />}
                      <Bar dataKey="wickRange" barSize={1} fill="hsl(var(--muted-foreground))" isAnimationActive={false} />
                      <Bar dataKey="candleRange" barSize={7} fill="hsl(var(--muted-foreground))" isAnimationActive={false} shape={(props: any) => { const { x, y, width, height, payload } = props; return <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={payload.isBullish ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} />; }} />
                      {showSMA20 && <Line type="monotone" dataKey="sma20" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
                      {showSMA50 && <Line type="monotone" dataKey="sma50" stroke="hsl(var(--chart-4))" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
                      {showEMA12 && <Line type="monotone" dataKey="ema12" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />}
                      {showEMA26 && <Line type="monotone" dataKey="ema26" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />}
                      {showRSI && <Line type="monotone" dataKey="rsi" data={rsiData} stroke="#8b5cf6" dot={false} strokeWidth={1.3} isAnimationActive={false} />}
                      {showMACD && <Line type="monotone" dataKey="macd" data={macdData} stroke="#06b6d4" dot={false} strokeWidth={1.3} isAnimationActive={false} />}
                      {showStoch && <Line type="monotone" dataKey="k" data={stochData} stroke="#10b981" dot={false} strokeWidth={1.3} isAnimationActive={false} />}
                      {showCCI && <Line type="monotone" dataKey="value" data={cciData} stroke="#f97316" dot={false} strokeWidth={1.3} isAnimationActive={false} />}
                      {showWilliamsR && <Line type="monotone" dataKey="value" data={wrData} stroke="#ef4444" dot={false} strokeWidth={1.3} isAnimationActive={false} />}
                      {showADX && <Line type="monotone" dataKey="adx" data={adxData} stroke="#22c55e" dot={false} strokeWidth={1.3} isAnimationActive={false} />}
                      {showVolume && <Bar dataKey="volume" barSize={3} fill="#6366f1" isAnimationActive={false} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "predictions" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {HORIZONS.map(h => (
                <button key={h.key} onClick={() => setHorizon(h.key)} className={cn("py-2 text-xs font-semibold rounded-lg transition-colors", horizon === h.key ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground")}>{h.label}</button>
              ))}
            </div>

            {hl ? (
              <div className="space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>
            ) : selectedPrediction ? (
              <>
                <Card className="bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Target · {selectedPrediction.label}</span>
                      <span className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", selectedPrediction.direction === "bullish" ? "bg-bullish/15 text-bullish" : selectedPrediction.direction === "bearish" ? "bg-bearish/15 text-bearish" : "bg-secondary text-muted-foreground")}>{selectedPrediction.direction === "bullish" ? <TrendingUp className="w-3 h-3" /> : selectedPrediction.direction === "bearish" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}{selectedPrediction.direction.toUpperCase()}</span>
                    </div>
                    <div className="text-3xl font-bold font-data">{selectedPrediction.targetPrice > 0 ? fmt(selectedPrediction.targetPrice, currency) : "N/A"}</div>
                    <div className={cn("text-sm font-data font-semibold", selectedPrediction.upside >= 0 ? "text-bullish" : "text-bearish")}>{formatPct(selectedPrediction.upside)} expected upside</div>
                    <div className="text-xs text-muted-foreground">Range: {fmt(selectedPrediction.confidenceLow, currency)} — {fmt(selectedPrediction.confidenceHigh, currency)}</div>
                    {!!selectedPrediction.signals?.length && (
                      <div className="space-y-1">
                        {selectedPrediction.signals?.slice(0, 4).map(s => (
                          <div key={s} className="text-[11px] text-muted-foreground">{s}</div>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-data font-semibold">{selectedPrediction.confidenceScore}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", selectedPrediction.confidenceScore >= 70 ? "bg-bullish" : selectedPrediction.confidenceScore >= 55 ? "bg-amber-500" : "bg-bearish")} style={{ width: `${selectedPrediction.confidenceScore}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="py-2 px-3 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-data">PRICE FORECAST</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={selectedPrediction.forecast} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.substring(5)} interval="preserveStartEnd" />
                        <YAxis domain={["auto","auto"]} orientation="right" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                        <Tooltip {...tt} formatter={(v: any) => [fmt(Number(v), currency), ""]} />
                        <Area type="monotone" dataKey="high" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} isAnimationActive={false} />
                        <Area type="monotone" dataKey="low" stroke="none" fill="hsl(var(--background))" fillOpacity={1} isAnimationActive={false} />
                        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Support</span>
                      <span className="font-data text-bullish font-semibold">{fmt(selectedPrediction.supportLevel, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resistance</span>
                      <span className="font-data text-bearish font-semibold">{fmt(selectedPrediction.resistanceLevel, currency)}</span>
                    </div>
                    <p className="border-t border-border pt-2 text-xs text-muted-foreground leading-relaxed">{selectedPrediction.methodology}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="py-2 px-3 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-data">ALL HORIZONS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {HORIZONS.map(h => (
                        <button key={h.key} onClick={() => setHorizon(h.key)} className={cn("w-full flex justify-between items-center px-3 py-2.5 text-xs transition-colors hover:bg-secondary/30", horizon === h.key && "bg-secondary/50")}>
                          <span className="text-muted-foreground font-data">{h.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-data">{selectedPrediction.targetPrice > 0 ? fmt(selectedPrediction.targetPrice, currency) : "N/A"}</span>
                            <span className={cn("font-semibold w-14 text-right", selectedPrediction.upside >= 0 ? "text-bullish" : "text-bearish")}>{formatPct(selectedPrediction.upside)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No prediction data available</p>
            )}
          </div>
        )}

        {tab === "fundamentals" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="bg-card">
              <CardHeader className="py-2 px-3 border-b border-border">
                <CardTitle className="text-xs text-muted-foreground font-data">VALUATION + IMPACT NOTES</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-muted-foreground text-xs mb-1">Market Cap</div><div className="font-data font-semibold">{fmtLarge(fundamentals?.marketCap ?? null, currency)}</div></div>
                  <div><div className="text-muted-foreground text-xs mb-1">P/E Ratio</div><div className="font-data font-semibold">{fundamentals?.pe ?? "N/A"}</div></div>
                  <div><div className="text-muted-foreground text-xs mb-1">52W High</div><div className="font-data font-semibold">{fundamentals?.week52High ? fmt(fundamentals.week52High, currency) : "N/A"}</div></div>
                  <div><div className="text-muted-foreground text-xs mb-1">52W Low</div><div className="font-data font-semibold">{fundamentals?.week52Low ? fmt(fundamentals.week52Low, currency) : "N/A"}</div></div>
                </div>
                <div className="rounded-lg border border-border bg-primary/5 p-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Current stock verdict</div>
                  <div className="text-sm font-semibold">{impactNotes.verdict ?? getCurrentVerdict(quote, fundamentals)}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {impactNotes.note ?? "Based on live price change, valuation, and the selected stock’s current conditions."}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Current national impact</div>
                  {formatImpactList(impactNotes.national).map(note => <div key={note} className="text-xs text-muted-foreground leading-relaxed">• {note}</div>)}
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Current global impact</div>
                  {formatImpactList(impactNotes.global).map(note => <div key={note} className="text-xs text-muted-foreground leading-relaxed">• {note}</div>)}
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">What to watch now</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Earnings, RBI/Fed moves, crude prices, rupee strength, sector news, and sudden market risk-off can change this stock fast.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
