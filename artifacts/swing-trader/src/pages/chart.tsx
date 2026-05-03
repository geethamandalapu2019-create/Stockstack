import { useState, useMemo } from "react";
import { useParams } from "wouter";
import {
  useGetStockHistory,
  useGetStockIndicators,
  useGetStockQuote,
  useGetStockPredictions,
  useGetStockFundamentals,
  getGetStockHistoryQueryKey,
  getGetStockIndicatorsQueryKey,
  getGetStockQuoteQueryKey,
  getGetStockPredictionsQueryKey,
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
type Horizon = "1d" | "1w" | "1mo" | "3mo" | "6mo" | "12mo";

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "12mo", label: "1Y" },
];

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "chart",        label: "Chart",        Icon: LineChartIcon },
  { key: "technical",   label: "Technicals",   Icon: BarChart3     },
  { key: "predictions", label: "Predictions",  Icon: TrendingUp    },
  { key: "fundamentals",label: "Fundamentals", Icon: Building2     },
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
    if (n >= 1000)   return `${sym}${(n / 1000).toFixed(2)}K Cr`;
    return `${sym}${n.toFixed(2)} Cr`;
  }
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(2)}T`;
  if (n >= 1)    return `${sym}${n.toFixed(2)}B`;
  return `${sym}${(n * 1000).toFixed(2)}M`;
}

function sigColor(sig: string) {
  if (sig === "oversold" || sig === "bullish")   return "text-bullish";
  if (sig === "overbought" || sig === "bearish") return "text-bearish";
  return "text-muted-foreground";
}

function MiniChart({ children }: { children: React.ReactNode }) {
  return <div className="h-36">{children}</div>;
}

export default function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [period, setPeriod]     = useState<"1mo" | "3mo" | "6mo" | "1y">("3mo");
  const [tab, setTab]           = useState<Tab>("chart");
  const [horizon, setHorizon]   = useState<Horizon>("1mo");

  const [showSMA20,     setShowSMA20]     = useState(true);
  const [showSMA50,     setShowSMA50]     = useState(true);
  const [showEMA12,     setShowEMA12]     = useState(false);
  const [showEMA26,     setShowEMA26]     = useState(false);
  const [showBB,        setShowBB]        = useState(false);
  const [showRSI,       setShowRSI]       = useState(true);
  const [showMACD,      setShowMACD]      = useState(true);
  const [showStoch,     setShowStoch]     = useState(false);
  const [showCCI,       setShowCCI]       = useState(false);
  const [showWilliamsR, setShowWilliamsR] = useState(false);
  const [showVolume,    setShowVolume]    = useState(false);
  const [showADX,       setShowADX]       = useState(false);

  const { data: quote,      isLoading: ql } = useGetStockQuote(symbol, {
    query: { enabled: !!symbol, queryKey: getGetStockQuoteQueryKey(symbol) }
  });
  const { data: history,    isLoading: hl } = useGetStockHistory(symbol, { period }, {
    query: { enabled: !!symbol, queryKey: getGetStockHistoryQueryKey(symbol, { period }) }
  });
  const { data: indicators, isLoading: il } = useGetStockIndicators(symbol, { period }, {
    query: { enabled: !!symbol, queryKey: getGetStockIndicatorsQueryKey(symbol, { period }) }
  });
  const { data: predictions, isLoading: pl } = useGetStockPredictions(symbol, {
    query: { enabled: !!symbol && tab === "predictions", queryKey: getGetStockPredictionsQueryKey(symbol) }
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
      wickRange:   [c.low, c.high],
      sma20:    indicators.sma20[i]?.value,
      sma50:    indicators.sma50[i]?.value,
      ema12:    indicators.ema12[i]?.value,
      ema26:    indicators.ema26[i]?.value,
      bbUpper:  indicators.bollingerBands[i]?.upper,
      bbLower:  indicators.bollingerBands[i]?.lower,
      bbRange:  [indicators.bollingerBands[i]?.lower, indicators.bollingerBands[i]?.upper],
    }));
  }, [history, indicators]);

  const rsiData    = useMemo(() => indicators?.rsi?.map(p => ({ date: p.date.split("T")[0], value: p.value })) ?? [], [indicators]);
  const macdData   = useMemo(() => indicators?.macd?.map(p => ({ date: p.date.split("T")[0], macd: p.macd, signal: p.signal, histogram: p.histogram, isPositive: (p.histogram||0)>0 })) ?? [], [indicators]);
  const stochData  = useMemo(() => indicators?.stochastic?.map(p => ({ date: p.date.split("T")[0], k: p.k, d: p.d })) ?? [], [indicators]);
  const cciData    = useMemo(() => indicators?.cci?.map(p => ({ date: p.date.split("T")[0], value: p.value })) ?? [], [indicators]);
  const wrData     = useMemo(() => indicators?.williamsR?.map(p => ({ date: p.date.split("T")[0], value: p.value })) ?? [], [indicators]);
  const volumeData = useMemo(() => history?.candles?.map((c, i) => ({ date: c.date.split("T")[0], volume: c.volume, obv: indicators?.obv[i]?.value, isBullish: c.close >= c.open })) ?? [], [history, indicators]);
  const adxData    = useMemo(() => indicators?.adx?.map(p => ({ date: p.date.split("T")[0], adx: p.adx, plusDI: p.plusDI, minusDI: p.minusDI })) ?? [], [indicators]);

  const selPred = useMemo(() => predictions?.predictions.find(p => p.horizon === horizon), [predictions, horizon]);

  const tt = {
    contentStyle: { backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" },
    itemStyle:    { color: "hsl(var(--foreground))" },
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-w-4xl mx-auto w-full">

      {/* ── Stock header ──────────────────────────────────────── */}
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
                <span className={cn("font-data text-sm font-semibold", quote.changePercent >= 0 ? "text-bullish" : "text-bearish")}>
                  {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5 truncate max-w-xs">{quote.name}</p>
            </div>
            {/* Period picker — only relevant on chart tab */}
            <div className="bg-secondary/60 rounded-lg p-0.5 flex shrink-0">
              {(["1mo","3mo","6mo","1y"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >{p.toUpperCase()}</button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-destructive text-sm">Symbol not found</p>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="shrink-0 bg-secondary/50 rounded-xl p-1 flex gap-1 mb-3">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content (each scrolls independently) ──────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-4">

        {/* ── CHART TAB ── */}
        {tab === "chart" && (
          <div className="flex flex-col gap-3">
            {/* Price chart */}
            <Card className="bg-card">
              <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-medium">Price Action</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "SMA20", val: showSMA20, set: setShowSMA20, color: "hsl(var(--chart-3))" },
                    { label: "SMA50", val: showSMA50, set: setShowSMA50, color: "hsl(var(--chart-4))" },
                    { label: "EMA12", val: showEMA12, set: setShowEMA12, color: "hsl(var(--accent))" },
                    { label: "EMA26", val: showEMA26, set: setShowEMA26, color: "#f59e0b" },
                    { label: "BB",    val: showBB,    set: setShowBB,    color: "hsl(var(--muted-foreground))" },
                  ].map(o => (
                    <button key={o.label} onClick={() => o.set(!o.val)}
                      className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors",
                        o.val ? "bg-secondary text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: o.val ? o.color : "transparent", border: `1.5px solid ${o.color}` }} />
                      {o.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0 relative" style={{ height: 280 }}>
                {(hl || il) && <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/40"><Activity className="w-6 h-6 animate-spin text-primary" /></div>}
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} tickFormatter={v => v.substring(5)} />
                    <YAxis domain={["auto","auto"]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right"
                      tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                    <Tooltip {...tt} formatter={(v: any, name: string) => {
                      if (["wickRange","candleRange","bbRange"].includes(name)) return null;
                      return [fmt(Number(v), currency), name];
                    }} />
                    {showBB && <Area type="monotone" dataKey="bbRange" stroke="none" fill="hsl(var(--muted))" fillOpacity={0.15} isAnimationActive={false} />}
                    <Bar dataKey="wickRange" barSize={1} fill="hsl(var(--muted-foreground))" isAnimationActive={false} />
                    <Bar dataKey="candleRange" barSize={7} fill="hsl(var(--muted-foreground))" isAnimationActive={false}
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        return <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={payload.isBullish ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} />;
                      }}
                    />
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

            {/* Quick stats strip */}
            {quote && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "52W High", val: fmt(quote.week52High, currency) },
                  { label: "52W Low",  val: fmt(quote.week52Low, currency) },
                  { label: "P/E",      val: quote.pe ? quote.pe.toFixed(1) : "N/A" },
                  { label: "Volume",   val: `${(quote.volume/1e6).toFixed(2)}M` },
                ].map(r => (
                  <Card key={r.label} className="bg-card">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground">{r.label}</p>
                      <p className="text-sm font-data font-semibold mt-0.5">{r.val}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TECHNICALS TAB ── */}
        {tab === "technical" && (
          <div className="flex flex-col gap-3">
            {/* Signal summary */}
            <Card className="bg-card">
              <CardHeader className="py-2.5 px-3 border-b border-border">
                <CardTitle className="text-sm">Signal Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {il ? (
                  <div className="p-4 space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-20 w-full" /></div>
                ) : indicators ? (
                  <div className="divide-y divide-border">
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <span className="text-sm font-medium">Overall</span>
                      <SignalBadge signal={indicators.overallSignal} />
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        { label: "RSI (14)",      val: `${indicators.currentRsi?.toFixed(1)} — ${indicators.rsiSignal.toUpperCase()}`,               cls: sigColor(indicators.rsiSignal) },
                        { label: "MACD",           val: indicators.macdSignal.toUpperCase(),                                                            cls: sigColor(indicators.macdSignal) },
                        { label: "Bollinger",      val: indicators.bbSignal.replace("_"," ").toUpperCase(),                                             cls: indicators.bbSignal === "near_lower" ? "text-bullish" : indicators.bbSignal === "near_upper" ? "text-bearish" : "text-muted-foreground" },
                        { label: "Stochastic %K",  val: `${indicators.currentStochK?.toFixed(1) ?? "—"} — ${indicators.stochSignal.toUpperCase()}`,    cls: sigColor(indicators.stochSignal) },
                        { label: "CCI (20)",       val: `${indicators.currentCci?.toFixed(1) ?? "—"} — ${indicators.cciSignal.toUpperCase()}`,          cls: sigColor(indicators.cciSignal) },
                        { label: "Williams %R",    val: `${indicators.currentWilliamsR?.toFixed(1) ?? "—"} — ${indicators.williamsRSignal.toUpperCase()}`, cls: sigColor(indicators.williamsRSignal) },
                        { label: "ADX (14)",       val: `${indicators.currentAdx?.toFixed(1) ?? "—"} — ${indicators.adxTrend.toUpperCase()}`,           cls: indicators.adxTrend === "bullish" ? "text-bullish" : indicators.adxTrend === "bearish" ? "text-bearish" : "text-muted-foreground" },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center text-xs gap-2">
                          <span className="text-muted-foreground font-data shrink-0">{r.label}</span>
                          <span className={cn("font-medium text-right", r.cls)}>{r.val}</span>
                        </div>
                      ))}
                      {indicators.comboSignals?.length ? (
                        <div className="pt-1.5 space-y-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-data">Strong combos</p>
                          {indicators.comboSignals.slice(0, 4).map((s: string) => (
                            <div key={s} className="text-xs rounded border border-border bg-secondary/30 px-2 py-1">{s}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : <p className="p-4 text-center text-muted-foreground text-sm">No data</p>}
              </CardContent>
            </Card>

            {/* Panel toggles */}
            <Card className="bg-card">
              <CardHeader className="py-2.5 px-3 border-b border-border">
                <CardTitle className="text-sm">Indicator Panels</CardTitle>
              </CardHeader>
              <CardContent className="p-3 grid grid-cols-2 gap-2">
                {[
                  { label: "RSI",         val: showRSI,       set: setShowRSI       },
                  { label: "MACD",        val: showMACD,      set: setShowMACD      },
                  { label: "Stochastic",  val: showStoch,     set: setShowStoch     },
                  { label: "CCI",         val: showCCI,       set: setShowCCI       },
                  { label: "Williams %R", val: showWilliamsR, set: setShowWilliamsR },
                  { label: "Volume/OBV",  val: showVolume,    set: setShowVolume    },
                  { label: "ADX",         val: showADX,       set: setShowADX       },
                ].map(o => (
                  <Button key={o.label} size="sm"
                    variant={o.val ? "default" : "outline"}
                    onClick={() => o.set(!o.val)}
                    className="h-8 text-xs"
                  >{o.label}</Button>
                ))}
              </CardContent>
            </Card>

            {/* Charts */}
            {showRSI && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground font-data">RSI (14)</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowRSI(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rsiData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" />
                        <Tooltip {...tt} formatter={(v: any) => [Number(v).toFixed(1), "RSI"]} />
                        <ReferenceLine y={70} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" strokeWidth={1} />
                        <ReferenceLine y={30} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {showMACD && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground font-data">MACD (12,26,9)</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowMACD(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={macdData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" />
                        <Tooltip {...tt} />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                        <Bar dataKey="histogram" isAnimationActive={false}
                          shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            return <rect x={x} y={payload.histogram > 0 ? y : y + height} width={width} height={Math.abs(height)}
                              fill={payload.isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} opacity={0.6} />;
                          }}
                        />
                        <Line type="monotone" dataKey="macd"   stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        <Line type="monotone" dataKey="signal" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {showStoch && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs text-muted-foreground font-data">Stochastic (14,3)</CardTitle>
                    <span className="text-[10px] text-muted-foreground flex gap-1.5">
                      <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-0.5 bg-blue-400 rounded" />%K</span>
                      <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-0.5 bg-orange-400 rounded" />%D</span>
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowStoch(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stochData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0,100]} ticks={[20,50,80]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" />
                        <Tooltip {...tt} formatter={(v: any, name) => [Number(v).toFixed(1), name === "k" ? "%K" : "%D"]} />
                        <ReferenceLine y={80} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" strokeWidth={1} />
                        <ReferenceLine y={20} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="k" stroke="#60a5fa" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        <Line type="monotone" dataKey="d" stroke="#fb923c" dot={false} strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {showCCI && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground font-data">CCI (20)</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowCCI(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cciData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" />
                        <Tooltip {...tt} formatter={(v: any) => [Number(v).toFixed(1), "CCI"]} />
                        <ReferenceLine y={100}  stroke="hsl(var(--chart-5))" strokeDasharray="3 3" strokeWidth={1} />
                        <ReferenceLine y={0}    stroke="hsl(var(--border))"  strokeWidth={1} />
                        <ReferenceLine y={-100} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="value" stroke="#a78bfa" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {showWilliamsR && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground font-data">Williams %R (14)</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowWilliamsR(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={wrData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[-100,0]} ticks={[-80,-50,-20]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" />
                        <Tooltip {...tt} formatter={(v: any) => [Number(v).toFixed(1), "%R"]} />
                        <ReferenceLine y={-20} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" strokeWidth={1} />
                        <ReferenceLine y={-80} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="value" stroke="#34d399" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {showVolume && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs text-muted-foreground font-data">Volume / OBV</CardTitle>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><span className="inline-block w-2 h-0.5 bg-yellow-400 rounded" />OBV</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowVolume(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={volumeData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis yAxisId="vol" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right"
                          tickFormatter={v => v >= 1e7 ? `${(v/1e7).toFixed(0)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(0)}L` : `${(v/1e3).toFixed(0)}K`} />
                        <YAxis yAxisId="obv" orientation="left" hide />
                        <Tooltip {...tt} formatter={(v: any, name) => {
                          if (name === "volume") return [`${(Number(v)/1e5).toFixed(1)}L`, "Vol"];
                          if (name === "obv")    return [(Number(v)/1e6).toFixed(2)+"M",   "OBV"];
                          return null;
                        }} />
                        <Bar yAxisId="vol" dataKey="volume" isAnimationActive={false}
                          shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            return <rect x={x} y={y} width={width} height={Math.max(1, height)}
                              fill={payload.isBullish ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} opacity={0.5} />;
                          }}
                        />
                        <Line yAxisId="obv" type="monotone" dataKey="obv" stroke="#facc15" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {showADX && (
              <Card className="bg-card">
                <CardHeader className="py-2 px-3 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs text-muted-foreground font-data">ADX (14)</CardTitle>
                    <span className="text-[10px] text-muted-foreground flex gap-1.5">
                      <span className="flex items-center gap-0.5"><span className="w-2 h-0.5 bg-white inline-block rounded" />ADX</span>
                      <span className="flex items-center gap-0.5"><span className="w-2 h-0.5 bg-green-400 inline-block rounded" />+DI</span>
                      <span className="flex items-center gap-0.5"><span className="w-2 h-0.5 bg-red-400 inline-block rounded" />−DI</span>
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowADX(false)}><X className="w-3.5 h-3.5" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                  <MiniChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adxData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0,60]} ticks={[0,25,50]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} orientation="right" />
                        <Tooltip {...tt} formatter={(v: any, n) => [Number(v).toFixed(1), n === "adx" ? "ADX" : n === "plusDI" ? "+DI" : "−DI"]} />
                        <ReferenceLine y={25} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="adx"     stroke="hsl(var(--foreground))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        <Line type="monotone" dataKey="plusDI"  stroke="#4ade80" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        <Line type="monotone" dataKey="minusDI" stroke="#f87171" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </MiniChart>
                </CardContent>
              </Card>
            )}

            {!showRSI && !showMACD && !showStoch && !showCCI && !showWilliamsR && !showVolume && !showADX && (
              <p className="text-center text-muted-foreground text-sm py-6">Enable panels above to view indicator charts.</p>
            )}
          </div>
        )}

        {/* ── PREDICTIONS TAB ── */}
        {tab === "predictions" && (
          <div className="flex flex-col gap-3">
            {/* Horizon picker */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {HORIZONS.map(h => (
                <button key={h.key} onClick={() => setHorizon(h.key)}
                  className={cn("py-2 text-xs font-semibold rounded-lg transition-colors",
                    horizon === h.key ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >{h.label}</button>
              ))}
            </div>

            {pl ? (
              <div className="space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>
            ) : selPred ? (
              <>
                {/* Target card */}
                <Card className="bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Target · {selPred.label}</span>
                      <span className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                        selPred.direction === "bullish" ? "bg-bullish/15 text-bullish" :
                        selPred.direction === "bearish" ? "bg-bearish/15 text-bearish" : "bg-secondary text-muted-foreground"
                      )}>
                        {selPred.direction === "bullish" ? <TrendingUp className="w-3 h-3" /> : selPred.direction === "bearish" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {selPred.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-3xl font-bold font-data">{fmt(selPred.targetPrice, currency)}</div>
                    <div className={cn("text-sm font-data font-semibold", selPred.upside >= 0 ? "text-bullish" : "text-bearish")}>
                      {selPred.upside >= 0 ? "+" : ""}{selPred.upside.toFixed(1)}% expected upside
                    </div>
                    <div className="text-xs text-muted-foreground">Range: {fmt(selPred.confidenceLow, currency)} — {fmt(selPred.confidenceHigh, currency)}</div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-data font-semibold">{selPred.confidenceScore}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", selPred.confidenceScore >= 70 ? "bg-bullish" : selPred.confidenceScore >= 55 ? "bg-amber-500" : "bg-bearish")}
                          style={{ width: `${selPred.confidenceScore}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Forecast chart */}
                <Card className="bg-card">
                  <CardHeader className="py-2 px-3 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-data">PRICE FORECAST</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={selPred.forecast} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.substring(5)} interval="preserveStartEnd" />
                        <YAxis domain={["auto","auto"]} orientation="right" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))"
                          tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                        <Tooltip {...tt} formatter={(v: any) => [fmt(Number(v), currency), ""]} />
                        <Area type="monotone" dataKey="high" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} isAnimationActive={false} />
                        <Area type="monotone" dataKey="low"  stroke="none" fill="hsl(var(--background))" fillOpacity={1} isAnimationActive={false} />
                        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Support / Resistance */}
                <Card className="bg-card">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Support</span>
                      <span className="font-data text-bullish font-semibold">{fmt(selPred.supportLevel, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resistance</span>
                      <span className="font-data text-bearish font-semibold">{fmt(selPred.resistanceLevel, currency)}</span>
                    </div>
                    <p className="border-t border-border pt-2 text-xs text-muted-foreground leading-relaxed">{selPred.methodology}</p>
                  </CardContent>
                </Card>

                {/* All horizons table */}
                <Card className="bg-card">
                  <CardHeader className="py-2 px-3 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-data">ALL HORIZONS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {predictions?.predictions.map(p => (
                        <button key={p.horizon} onClick={() => setHorizon(p.horizon as Horizon)}
                          className={cn("w-full flex justify-between items-center px-3 py-2.5 text-xs transition-colors hover:bg-secondary/30",
                            horizon === p.horizon && "bg-secondary/50"
                          )}
                        >
                          <span className="text-muted-foreground font-data">{p.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-data">{fmt(p.targetPrice, currency)}</span>
                            <span className={cn("font-semibold w-14 text-right", p.upside >= 0 ? "text-bullish" : "text-bearish")}>
                              {p.upside >= 0 ? "+" : ""}{p.upside.toFixed(1)}%
                            </span>
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

        {/* ── FUNDAMENTALS TAB ── */}
        {tab === "fundamentals" && (
          <div className="flex flex-col gap-3">
            {fl ? (
              <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-44 w-full" /></div>
            ) : fundamentals ? (
              <>
                {/* Score */}
                <Card className="bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Fundamental Score</span>
                      <span className={cn("text-lg font-bold font-data",
                        fundamentals.fundamentalScore >= 65 ? "text-bullish" : fundamentals.fundamentalScore >= 45 ? "text-amber-400" : "text-bearish"
                      )}>{fundamentals.fundamentalScore}/100</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full",
                        fundamentals.fundamentalScore >= 65 ? "bg-bullish" : fundamentals.fundamentalScore >= 45 ? "bg-amber-500" : "bg-bearish"
                      )} style={{ width: `${fundamentals.fundamentalScore}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Valuation</span>
                      <span className={cn("font-semibold uppercase",
                        fundamentals.valuationVerdict === "undervalued" ? "text-bullish" :
                        fundamentals.valuationVerdict === "overvalued" ? "text-bearish" : "text-amber-400"
                      )}>{fundamentals.valuationVerdict.replace("_", " ")}</span>
                    </div>
                  </CardContent>
                </Card>

                {fundamentals.description && (
                  <Card className="bg-card">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">{fundamentals.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Key metrics */}
                <Card className="bg-card">
                  <CardHeader className="py-2 px-3 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-data">KEY METRICS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {[
                        { label: "Market Cap", val: fmtLarge(fundamentals.marketCap, fundamentals.currency) },
                        { label: "P/E Ratio",  val: fundamentals.pe   ? fundamentals.pe.toFixed(1)  : "N/A" },
                        { label: "P/B Ratio",  val: fundamentals.pb   ? fundamentals.pb.toFixed(2)  : "N/A" },
                        { label: "EPS",        val: fundamentals.eps  ? fmt(fundamentals.eps, fundamentals.currency) : "N/A" },
                        { label: "ROE",        val: fundamentals.roe  ? `${fundamentals.roe.toFixed(1)}%` : "N/A" },
                        { label: "D/E Ratio",  val: fundamentals.debtToEquity ? fundamentals.debtToEquity.toFixed(2) : "N/A" },
                        { label: "Div Yield",  val: fundamentals.dividendYield ? `${fundamentals.dividendYield.toFixed(2)}%` : "N/A" },
                        { label: "Book Value", val: fundamentals.bookValue ? fmt(fundamentals.bookValue, fundamentals.currency) : "N/A" },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center px-3 py-2.5 text-xs">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-data font-semibold">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Financials */}
                <Card className="bg-card">
                  <CardHeader className="py-2 px-3 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-data">FINANCIALS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {[
                        { label: "Revenue",    val: fmtLarge(fundamentals.revenueB,    fundamentals.currency) },
                        { label: "Net Profit", val: fmtLarge(fundamentals.netProfitB,  fundamentals.currency) },
                        { label: "52W High",   val: fmt(fundamentals.week52High,        fundamentals.currency) },
                        { label: "52W Low",    val: fmt(fundamentals.week52Low,         fundamentals.currency) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center px-3 py-2.5 text-xs">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-data font-semibold">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shareholding */}
                {fundamentals.promoterHolding != null && (
                  <Card className="bg-card">
                    <CardHeader className="py-2 px-3 border-b border-border">
                      <CardTitle className="text-xs text-muted-foreground font-data">SHAREHOLDING</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      {[
                        { label: "Promoter", val: fundamentals.promoterHolding, color: "bg-primary" },
                        { label: "FII",      val: fundamentals.fiiHolding,       color: "bg-chart-3" },
                        { label: "DII",      val: fundamentals.diiHolding,       color: "bg-chart-4" },
                      ].map(r => r.val != null && (
                        <div key={r.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="font-data font-semibold">{r.val.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No fundamental data available</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
