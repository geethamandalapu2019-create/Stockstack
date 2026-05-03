import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAddToWatchlist } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BarChart2, CalendarDays, Check, ChevronDown, Minus, Plus, RefreshCw, Search, Sparkles, Star, TrendingDown, TrendingUp, Trophy, X } from "lucide-react";

const BASE_PATH = import.meta.env.BASE_URL;

const HORIZONS = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "2w", label: "2W" },
  { key: "1mo", label: "1M" },
] as const;

const INDICATORS = [
  { key: "app", label: "App Suggested" },
  { key: "swing_confluence", label: "Swing Confluence" },
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
  { key: "sma", label: "SMA" },
  { key: "ema", label: "EMA" },
  { key: "bb", label: "Bollinger Bands" },
  { key: "price_action", label: "Price Action" },
] as const;

type IndicatorKey = typeof INDICATORS[number]["key"];
type CapKey = "all" | "large" | "mid" | "small";

type Prediction = {
  targetPrice: number;
  changeAmount: number;
  direction: string;
  confidence: number;
  label: string;
};

type StockItem = {
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
  predictions: Record<string, Prediction>;
};

type TopPredictionResponse = {
  indicator: IndicatorKey;
  stocks: StockItem[];
};

function priceText(price: number, currency: string) {
  return `${currency === "INR" ? "₹" : "$"}${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function upsideText(target: number, current: number) {
  const pct = current ? ((target - current) / current) * 100 : 0;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function badge(signal: string) {
  if (signal === "strong_buy" || signal === "buy") return "text-bullish";
  if (signal === "strong_sell" || signal === "sell") return "text-bearish";
  return "text-muted-foreground";
}

function QuotePrice({ symbol, fallback, currency }: { symbol: string; fallback: number; currency: string }) {
  const [value, setValue] = useState<number>(fallback);
  useEffect(() => {
    let alive = true;
    fetch(`${BASE_PATH}api/stocks/${symbol}/quote`).then(r => r.json()).then(data => {
      if (alive && typeof data?.price === "number") setValue(data.price);
    }).catch(() => {});
    return () => { alive = false; };
  }, [symbol]);
  return <span>{priceText(value, currency)}</span>;
}

function Pill({ text, active, onClick }: { text: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("px-3 py-2 rounded-xl border text-xs", active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>{text}</button>;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div className="relative"><select value={value} onChange={e => onChange(e.target.value)} className="appearance-none bg-background border border-border rounded-xl px-3 py-2 pr-9 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" /></div>;
}

function SignalPill({ signal }: { signal: string }) {
  const map: Record<string, string> = { strong_buy: "bg-bullish/20 text-bullish", buy: "bg-bullish/10 text-bullish", neutral: "bg-secondary text-muted-foreground", sell: "bg-bearish/10 text-bearish", strong_sell: "bg-bearish/20 text-bearish" };
  return <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wide", map[signal] ?? map.neutral)}>{signal.replaceAll("_", " ").toUpperCase()}</span>;
}

export default function PredictionsPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [indicator, setIndicator] = useState<IndicatorKey>("app");
  const [cap, setCap] = useState<CapKey>("all");
  const [sector, setSector] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "rsi" | "upside">("score");
  const [data, setData] = useState<TopPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlistAdded, setWatchlistAdded] = useState<Set<string>>(new Set());
  const [watchlistPending, setWatchlistPending] = useState<Set<string>>(new Set());

  const searching = committedQuery.trim().length > 0;

  const load = async () => {
    const params = new URLSearchParams();
    if (searching) params.set("q", committedQuery.trim());
    params.set("indicator", indicator);
    params.set("cap", cap);
    params.set("limit", String(searching ? 30 : 20));
    const res = await fetch(`${BASE_PATH}api/predictions/top?${params.toString()}`);
    setData(await res.json());
  };

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [committedQuery, indicator, cap]);

  const addToWatchlist = useAddToWatchlist({
    mutation: {
      onSuccess: (_data, vars) => {
        const sym = vars.data.symbol;
        setWatchlistAdded(prev => new Set([...prev, sym]));
        setWatchlistPending(prev => { const next = new Set(prev); next.delete(sym); return next; });
      },
      onError: (_err, vars) => {
        const sym = vars.data.symbol;
        setWatchlistPending(prev => { const next = new Set(prev); next.delete(sym); return next; });
      }
    }
  });

  const stocks = data?.stocks ?? [];
  const sectors = useMemo(() => ["all", ...Array.from(new Set(stocks.map(s => s.sector))).sort()], [stocks]);
  const filtered = useMemo(() => {
    const bySector = sector === "all" ? stocks : stocks.filter(s => s.sector === sector);
    const list = [...bySector];
    if (sortBy === "rsi") list.sort((a, b) => (a.currentRsi ?? 50) - (b.currentRsi ?? 50));
    if (sortBy === "upside") list.sort((a, b) => {
      const best = (s: StockItem) => Math.max(...Object.values(s.predictions).map(p => ((p.targetPrice - s.currentPrice) / s.currentPrice) * 100));
      return best(b) - best(a);
    });
    return list;
  }, [stocks, sector, sortBy]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const selectedLabel = data?.indicator ? INDICATORS.find(i => i.key === data.indicator)?.label ?? "App Suggested" : "App Suggested";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const handleSearch = () => setCommittedQuery(query.trim());
  const handleClear = () => { setQuery(""); setCommittedQuery(""); };
  const refresh = () => { setLoading(true); load().finally(() => setLoading(false)); };

  return <div className="max-w-7xl mx-auto space-y-4 pb-6">
    <Card className="bg-card border-border"><CardContent className="p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1"><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><h1 className="text-2xl font-bold tracking-tight">Daily Stock Picks</h1></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" /><span>{searching ? `Results for "${committedQuery}"` : `Top Indian NSE stocks · ${today}`}</span></div></div>
        <div className="flex items-center gap-2"><Select value={indicator} onChange={v => setIndicator(v as IndicatorKey)} options={INDICATORS.map(i => ({ value: i.key, label: i.label }))} /><button onClick={refresh} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />Refresh</button></div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-border bg-secondary/30 p-3"><div className="text-[11px] text-muted-foreground">Mode</div><div className="font-semibold">{selectedLabel}</div></div><div className="rounded-xl border border-border bg-secondary/30 p-3"><div className="text-[11px] text-muted-foreground">Picks</div><div className="font-semibold">{stocks.length}</div></div><div className="rounded-xl border border-border bg-secondary/30 p-3"><div className="text-[11px] text-muted-foreground">Cap Filter</div><div className="font-semibold capitalize">{cap}</div></div></div>
    </CardContent></Card>

    <Card className="bg-card border-border"><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" /><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") handleClear(); }} type="text" placeholder="Search stock (e.g. RELIANCE, TCS, WIPRO…)" className="w-full bg-secondary border-none rounded-xl pl-9 pr-8 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />{query && <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}</div><button onClick={handleSearch} className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">Search</button>{searching && <button onClick={handleClear} className="px-3 py-3 bg-secondary text-muted-foreground rounded-xl text-sm hover:bg-secondary/70 shrink-0">Clear</button>}</div></CardContent></Card>

    <Card className="bg-card border-border"><CardContent className="p-4 space-y-3"><div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-muted-foreground self-center">Sort</span><Pill text="Score" active={sortBy === "score"} onClick={() => setSortBy("score")} /><Pill text="RSI" active={sortBy === "rsi"} onClick={() => setSortBy("rsi")} /><Pill text="Upside" active={sortBy === "upside"} onClick={() => setSortBy("upside")} /></div><div className="flex flex-wrap gap-2"><Pill text="All Caps" active={cap === "all"} onClick={() => setCap("all")} /><Pill text="Large" active={cap === "large"} onClick={() => setCap("large")} /><Pill text="Mid" active={cap === "mid"} onClick={() => setCap("mid")} /><Pill text="Small" active={cap === "small"} onClick={() => setCap("small")} /></div><div className="flex flex-wrap gap-2"><Select value={cap} onChange={v => setCap(v as CapKey)} options={[{ value: "all", label: "All Caps" }, { value: "large", label: "Large Cap" }, { value: "mid", label: "Mid Cap" }, { value: "small", label: "Small Cap" }]} /><Select value={sector} onChange={setSector} options={[{ value: "all", label: "All Sectors" }, ...sectors.filter(s => s !== "all").map(s => ({ value: s, label: s }))]} /></div></CardContent></Card>

    {loading && <div className="grid gap-3"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>{[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>}

    {!loading && stocks.length === 0 && <Card className="bg-card"><CardContent className="p-12 text-center"><Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{searching ? `No stocks found for "${committedQuery}"` : "No prediction data available"}</p></CardContent></Card>}

    {!loading && stocks.length > 0 && <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((stock, idx) => {
          const current = stock.currentPrice;
          return <Card key={stock.symbol} className={cn("border-border", idx === 0 && "border-amber-400/40 ring-1 ring-amber-400/20")}><CardContent className="p-4 space-y-3"><div className="flex items-start justify-between"><div><div className="text-xl leading-none mb-0.5">{["🥇", "🥈", "🥉"][idx]}</div><div className="font-bold text-base">{stock.symbol}</div><div className="text-xs text-muted-foreground truncate max-w-[140px]">{stock.name}</div></div><div className="text-right space-y-1"><SignalPill signal={stock.overallSignal} /><div className="text-[10px] text-muted-foreground mt-1">Current Price</div><div className="font-data font-bold"><QuotePrice symbol={stock.symbol} fallback={current} currency={stock.currency} /></div></div></div><div className="text-xs text-muted-foreground">Score: {stock.overallScore} · RSI: {stock.currentRsi?.toFixed(1) ?? "—"}</div><div className="grid grid-cols-2 gap-2">{HORIZONS.map(h => { const pred = stock.predictions[h.key]; if (!pred) return null; return <div key={h.key} className="bg-secondary/40 rounded-lg p-2 text-center"><div className="text-[9px] text-muted-foreground font-data mb-0.5">{h.label} TARGET</div><div className={cn("font-bold text-sm font-data", pred.direction === "bullish" ? "text-bullish" : pred.direction === "bearish" ? "text-bearish" : "text-muted-foreground")}>{priceText(pred.targetPrice, stock.currency)}</div><div className={cn("text-[10px] font-semibold", pred.targetPrice >= current ? "text-bullish" : "text-bearish")}>{upsideText(pred.targetPrice, current)}</div></div>; })}</div><div className="flex gap-2"><button onClick={() => navigate(`/chart/${stock.symbol}`)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-border rounded hover:bg-secondary/50 text-muted-foreground"><BarChart2 className="w-3.5 h-3.5" />Chart</button><button onClick={() => { if (watchlistAdded.has(stock.symbol) || watchlistPending.has(stock.symbol)) return; setWatchlistPending(prev => new Set([...prev, stock.symbol])); addToWatchlist.mutate({ data: { symbol: stock.symbol, name: stock.name } }); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-primary/30 rounded bg-primary/10 text-primary hover:bg-primary/20"><Plus className="w-3.5 h-3.5" />Watchlist</button></div></CardContent></Card>;
        })}
      </div>

      <div className="grid gap-2 mt-3">
        {rest.map((stock, idx) => {
          const current = stock.currentPrice;
          return <Card key={stock.symbol} className="bg-card border border-border"><CardContent className="p-3 md:p-4"><div className="md:hidden space-y-2.5"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="text-xs font-data text-muted-foreground w-5">#{idx + 4}</span><span className="text-xs font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">{stock.sector}</span><div><div className="font-bold text-sm">{stock.symbol}</div><div className="text-xs text-muted-foreground truncate max-w-[140px]">{stock.name}</div></div></div><div className="text-right space-y-1"><div className="font-data font-bold text-sm"><QuotePrice symbol={stock.symbol} fallback={current} currency={stock.currency} /></div><SignalPill signal={stock.overallSignal} /></div></div><div className="text-xs text-muted-foreground">Score: {stock.overallScore} · {stock.indicatorLabel}</div><div className="flex gap-1.5 overflow-x-auto pb-1">{HORIZONS.map(h => { const pred = stock.predictions[h.key]; if (!pred) return null; return <div key={h.key} className="shrink-0"><div className="text-[9px] text-muted-foreground text-center mb-0.5 font-data">{h.label}</div><div className="px-2 py-1.5 rounded text-center min-w-[64px] bg-secondary/40"><div className="font-bold text-xs font-data">{priceText(pred.targetPrice, stock.currency)}</div><div className="text-[9px] text-muted-foreground">{upsideText(pred.targetPrice, current)}</div></div></div>; })}</div><button onClick={() => navigate(`/chart/${stock.symbol}`)} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs border border-border rounded hover:bg-secondary/50 text-muted-foreground"><BarChart2 className="w-3.5 h-3.5" />View Chart</button></div><div className="hidden md:grid grid-cols-[2fr_1fr_repeat(4,1fr)_auto] gap-3 items-center"><div className="flex items-center gap-2 min-w-0"><span className="text-xs font-data text-muted-foreground w-5 shrink-0">#{idx + 4}</span><div className="min-w-0"><div className="font-bold text-sm">{stock.symbol}</div><div className="text-xs text-muted-foreground truncate">{stock.name}</div><div className="text-[10px] text-muted-foreground mt-0.5"><QuotePrice symbol={stock.symbol} fallback={current} currency={stock.currency} /></div></div></div><div className="space-y-1.5"><SignalPill signal={stock.overallSignal} /><div className="text-[10px] text-muted-foreground font-data">Score: {stock.overallScore}</div></div>{HORIZONS.map(h => { const pred = stock.predictions[h.key]; if (!pred) return <div key={h.key} className="text-muted-foreground text-xs text-center">—</div>; return <div key={h.key} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-center min-w-[64px] bg-secondary/40"><div className="text-xs font-bold font-data">{priceText(pred.targetPrice, stock.currency)}</div><div className="text-[9px] text-muted-foreground">{upsideText(pred.targetPrice, current)}</div></div>; })}<button onClick={() => navigate(`/chart/${stock.symbol}`)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-border rounded hover:bg-secondary/50 text-muted-foreground justify-self-end"><BarChart2 className="w-3.5 h-3.5" />Chart</button></div></CardContent></Card>;
        })}
      </div>
    </>}
  </div>;
}
