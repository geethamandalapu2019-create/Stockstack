import { useState } from "react";
import { useLocation } from "wouter";
import { useGetTopPredictions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Sparkles, Search, X, TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2
} from "lucide-react";

const HORIZONS = [
  { key: "1d", label: "1 Day" },
  { key: "5d", label: "5 Days" },
  { key: "10d", label: "10 Days" },
  { key: "2w", label: "2 Weeks" },
  { key: "1mo", label: "1 Month" },
];

function formatPrice(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  if (currency === "INR" && price >= 1000) {
    return `${sym}${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `${sym}${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      <div className="text-[9px] text-muted-foreground">{changeAmount >= 0 ? "+" : ""}{changeAmount.toFixed(1)} · {confidence}% conf</div>
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

export default function PredictionsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "rsi">("score");
  const [capTab, setCapTab] = useState<"all" | "large" | "mid" | "small">("all");

  const isSearching = committedQuery.length >= 1;

  const { data, isLoading, refetch, isFetching } = useGetTopPredictions(
    isSearching ? { q: committedQuery, cap: capTab, limit: 30 } : { cap: capTab, limit: 10 },
    { query: { refetchOnWindowFocus: false, queryKey: ["top-predictions", committedQuery, capTab, isSearching ? 30 : 10] } }
  );

  const handleSearch = () => {
    setCommittedQuery(searchQuery.trim());
  };

  const handleClear = () => {
    setSearchQuery("");
    setCommittedQuery("");
  };

  const stocks = data?.stocks ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stock Predictions</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isSearching
              ? `Search results for "${committedQuery}" — multi-indicator composite analysis`
              : `Top ${capTab === "all" ? "Indian" : capTab} cap stocks ranked by composite multi-indicator score`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded bg-secondary/50 border border-border hover:bg-secondary shrink-0"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-3 md:p-4">
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
                placeholder="Search stock (e.g. RELIANCE, TCS, WIPRO, NVDA…)"
                className="w-full bg-secondary border-none rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              Search
            </button>
            {isSearching && (
              <button onClick={handleClear} className="px-3 py-2 bg-secondary text-muted-foreground rounded-md text-sm hover:bg-secondary/70 transition-colors shrink-0">
                Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sort controls */}
      {!isSearching && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          {[
            { key: "score", label: "Composite Score" },
            { key: "rsi", label: "RSI Oversold" },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key as any)}
              className={cn(
                "px-2.5 py-1 rounded border transition-colors",
                sortBy === opt.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {!isSearching && (
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: "all", label: "All Caps" },
            { key: "large", label: "Large Cap" },
            { key: "mid", label: "Mid Cap" },
            { key: "small", label: "Small Cap" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setCapTab(tab.key as typeof capTab)}
              className={cn(
                "px-3 py-1.5 rounded border transition-colors",
                capTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Horizon legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-data">HORIZONS:</span>
        {HORIZONS.map(h => (
          <span key={h.key} className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded border border-border">
            <span className="font-data font-medium text-foreground">{h.key.toUpperCase()}</span>
            <span>{h.label}</span>
          </span>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="p-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <div className="text-muted-foreground">
              {isSearching ? `No stocks found for "${committedQuery}"` : "No prediction data available"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {/* Table Header — desktop */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_repeat(5,1fr)_auto] gap-3 items-center px-4 text-[10px] font-data text-muted-foreground uppercase tracking-wide">
            <div>Stock</div>
            <div>Score / Signal</div>
            {HORIZONS.map(h => <div key={h.key} className="text-center">{h.key.toUpperCase()}</div>)}
            <div></div>
          </div>

          {(sortBy === "rsi" && !isSearching
            ? [...stocks].sort((a, b) => (a.currentRsi ?? 50) - (b.currentRsi ?? 50))
            : stocks
          ).map((stock, idx) => {
            const flag = stock.currency === "INR" ? "🇮🇳" : "🇺🇸";
            return (
              <Card key={stock.symbol} className={cn(
                "bg-card border transition-all hover:border-primary/40",
                !isSearching && idx === 0 && "border-primary/30 ring-1 ring-primary/20"
              )}>
                <CardContent className="p-3 md:p-4">
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {!isSearching && <span className="text-xs font-data text-muted-foreground w-5">#{idx + 1}</span>}
                        <span className="text-sm">{flag}</span>
                        <div>
                          <div className="font-bold text-sm">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
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
                      <div className="text-[10px] text-muted-foreground italic">{stock.signals[0]}</div>
                    )}
                    <button
                      onClick={() => navigate(`/chart/${stock.symbol}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs border border-border rounded hover:bg-secondary/50 transition-colors text-muted-foreground"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      View Chart
                    </button>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_repeat(5,1fr)_auto] gap-3 items-center">
                    {/* Stock info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {!isSearching && (
                        <span className="text-xs font-data text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                      )}
                      <span className="text-base shrink-0">{flag}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                        <div className="font-data font-medium text-xs mt-0.5">{formatPrice(stock.currentPrice, stock.currency)}</div>
                        {stock.signals.length > 0 && (
                          <div className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{stock.signals[0]}</div>
                        )}
                      </div>
                    </div>

                    {/* Score + Signal */}
                    <div className="space-y-1.5">
                      <ScoreBar score={stock.overallScore} />
                      <SignalPill signal={stock.overallSignal} />
                      {stock.currentRsi != null && (
                        <div className="text-[10px] text-muted-foreground font-data">RSI {stock.currentRsi.toFixed(1)}</div>
                      )}
                    </div>

                    {/* Horizon cells */}
                    {HORIZONS.map(h => {
                      const pred = stock.predictions[h.key];
                      if (!pred) return <div key={h.key} className="text-muted-foreground text-xs text-center">—</div>;
                      return <HorizonCell key={h.key} {...pred} changeAmount={pred.changeAmount ?? (pred.targetPrice - stock.currentPrice)} currency={stock.currency} />;
                    })}

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/chart/${stock.symbol}`)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded hover:bg-secondary/50 transition-colors text-muted-foreground shrink-0"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      Chart
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isSearching && stocks.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pb-2">
          Predictions are generated using RSI, MACD, Stochastic, CCI, Williams %R, Bollinger Bands, and OBV.
          Past performance does not guarantee future results. Not financial advice.
        </div>
      )}
    </div>
  );
}
