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
import { Activity, TrendingUp, TrendingDown, Minus, Building2, BarChart3 } from "lucide-react";

type SidebarTab = "technical" | "predictions" | "fundamentals";
type Horizon = "1d" | "1w" | "1mo" | "3mo" | "6mo" | "12mo";

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "12mo", label: "1Y" },
];

function formatPrice(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  if (currency === "INR" && price >= 100000) return `${sym}${(price / 100000).toFixed(2)}L`;
  return `${sym}${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeNum(n: number | null, currency: string): string {
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

export default function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [period, setPeriod] = useState<"1mo" | "3mo" | "6mo" | "1y">("3mo");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("technical");
  const [horizon, setHorizon] = useState<Horizon>("1mo");

  // Overlay indicator toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showEMA12, setShowEMA12] = useState(false);
  const [showEMA26, setShowEMA26] = useState(false);
  const [showBB, setShowBB] = useState(false);

  // Panel toggles
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  const { data: quote, isLoading: isQuoteLoading } = useGetStockQuote(symbol, {
    query: { enabled: !!symbol, queryKey: getGetStockQuoteQueryKey(symbol) }
  });

  const { data: history, isLoading: isHistoryLoading } = useGetStockHistory(symbol, { period }, {
    query: { enabled: !!symbol, queryKey: getGetStockHistoryQueryKey(symbol, { period }) }
  });

  const { data: indicators, isLoading: isIndicatorsLoading } = useGetStockIndicators(symbol, { period }, {
    query: { enabled: !!symbol, queryKey: getGetStockIndicatorsQueryKey(symbol, { period }) }
  });

  const { data: predictionsData, isLoading: isPredictionsLoading } = useGetStockPredictions(symbol, {
    query: { enabled: !!symbol && sidebarTab === "predictions", queryKey: getGetStockPredictionsQueryKey(symbol) }
  });

  const { data: fundamentals, isLoading: isFundamentalsLoading } = useGetStockFundamentals(symbol, {
    query: { enabled: !!symbol && sidebarTab === "fundamentals", queryKey: getGetStockFundamentalsQueryKey(symbol) }
  });

  const currency = quote?.currency ?? "USD";

  const chartData = useMemo(() => {
    if (!history?.candles || !indicators) return [];
    return history.candles.map((candle, i) => {
      const isBullish = candle.close >= candle.open;
      return {
        date: candle.date.split("T")[0],
        open: candle.open, high: candle.high, low: candle.low, close: candle.close,
        volume: candle.volume, isBullish,
        candleRange: [Math.min(candle.open, candle.close), Math.max(candle.open, candle.close)],
        wickRange: [candle.low, candle.high],
        sma20: indicators.sma20[i]?.value,
        sma50: indicators.sma50[i]?.value,
        ema12: indicators.ema12[i]?.value,
        ema26: indicators.ema26[i]?.value,
        bbUpper: indicators.bollingerBands[i]?.upper,
        bbLower: indicators.bollingerBands[i]?.lower,
        bbRange: [indicators.bollingerBands[i]?.lower, indicators.bollingerBands[i]?.upper],
      };
    });
  }, [history, indicators]);

  const rsiData = useMemo(() => {
    if (!indicators?.rsi) return [];
    return indicators.rsi.map(p => ({ date: p.date.split("T")[0], value: p.value }));
  }, [indicators]);

  const macdData = useMemo(() => {
    if (!indicators?.macd) return [];
    return indicators.macd.map(p => ({
      date: p.date.split("T")[0], macd: p.macd, signal: p.signal, histogram: p.histogram,
      isPositive: (p.histogram || 0) > 0
    }));
  }, [indicators]);

  const selectedPrediction = useMemo(() => {
    return predictionsData?.predictions.find(p => p.horizon === horizon);
  }, [predictionsData, horizon]);

  const tooltipStyle = {
    contentStyle: { backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" },
    itemStyle: { color: "hsl(var(--foreground))" },
  };

  return (
    <div className="h-full flex flex-col gap-3 max-w-7xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
        <div>
          {isQuoteLoading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-60" /></div>
          ) : quote ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{quote.symbol}</h1>
                </div>
                <span className="text-xl md:text-2xl font-data">{formatPrice(quote.price, currency)}</span>
                <span className={cn("font-data text-base md:text-lg", quote.changePercent > 0 ? "text-bullish" : "text-bearish")}>
                  {quote.changePercent > 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm flex flex-wrap gap-2 md:gap-4 mt-1">
                <span>{quote.name}</span>
                <span className="text-border hidden sm:inline">|</span>
                <span className="hidden sm:inline">Exchange: {quote.exchange}</span>
                <span className="text-border hidden sm:inline">|</span>
                <span className="hidden sm:inline">Vol: {(quote.volume / 1000000).toFixed(2)}M</span>
              </p>
            </>
          ) : (
            <div className="text-destructive">Symbol not found</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-secondary/50 rounded-md p-1 flex">
            {["1mo", "3mo", "6mo", "1y"].map(p => (
              <button key={p} onClick={() => setPeriod(p as any)}
                className={cn("px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-sm transition-colors",
                  period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-auto min-h-[400px]">
          {/* Price Chart */}
          <Card className="flex-1 bg-card min-h-[300px] md:min-h-[380px] flex flex-col">
            <CardHeader className="py-2.5 px-3 md:px-4 flex flex-row items-center justify-between border-b border-border shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-medium">Price Action</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  <IndicatorToggle label="SMA20" active={showSMA20} onClick={() => setShowSMA20(!showSMA20)} color="hsl(var(--chart-3))" />
                  <IndicatorToggle label="SMA50" active={showSMA50} onClick={() => setShowSMA50(!showSMA50)} color="hsl(var(--chart-4))" />
                  <IndicatorToggle label="EMA12" active={showEMA12} onClick={() => setShowEMA12(!showEMA12)} color="hsl(var(--accent))" />
                  <IndicatorToggle label="EMA26" active={showEMA26} onClick={() => setShowEMA26(!showEMA26)} color="#f59e0b" />
                  <IndicatorToggle label="BB" active={showBB} onClick={() => setShowBB(!showBB)} color="hsl(var(--muted-foreground))" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              {(isHistoryLoading || isIndicatorsLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <Activity className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} tickFormatter={(v) => v.substring(5)} />
                  <YAxis domain={["auto", "auto"]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} orientation="right"
                    tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                  <Tooltip {...tooltipStyle}
                    formatter={(v: any, name: string) => {
                      if (name === "wickRange" || name === "candleRange" || name === "bbRange") return null;
                      return [formatPrice(Number(v), currency), name];
                    }}
                  />
                  {showBB && <Area type="monotone" dataKey="bbRange" stroke="none" fill="hsl(var(--muted))" fillOpacity={0.15} isAnimationActive={false} />}
                  <Bar dataKey="wickRange" barSize={1} fill="hsl(var(--muted-foreground))" isAnimationActive={false} />
                  <Bar dataKey="candleRange" barSize={8} fill="hsl(var(--muted-foreground))" isAnimationActive={false}
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      return <rect x={x} y={y} width={width} height={Math.max(1, height)}
                        fill={payload.isBullish ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} />;
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

          {/* RSI Panel */}
          {showRSI && (
            <Card className="bg-card h-36 flex flex-col shrink-0">
              <CardHeader className="py-2 px-3 md:px-4 border-b border-border shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground font-data">RSI (14)</CardTitle>
                <Button variant="ghost" size="sm" className="h-5 text-xs text-muted-foreground px-2" onClick={() => setShowRSI(false)}>Hide</Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rsiData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} orientation="right" />
                    <Tooltip {...tooltipStyle} />
                    <ReferenceLine y={70} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine y={30} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" strokeWidth={1} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* MACD Panel */}
          {showMACD && (
            <Card className="bg-card h-44 flex flex-col shrink-0">
              <CardHeader className="py-2 px-3 md:px-4 border-b border-border shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground font-data">MACD (12, 26, 9)</CardTitle>
                <Button variant="ghost" size="sm" className="h-5 text-xs text-muted-foreground px-2" onClick={() => setShowMACD(false)}>Hide</Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={macdData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} orientation="right" />
                    <Tooltip {...tooltipStyle} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                    <Bar dataKey="histogram" isAnimationActive={false}
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        return <rect x={x} y={payload.histogram > 0 ? y : y + height} width={width} height={Math.abs(height)}
                          fill={payload.isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} opacity={0.6} />;
                      }}
                    />
                    <Line type="monotone" dataKey="macd" stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                    <Line type="monotone" dataKey="signal" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 overflow-y-auto pb-4">
          {/* Tab Switcher */}
          <div className="bg-secondary/50 rounded-md p-1 flex shrink-0">
            {([
              { key: "technical", icon: BarChart3, label: "Technical" },
              { key: "predictions", icon: TrendingUp, label: "Predict" },
              { key: "fundamentals", icon: Building2, label: "Fundas" },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setSidebarTab(tab.key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs rounded-sm transition-colors",
                  sidebarTab === tab.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Technical Tab ── */}
          {sidebarTab === "technical" && (
            <>
              <Card className="bg-card">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm">Signal Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isIndicatorsLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-8 w-full" /><Skeleton className="h-20 w-full" />
                    </div>
                  ) : indicators ? (
                    <div className="divide-y divide-border">
                      <div className="p-3 flex items-center justify-between">
                        <span className="font-medium text-sm">Overall</span>
                        <SignalBadge signal={indicators.overallSignal} />
                      </div>
                      <div className="p-3 space-y-2.5">
                        {[
                          { label: "RSI (14)", value: `${indicators.currentRsi?.toFixed(1)} — ${indicators.rsiSignal.toUpperCase()}`,
                            cls: indicators.rsiSignal === "oversold" ? "text-bullish" : indicators.rsiSignal === "overbought" ? "text-bearish" : "text-muted-foreground" },
                          { label: "MACD", value: indicators.macdSignal.toUpperCase(),
                            cls: indicators.macdSignal === "bullish" ? "text-bullish" : indicators.macdSignal === "bearish" ? "text-bearish" : "text-muted-foreground" },
                          { label: "Bollinger", value: indicators.bbSignal.replace("_", " ").toUpperCase(),
                            cls: indicators.bbSignal === "near_lower" ? "text-bullish" : indicators.bbSignal === "near_upper" ? "text-bearish" : "text-muted-foreground" },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-data">{row.label}</span>
                            <span className={cn("font-medium", row.cls)}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="p-4 text-center text-muted-foreground text-sm">No data</div>}
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm">Indicators</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5 font-data">OVERLAYS</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "SMA 20", active: showSMA20, toggle: () => setShowSMA20(!showSMA20), color: "hsl(var(--chart-3))" },
                        { label: "SMA 50", active: showSMA50, toggle: () => setShowSMA50(!showSMA50), color: "hsl(var(--chart-4))" },
                        { label: "EMA 12", active: showEMA12, toggle: () => setShowEMA12(!showEMA12), color: "hsl(var(--accent))" },
                        { label: "EMA 26", active: showEMA26, toggle: () => setShowEMA26(!showEMA26), color: "#f59e0b" },
                        { label: "Boll. Bands", active: showBB, toggle: () => setShowBB(!showBB), color: "hsl(var(--muted-foreground))" },
                      ].map(ind => (
                        <button key={ind.label} onClick={ind.toggle}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors border",
                            ind.active ? "bg-secondary border-border text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/30"
                          )}
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ind.active ? ind.color : "transparent", border: `1.5px solid ${ind.color}` }} />
                          {ind.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5 font-data mt-2">PANELS</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button variant={showRSI ? "default" : "outline"} size="sm" onClick={() => setShowRSI(!showRSI)} className="h-7 text-xs">RSI</Button>
                      <Button variant={showMACD ? "default" : "outline"} size="sm" onClick={() => setShowMACD(!showMACD)} className="h-7 text-xs">MACD</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick stats */}
              {quote && (
                <Card className="bg-card">
                  <CardContent className="p-3 space-y-2">
                    {[
                      { label: "52W High", value: formatPrice(quote.week52High, currency) },
                      { label: "52W Low", value: formatPrice(quote.week52Low, currency) },
                      { label: "P/E Ratio", value: quote.pe ? quote.pe.toFixed(1) : "N/A" },
                      { label: "Volume", value: `${(quote.volume / 1000000).toFixed(2)}M` },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-data font-medium">{row.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ── Predictions Tab ── */}
          {sidebarTab === "predictions" && (
            <>
              {/* Horizon Selector */}
              <div className="shrink-0">
                <div className="text-xs text-muted-foreground mb-1.5 font-data px-1">SELECT HORIZON</div>
                <div className="grid grid-cols-3 gap-1">
                  {HORIZONS.map(h => (
                    <button key={h.key} onClick={() => setHorizon(h.key)}
                      className={cn(
                        "py-1.5 text-xs font-medium rounded transition-colors",
                        horizon === h.key ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {isPredictionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : selectedPrediction ? (
                <>
                  {/* Target card */}
                  <Card className="bg-card">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Target ({selectedPrediction.label})</div>
                        <span className={cn(
                          "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded",
                          selectedPrediction.direction === "bullish" ? "bg-bullish/20 text-bullish" :
                          selectedPrediction.direction === "bearish" ? "bg-bearish/20 text-bearish" : "bg-secondary text-muted-foreground"
                        )}>
                          {selectedPrediction.direction === "bullish" ? <TrendingUp className="w-3 h-3" /> :
                           selectedPrediction.direction === "bearish" ? <TrendingDown className="w-3 h-3" /> :
                           <Minus className="w-3 h-3" />}
                          {selectedPrediction.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xl font-bold font-data">
                        {formatPrice(selectedPrediction.targetPrice, currency)}
                      </div>
                      <div className={cn("text-sm font-data font-medium", selectedPrediction.upside >= 0 ? "text-bullish" : "text-bearish")}>
                        {selectedPrediction.upside >= 0 ? "+" : ""}{selectedPrediction.upside.toFixed(1)}% upside
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Range: {formatPrice(selectedPrediction.confidenceLow, currency)} — {formatPrice(selectedPrediction.confidenceHigh, currency)}
                      </div>

                      {/* Confidence bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="font-data font-medium">{selectedPrediction.confidenceScore}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", selectedPrediction.confidenceScore >= 70 ? "bg-bullish" : selectedPrediction.confidenceScore >= 55 ? "bg-amber-500" : "bg-bearish")}
                            style={{ width: `${selectedPrediction.confidenceScore}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forecast chart */}
                  <Card className="bg-card">
                    <CardHeader className="py-2 px-3 border-b border-border shrink-0">
                      <CardTitle className="text-xs text-muted-foreground font-data">PRICE FORECAST</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0" style={{ height: "180px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={selectedPrediction.forecast} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))"
                            tickFormatter={v => v.substring(5)} interval="preserveStartEnd" />
                          <YAxis domain={["auto", "auto"]} orientation="right" tick={{ fontSize: 9 }}
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={v => currency === "INR" ? `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v.toFixed(0)}` : `$${v.toFixed(0)}`} />
                          <Tooltip {...tooltipStyle} formatter={(v: any) => [formatPrice(Number(v), currency), ""]} />
                          <Area type="monotone" dataKey="high" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} isAnimationActive={false} />
                          <Area type="monotone" dataKey="low" stroke="none" fill="hsl(var(--background))" fillOpacity={1} isAnimationActive={false} />
                          <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} isAnimationActive={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Support/Resistance + Methodology */}
                  <Card className="bg-card">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Support</span>
                        <span className="font-data text-bullish">{formatPrice(selectedPrediction.supportLevel, currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Resistance</span>
                        <span className="font-data text-bearish">{formatPrice(selectedPrediction.resistanceLevel, currency)}</span>
                      </div>
                      <div className="border-t border-border pt-2 text-xs text-muted-foreground leading-relaxed">
                        {selectedPrediction.methodology}
                      </div>
                    </CardContent>
                  </Card>

                  {/* All horizons summary */}
                  <Card className="bg-card">
                    <CardHeader className="py-2 px-3 border-b border-border shrink-0">
                      <CardTitle className="text-xs text-muted-foreground font-data">ALL HORIZONS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {predictionsData?.predictions.map(p => (
                          <button key={p.horizon} onClick={() => setHorizon(p.horizon as Horizon)}
                            className={cn("w-full flex justify-between items-center px-3 py-2 text-xs transition-colors hover:bg-secondary/30",
                              horizon === p.horizon && "bg-secondary/50"
                            )}
                          >
                            <span className="text-muted-foreground font-data">{p.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-data">{formatPrice(p.targetPrice, currency)}</span>
                              <span className={cn("font-medium", p.upside >= 0 ? "text-bullish" : "text-bearish")}>
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
                <div className="text-center text-muted-foreground text-sm p-4">No prediction data</div>
              )}
            </>
          )}

          {/* ── Fundamentals Tab ── */}
          {sidebarTab === "fundamentals" && (
            <>
              {isFundamentalsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : fundamentals ? (
                <>
                  {/* Valuation verdict */}
                  <Card className="bg-card">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Fundamental Score</span>
                        <span className={cn("text-sm font-bold font-data",
                          fundamentals.fundamentalScore >= 65 ? "text-bullish" :
                          fundamentals.fundamentalScore >= 45 ? "text-amber-400" : "text-bearish"
                        )}>{fundamentals.fundamentalScore}/100</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          fundamentals.fundamentalScore >= 65 ? "bg-bullish" :
                          fundamentals.fundamentalScore >= 45 ? "bg-amber-500" : "bg-bearish"
                        )} style={{ width: `${fundamentals.fundamentalScore}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Valuation</span>
                        <span className={cn("font-medium uppercase",
                          fundamentals.valuationVerdict === "undervalued" ? "text-bullish" :
                          fundamentals.valuationVerdict === "overvalued" ? "text-bearish" : "text-amber-400"
                        )}>{fundamentals.valuationVerdict.replace("_", " ")}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Description */}
                  {fundamentals.description && (
                    <Card className="bg-card">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">{fundamentals.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key metrics */}
                  <Card className="bg-card">
                    <CardHeader className="py-2 px-3 border-b border-border shrink-0">
                      <CardTitle className="text-xs text-muted-foreground font-data">KEY METRICS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {[
                          { label: "Market Cap", value: formatLargeNum(fundamentals.marketCap, fundamentals.currency) },
                          { label: "P/E Ratio", value: fundamentals.pe ? fundamentals.pe.toFixed(1) : "N/A" },
                          { label: "P/B Ratio", value: fundamentals.pb ? fundamentals.pb.toFixed(2) : "N/A" },
                          { label: "EPS", value: fundamentals.eps ? formatPrice(fundamentals.eps, fundamentals.currency) : "N/A" },
                          { label: "ROE", value: fundamentals.roe ? `${fundamentals.roe.toFixed(1)}%` : "N/A" },
                          { label: "D/E Ratio", value: fundamentals.debtToEquity ? fundamentals.debtToEquity.toFixed(2) : "N/A" },
                          { label: "Div Yield", value: fundamentals.dividendYield ? `${fundamentals.dividendYield.toFixed(2)}%` : "N/A" },
                          { label: "Book Value", value: fundamentals.bookValue ? formatPrice(fundamentals.bookValue, fundamentals.currency) : "N/A" },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between items-center px-3 py-2 text-xs">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className="font-data font-medium">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financials */}
                  <Card className="bg-card">
                    <CardHeader className="py-2 px-3 border-b border-border shrink-0">
                      <CardTitle className="text-xs text-muted-foreground font-data">FINANCIALS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {[
                          { label: "Revenue", value: formatLargeNum(fundamentals.revenueB, fundamentals.currency) },
                          { label: "Net Profit", value: formatLargeNum(fundamentals.netProfitB, fundamentals.currency) },
                          { label: "52W High", value: formatPrice(fundamentals.week52High, fundamentals.currency) },
                          { label: "52W Low", value: formatPrice(fundamentals.week52Low, fundamentals.currency) },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between items-center px-3 py-2 text-xs">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className="font-data font-medium">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shareholding (Indian stocks) */}
                  {fundamentals.promoterHolding != null && (
                    <Card className="bg-card">
                      <CardHeader className="py-2 px-3 border-b border-border shrink-0">
                        <CardTitle className="text-xs text-muted-foreground font-data">SHAREHOLDING</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2.5">
                        {[
                          { label: "Promoter", value: fundamentals.promoterHolding, color: "bg-primary" },
                          { label: "FII", value: fundamentals.fiiHolding, color: "bg-chart-3" },
                          { label: "DII", value: fundamentals.diiHolding, color: "bg-chart-4" },
                        ].map(row => (
                          row.value != null && (
                            <div key={row.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{row.label}</span>
                                <span className="font-data">{row.value.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.value}%` }} />
                              </div>
                            </div>
                          )
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground text-sm p-4">No fundamental data</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IndicatorToggle({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick}
      className={cn(
        "text-xs px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5",
        active ? "bg-secondary text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/50"
      )}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : "transparent", border: `1px solid ${color}` }} />
      {label}
    </button>
  );
}
