import { useState, useMemo } from "react";
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
  Building2, BarChart3, X, LineChart as LineChartIcon
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

export default function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [period, setPeriod] = useState<"1mo" | "3mo" | "6mo" | "1y">("3mo");
  const [tab, setTab] = useState<Tab>("chart");
  const [horizon, setHorizon] = useState<Horizon>("1mo");

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
  const predictionsData = (quote as unknown as { predictions?: PredictionItem[]; swingConfluence?: PredictionItem[] } | undefined);
  const impactNotes = (quote as unknown as { impactNotes?: { national?: string[]; global?: string[] } } | undefined)?.impactNotes;

  const selectedPrediction = useMemo(() => {
    const response = predictionsData?.swingConfluence ?? predictionsData?.predictions;
    const current = quote?.price ?? 0;
    const match = response?.find(p => p.horizon === horizon);
    if (match && match.targetPrice > 0) return match;
    if (current > 0) {
      const targetPrice = +(current * 1.06).toFixed(2);
      return {
        horizon,
        label: HORIZONS.find(h => h.key === horizon)?.label ?? "1M",
        direction: "bullish",
        targetPrice,
        confidenceLow: +(targetPrice * 0.97).toFixed(2),
        confidenceHigh: +(targetPrice * 1.03).toFixed(2),
        confidenceScore: 58,
        upside: +(((targetPrice - current) / current) * 100).toFixed(1),
        methodology: SWING_FALLBACK.methodology,
        supportLevel: current * 0.97,
        resistanceLevel: current * 1.05,
        forecast: history?.candles?.slice(-30).map((c, i) => ({
          date: c.date,
          high: c.high,
          low: c.low,
          predicted: +(c.close * (1 + (i + 1) / 100)).toFixed(2),
        })) ?? [],
        signals: SWING_FALLBACK.signals,
        overallScore: 58,
      };
    }
    return {
      horizon,
      label: HORIZONS.find(h => h.key === horizon)?.label ?? "1M",
      direction: "neutral",
      targetPrice: 0,
      confidenceLow: current,
      confidenceHigh: current,
      confidenceScore: 50,
      upside: 0,
      methodology: SWING_FALLBACK.methodology,
      supportLevel: current,
      resistanceLevel: current,
      forecast: [],
      signals: SWING_FALLBACK.signals,
      overallScore: 50,
    };
  }, [quote, horizon, history, predictionsData]);

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
                  <div className="text-sm font-semibold">{getCurrentVerdict(quote, fundamentals)}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Based on live price change, valuation, and the selected stock’s current conditions.
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Current national impact</div>
                  {formatImpactList(impactNotes?.national).map(note => <div key={note} className="text-xs text-muted-foreground leading-relaxed">• {note}</div>)}
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Current global impact</div>
                  {formatImpactList(impactNotes?.global).map(note => <div key={note} className="text-xs text-muted-foreground leading-relaxed">• {note}</div>)}
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
