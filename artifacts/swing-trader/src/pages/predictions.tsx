import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAddToWatchlist } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Sparkles, Search, X, TrendingUp, TrendingDown, Minus,
  RefreshCw, BarChart2, CalendarDays, Trophy, Plus, Check
} from "lucide-react";

const HORIZONS = [
  { key: "1d", label: "1 Day" },
  { key: "1w", label: "1 Week" },
  { key: "2w", label: "2 Weeks" },
  { key: "1mo", label: "1 Month" },
];

const INDICATORS = [
  { key: "app", label: "App Suggested" },
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
  { key: "sma", label: "SMA" },
  { key: "ema", label: "EMA" },
  { key: "bb", label: "Bollinger Bands" },
] as const;

type IndicatorKey = typeof INDICATORS[number]["key"];
type TopPredictionResponse = {
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
    predictions: Record<string, {
      targetPrice: number;
      changeAmount: number;
      direction: string;
      confidence: number;
      label: string;
    }>;
  }>;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function formatPrice(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatUpside(targetPrice: number, currentPrice: number) {
  const pct = ((targetPrice - currentPrice) / currentPrice) * 100;
  return { pct, formatted: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` };
}

function SignalPill({ signal }: { signal: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    strong_buy: { label: "STRONG BUY", cls: "bg-bullish/20 text-bullish border-bullish/30" },
    buy: { label: "BUY", cls: "bg-bullish/10 text-bullish border-bullish/20" },
    neutral: { label: "NEUTRAL", cls: "bg-secondary text-muted-foreground border-border" },
    sell: { label: "SELL", cls: "bg-bearish/10 text-bearish border-bearish/20" },
    strong_sell: { label: "STRONG SELL", cls: "bg-bearish/20 text-bearish border-bearish/30" },
  };
  const { label, cls } = map[signal] ?? map.neutral;
  return (
    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wide", cls)}>
      {label}
    </span>
  );
}

function HorizonCell({ targetPrice, changeAmount, confidence, direction, currency }: {
  targetPrice: number; changeAmount: number; confidence: number; direction: string; currency: string;
}) {
  const isUp = direction === "bullish";
  const isDown = direction === "bearish";
  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-center min-w-[64px]",
      isUp ? "bg-bullish/10" : isDown ? "bg-bearish/10" : "bg-secondary/40"
    )}>
      <div className={cn("flex items-center gap-0.5 font-bold text-xs font-data",
        isUp ? "text-bullish" : isDown ? "text-bearish" : "text-muted-foreground"
      )}>
        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
        {currency === "INR" ? "₹" : "$"}{targetPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
      <div className="text-[9px] text-muted-foreground">{changeAmount >= 0 ? "+" : ""}{changeAmount.toFixed(1)} · {confidence}%</div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 65 ? "bg-bullish" : score >= 50 ? "bg-amber-500" : "bg-bearish";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-[10px] font-data font-bold w-6 text-right",
        score >= 65 ? "text-bullish" : score >= 50 ? "text-amber-400" : "text-bearish"
      )}>{score}</span>
    </div>
  );
}

function WatchlistButton({ symbol, name, added, pending, onAdd }: {
  symbol: string;
  name: string;
  added: boolean;
  pending: boolean;
  onAdd: (symbol: string, name: string) => void;
}) {
  if (added) {
    return (
      <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded bg-bullish/10 border border-bullish/30 text-bullish font-medium cursor-default">
        <Check className="w-3.5 h-3.5" />
        Added
      </div>
    );
  }
  return (
    <button
      onClick={() => onAdd(symbol, name)}
      disabled={pending}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-primary/30 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
        pending && "opacity-60 cursor-wait"
      )}
    >
      {pending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
      {pending ? "Adding…" : "Watchlist"}
    </button>
  );
}

export default function PredictionsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "rsi" | "upside">("score");
  const [capTab, setCapTab] = useState<"all" | "large" | "mid" | "small">("all");
  const [sectorTab, setSectorTab] = useState<string>("all");
  const [indicatorTab, setIndicatorTab] = useState<IndicatorKey>("app");

  const isSearching = committedQuery.length >= 1;
  const [data, setData] = useState<TopPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const loadPredictions = async () => {
    const limit = isSearching ? 30 : 20;
    const params = new URLSearchParams();
    if (isSearching) params.set("q", committedQuery);
    params.set("cap", capTab);
    params.set("indicator", indicatorTab);
    params.set("limit", String(limit));
    const res = await fetch(`/api/predictions/top?${params.toString()}`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    setIsLoading(true);
    loadPredictions().finally(() => setIsLoading(false));
  }, [committedQuery, capTab, indicatorTab]);
  const [watchlistAdded, setWatchlistAdded] = useState<Set<string>>(new Set());
  const [watchlistPending, setWatchlistPending] = useState<Set<string>>(new Set());
  const addToWatchlistMutation = useAddToWatchlist({
    mutation: {
      onSuccess: (_data, variables) => {
        const sym = variables.data.symbol;
        setWatchlistAdded(prev => new Set([...prev, sym]));
        setWatchlistPending(prev => {
          const next = new Set(prev);
          next.delete(sym);
          return next;
        });
      },
      onError: (_err, variables) => {
        const sym = variables.data.symbol;
        setWatchlistPending(prev => {
          const next = new Set(prev);
          next.delete(sym);
          return next;
        });
      },
    }
  });

  const handleAddToWatchlist = (symbol: string, name: string) => {
    if (watchlistAdded.has(symbol) || watchlistPending.has(symbol)) return;
    setWatchlistPending(prev => new Set([...prev, symbol]));
    addToWatchlistMutation.mutate({ data: { symbol, name } });
  };

  const handleSearch = () => setCommittedQuery(searchQuery.trim());
  const handleClear = () => { setSearchQuery(""); setCommittedQuery(""); };
  const refetch = () => {
    setIsFetching(true);
    loadPredictions().finally(() => setIsFetching(false));
  };

  const stocks = data?.stocks ?? [];
  const sectors = useMemo(() => {
    const unique = Array.from(new Set(stocks.map(stock => stock.sector))).sort();
    return ["all", ...unique];
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const base = sectorTab === "all" ? stocks : stocks.filter(stock => stock.sector === sectorTab);
    return base;
  }, [stocks, sectorTab, indicatorTab]);

  const rankedStocks = useMemo(() => {
    const list = [...filteredStocks];
    if (sortBy === "rsi") {
      return list.sort((a, b) => (a.currentRsi ?? 50) - (b.currentRsi ?? 50));
    }
    if (sortBy === "upside") {
      return list.sort((a, b) => {
        const bestUpside = (s: typeof a) =>
          Math.max(...Object.values(s.predictions).map(p => ((p.targetPrice - s.currentPrice) / s.currentPrice) * 100));
        return bestUpside(b) - bestUpside(a);
      });
    }
    return list.sort((a, b) => b.overallScore - a.overallScore);
  }, [filteredStocks, sortBy]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const topThree = rankedStocks.slice(0, 3);
  const restStocks = rankedStocks.slice(3);

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Daily Stock Picks</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{isSearching ? `Results for "${committedQuery}"` : `Top Indian NSE stocks · ${today}`}</span>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded bg-secondary/50 border border-border hover:bg-secondary shrink-0"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          Refresh picks
        </button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSearch();
                  if (e.key === "Escape") handleClear();
                }}
                type="text"
                placeholder="Search stock (e.g. RELIANCE, TCS, WIPRO…)"
                className="w-full bg-secondary border-none rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
              Search
            </button>
            {isSearching && (
              <button onClick={handleClear} className="px-3 py-2 bg-secondary text-muted-foreground rounded-md text-sm hover:bg-secondary/70 shrink-0">
                Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Prediction mode:</span>
            {INDICATORS.map(ind => (
              <button
                key={ind.key}
                onClick={() => setIndicatorTab(ind.key)}
                className={cn(
                  "px-2.5 py-1 rounded border text-xs transition-colors",
                  indicatorTab === ind.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {ind.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {indicatorTab === "app"
              ? "App Suggested uses the strongest overall score from the app’s technical model."
              : `Showing predictions optimized for ${INDICATORS.find(i => i.key === indicatorTab)?.label}.`}
          </p>
        </CardContent>
      </Card>

      {!isSearching && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Sort:</span>
            {[
              { key: "score", label: "Composite Score" },
              { key: "rsi", label: "RSI Oversold" },
              { key: "upside", label: "Highest Upside" },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key as typeof sortBy)}
                className={cn(
                  "px-2.5 py-1 rounded border transition-colors",
                  sortBy === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs ml-auto sm:ml-0">
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => setSectorTab(sector)}
                className={cn(
                  "px-2.5 py-1 rounded border transition-colors",
                  sectorTab === sector ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {sector === "all" ? "All Sectors" : sector}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs ml-auto sm:ml-0">
            {[
              { key: "all", label: "All" },
              { key: "large", label: "Large Cap" },
              { key: "mid", label: "Mid Cap" },
              { key: "small", label: "Small Cap" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCapTab(tab.key as typeof capTab)}
                className={cn(
                  "px-2.5 py-1 rounded border transition-colors",
                  capTab === tab.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      )}

      {!isLoading && stocks.length === 0 && (
        <Card className="bg-card">
          <CardContent className="p-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{isSearching ? `No stocks found for "${committedQuery}"` : "No prediction data available"}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && stocks.length > 0 && (
        <>
          {!isSearching && topThree.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold">Today's Top Picks</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topThree.map((stock, idx) => {
                  const pred1d = stock.predictions["1d"];
                  const pred1w = stock.predictions["1w"];
                  const pred2w = stock.predictions["2w"];
                  const pred1mo = stock.predictions["1mo"];
                  const upside1d = pred1d ? formatUpside(pred1d.targetPrice, stock.currentPrice) : null;
                  const upside1w = pred1w ? formatUpside(pred1w.targetPrice, stock.currentPrice) : null;
                  const upside2w = pred2w ? formatUpside(pred2w.targetPrice, stock.currentPrice) : null;
                  const upside1mo = pred1mo ? formatUpside(pred1mo.targetPrice, stock.currentPrice) : null;
                  const isTopPick = idx === 0;
                  return (
                    <Card key={stock.symbol} className={cn("relative overflow-hidden transition-all hover:border-primary/50 cursor-pointer", isTopPick ? "border-amber-400/40 ring-1 ring-amber-400/20" : "border-border")}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xl leading-none mb-0.5">{MEDALS[idx]}</div>
                            <div className="font-bold text-base">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[130px]">{stock.name}</div>
                          </div>
                          <div className="text-right">
                            <SignalPill signal={stock.overallSignal} />
                            <div className="font-data font-bold mt-1.5">{formatPrice(stock.currentPrice, stock.currency)}</div>
                          </div>
                        </div>
                        <ScoreBar score={stock.overallScore} />
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { pred: pred1d, upside: upside1d, label: "1-DAY" },
                            { pred: pred1w, upside: upside1w, label: "1-WEEK" },
                            { pred: pred2w, upside: upside2w, label: "2-WEEK" },
                            { pred: pred1mo, upside: upside1mo, label: "1-MONTH" },
                          ] as const).map(({ pred, upside, label }) => pred && (
                            <div key={label} className="bg-secondary/40 rounded-lg p-2 text-center">
                              <div className="text-[9px] text-muted-foreground font-data mb-0.5">{label} TARGET</div>
                              <div className={cn("font-bold text-sm font-data", pred.direction === "bullish" ? "text-bullish" : pred.direction === "bearish" ? "text-bearish" : "text-muted-foreground")}>
                                {formatPrice(pred.targetPrice, stock.currency)}
                              </div>
                              {upside && (
                                <div className={cn("text-[10px] font-semibold", upside.pct >= 0 ? "text-bullish" : "text-bearish")}>
                                  {upside.formatted}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-data">RSI {stock.currentRsi?.toFixed(1) ?? "—"}</span>
                          <span className="truncate max-w-[100px] text-right">{stock.sector}</span>
                        </div>
                        {stock.signals.length > 0 && (
                          <p className="text-[10px] text-muted-foreground italic leading-relaxed border-t border-border pt-2">{stock.signals[0]}</p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/chart/${stock.symbol}`)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-border rounded hover:bg-secondary/50 transition-colors text-muted-foreground">
                            <BarChart2 className="w-3.5 h-3.5" />
                            Chart
                          </button>
                          <WatchlistButton symbol={stock.symbol} name={stock.name} added={watchlistAdded.has(stock.symbol)} pending={watchlistPending.has(stock.symbol)} onAdd={handleAddToWatchlist} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            {!isSearching && restStocks.length > 0 && (
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground">All Ranked Stocks</h2>
            )}
            <div className="hidden md:grid grid-cols-[2fr_1fr_repeat(4,1fr)_auto] gap-3 items-center px-4 mb-1 text-[10px] font-data text-muted-foreground uppercase tracking-wide">
              <div>Stock</div>
              <div>Score / Signal</div>
              {HORIZONS.map(h => <div key={h.key} className="text-center">{h.key.toUpperCase()}</div>)}
              <div></div>
            </div>
            <div className="grid gap-2">
              {(isSearching ? rankedStocks : restStocks).map((stock, idx) => {
                const flag = stock.currency === "INR" ? "🇮🇳" : "🇺🇸";
                const rankNum = isSearching ? idx + 1 : idx + 4;
                return (
                  <Card key={stock.symbol} className="bg-card border border-border transition-all hover:border-primary/40">
                    <CardContent className="p-3 md:p-4">
                      <div className="md:hidden space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-data text-muted-foreground w-5">#{rankNum}</span>
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">{stock.sector}</span>
                            <span className="text-sm">{flag}</span>
                            <div>
                              <div className="font-bold text-sm">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[140px]">{stock.name}</div>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-data font-bold text-sm">{formatPrice(stock.currentPrice, stock.currency)}</div>
                            <SignalPill signal={stock.overallSignal} />
                          </div>
                        </div>
                        <ScoreBar score={stock.overallScore} />
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {HORIZONS.map(h => {
                            const pred = stock.predictions[h.key];
                            if (!pred) return null;
                            return (
                              <div key={h.key} className="shrink-0">
                                <div className="text-[9px] text-muted-foreground text-center mb-0.5 font-data">{h.key.toUpperCase()}</div>
                                <HorizonCell {...pred} changeAmount={pred.changeAmount ?? (pred.targetPrice - stock.currentPrice)} currency={stock.currency} />
                              </div>
                            );
                          })}
                        </div>
                        {stock.signals.length > 0 && (
                          <p className="text-[10px] text-muted-foreground italic">{stock.signals[0]}</p>
                        )}
                        <button onClick={() => navigate(`/chart/${stock.symbol}`)} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs border border-border rounded hover:bg-secondary/50 transition-colors text-muted-foreground">
                          <BarChart2 className="w-3.5 h-3.5" />
                          View Chart
                        </button>
                      </div>

                      <div className="hidden md:grid grid-cols-[2fr_1fr_repeat(4,1fr)_auto] gap-3 items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-data text-muted-foreground w-5 shrink-0">#{rankNum}</span>
                          <span className="text-base shrink-0">{flag}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-sm">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                            <div className="font-data text-xs mt-0.5">{formatPrice(stock.currentPrice, stock.currency)}</div>
                            {stock.signals.length > 0 && (
                              <div className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{stock.signals[0]}</div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <ScoreBar score={stock.overallScore} />
                          <SignalPill signal={stock.overallSignal} />
                          {stock.currentRsi != null && (
                            <div className="text-[10px] text-muted-foreground font-data">RSI {stock.currentRsi.toFixed(1)}</div>
                          )}
                        </div>
                        {HORIZONS.map(h => {
                          const pred = stock.predictions[h.key];
                          if (!pred) return <div key={h.key} className="text-muted-foreground text-xs text-center">—</div>;
                          return <HorizonCell key={h.key} {...pred} changeAmount={pred.changeAmount ?? (pred.targetPrice - stock.currentPrice)} currency={stock.currency} />;
                        })}
                        <button onClick={() => navigate(`/chart/${stock.symbol}`)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-border rounded hover:bg-secondary/50 transition-colors text-muted-foreground justify-self-end">
                          <BarChart2 className="w-3.5 h-3.5" />
                          Chart
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
