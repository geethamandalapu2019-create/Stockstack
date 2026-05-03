import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { 
  useGetStockHistory, 
  useGetStockIndicators, 
  useGetStockQuote,
  getGetStockHistoryQueryKey,
  getGetStockIndicatorsQueryKey,
  getGetStockQuoteQueryKey
} from "@workspace/api-client-react";
import { ComposedChart, AreaChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SignalBadge } from "./dashboard";
import { Activity, AlertCircle, Info, Settings2 } from "lucide-react";

export default function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [period, setPeriod] = useState<"1mo" | "3mo" | "6mo" | "1y">("3mo");
  
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBB, setShowBB] = useState(false);
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

  // Merge history and indicators for the main chart
  const chartData = useMemo(() => {
    if (!history?.candles || !indicators) return [];
    
    return history.candles.map((candle, i) => {
      const isBullish = candle.close >= candle.open;
      const sma20 = indicators.sma20[i]?.value;
      const sma50 = indicators.sma50[i]?.value;
      const bbUpper = indicators.bollingerBands[i]?.upper;
      const bbLower = indicators.bollingerBands[i]?.lower;
      
      return {
        date: candle.date.split("T")[0],
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        isBullish,
        // Area chart needs a range array [min, max]
        candleRange: [Math.min(candle.open, candle.close), Math.max(candle.open, candle.close)],
        wickRange: [candle.low, candle.high],
        sma20,
        sma50,
        bbUpper,
        bbLower,
        bbRange: [bbLower, bbUpper]
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
      date: p.date.split("T")[0], 
      macd: p.macd, 
      signal: p.signal, 
      histogram: p.histogram,
      isPositive: (p.histogram || 0) > 0
    }));
  }, [indicators]);

  return (
    <div className="h-full flex flex-col gap-4 max-w-7xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          {isQuoteLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          ) : quote ? (
            <>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{quote.symbol}</h1>
                <span className="text-2xl font-data">${quote.price.toFixed(2)}</span>
                <span className={cn(
                  "font-data text-lg",
                  quote.changePercent > 0 ? "text-bullish" : "text-bearish"
                )}>
                  {quote.changePercent > 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-muted-foreground text-sm flex gap-4 mt-1">
                <span>{quote.name}</span>
                <span className="text-border">|</span>
                <span>Vol: {(quote.volume / 1000000).toFixed(2)}M</span>
              </p>
            </>
          ) : (
            <div className="text-destructive">Symbol not found</div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-secondary/50 rounded-md p-1 flex">
            {["1mo", "3mo", "6mo", "1y"].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-sm transition-colors",
                  period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-auto">
          {/* Price Chart */}
          <Card className="flex-1 bg-card min-h-[400px] flex flex-col">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-4">
                <CardTitle className="text-sm font-medium">Price Action</CardTitle>
                <div className="flex gap-2">
                  <IndicatorToggle label="SMA20" active={showSMA20} onClick={() => setShowSMA20(!showSMA20)} color="var(--chart-3)" />
                  <IndicatorToggle label="SMA50" active={showSMA50} onClick={() => setShowSMA50(!showSMA50)} color="var(--chart-4)" />
                  <IndicatorToggle label="BB" active={showBB} onClick={() => setShowBB(!showBB)} color="var(--muted-foreground)" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              {isHistoryLoading || isIndicatorsLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <Activity className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : null}
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} tickFormatter={(val) => val.substring(5)} />
                  <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} orientation="right" tickFormatter={val => val.toFixed(2)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  
                  {/* Bollinger Bands Fill */}
                  {showBB && (
                    <Area type="monotone" dataKey="bbRange" stroke="none" fill="hsl(var(--muted))" fillOpacity={0.2} isAnimationActive={false} />
                  )}
                  
                  {/* Candlesticks - Hacky approach using Area/Bar but good enough for presentation */}
                  {/* Wicks */}
                  <Bar dataKey="wickRange" barSize={2} fill="hsl(var(--muted-foreground))" isAnimationActive={false} />
                  {/* Bodies (we'd ideally need a custom shape to color by bullish/bearish, using a single color for simplicity if custom shape is complex) */}
                  <Bar 
                    dataKey="candleRange" 
                    barSize={10} 
                    fill="hsl(var(--muted-foreground))" 
                    isAnimationActive={false}
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      const fill = payload.isBullish ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-5))';
                      return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                    }}
                  />

                  {/* Indicators */}
                  {showSMA20 && <Line type="monotone" dataKey="sma20" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
                  {showSMA50 && <Line type="monotone" dataKey="sma50" stroke="hsl(var(--chart-4))" dot={false} strokeWidth={1.5} isAnimationActive={false} />}
                  {showBB && <Line type="monotone" dataKey="bbUpper" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" dot={false} strokeWidth={1} isAnimationActive={false} />}
                  {showBB && <Line type="monotone" dataKey="bbLower" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" dot={false} strokeWidth={1} isAnimationActive={false} />}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Oscillators */}
          {showRSI && (
            <Card className="bg-card h-40 flex flex-col shrink-0">
              <CardHeader className="py-2 px-4 border-b border-border shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground font-data">RSI (14)</CardTitle>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setShowRSI(false)}>
                  <Settings2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rsiData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="hsl(var(--muted-foreground))" tick={{fontSize: 10}} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                    {/* Oversold/Overbought lines */}
                    <Line type="monotone" dataKey={() => 70} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" dot={false} strokeWidth={1} isAnimationActive={false} />
                    <Line type="monotone" dataKey={() => 30} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" dot={false} strokeWidth={1} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showMACD && (
            <Card className="bg-card h-48 flex flex-col shrink-0">
              <CardHeader className="py-2 px-4 border-b border-border shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground font-data">MACD (12, 26, 9)</CardTitle>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setShowMACD(false)}>
                  <Settings2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={macdData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 10}} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar 
                      dataKey="histogram" 
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        const fill = payload.isPositive ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-5))';
                        // Adjust for negative y-axis values where rect needs to be drawn downwards
                        return <rect x={x} y={payload.histogram > 0 ? y : y + height} width={width} height={Math.abs(height)} fill={fill} opacity={0.5} />;
                      }}
                      isAnimationActive={false}
                    />
                    <Line type="monotone" dataKey="macd" stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                    <Line type="monotone" dataKey="signal" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Signals Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto pb-4">
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg">Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isIndicatorsLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : indicators ? (
                <div className="divide-y divide-border">
                  <div className="p-4 flex items-center justify-between">
                    <span className="font-medium">System Signal</span>
                    <SignalBadge signal={indicators.overallSignal} />
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-data">RSI (14)</span>
                      <span className={cn(
                        "font-medium",
                        indicators.rsiSignal === 'oversold' ? "text-bullish" : 
                        indicators.rsiSignal === 'overbought' ? "text-bearish" : "text-muted-foreground"
                      )}>
                        {indicators.currentRsi?.toFixed(2)} ({indicators.rsiSignal.toUpperCase()})
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-data">MACD</span>
                      <span className={cn(
                        "font-medium",
                        indicators.macdSignal === 'bullish' ? "text-bullish" : 
                        indicators.macdSignal === 'bearish' ? "text-bearish" : "text-muted-foreground"
                      )}>
                        {indicators.macdSignal.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-data">Bollinger</span>
                      <span className={cn(
                        "font-medium",
                        indicators.bbSignal === 'near_lower' ? "text-bullish" : 
                        indicators.bbSignal === 'near_upper' ? "text-bearish" : "text-muted-foreground"
                      )}>
                        {indicators.bbSignal.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">No analysis available</div>
              )}
            </CardContent>
          </Card>

          {/* Oscillators toggles for smaller screens where they aren't on top */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm">Panels</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-wrap gap-2">
               <Button 
                variant={showRSI ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowRSI(!showRSI)}
                className="flex-1"
               >
                 RSI
               </Button>
               <Button 
                variant={showMACD ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowMACD(!showMACD)}
                className="flex-1"
               >
                 MACD
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IndicatorToggle({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-xs px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5",
        active ? "bg-secondary text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/50"
      )}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : 'transparent', border: `1px solid ${color}` }} />
      {label}
    </button>
  );
}
