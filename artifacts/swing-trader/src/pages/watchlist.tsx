import { useState } from "react";
import { Link } from "wouter";
import { useGetWatchlist, useRemoveFromWatchlist, useSearchStocks, useAddToWatchlist } from "@workspace/api-client-react";
import { Trash2, Search, Plus, ExternalLink, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "./dashboard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWatchlistQueryKey } from "@workspace/api-client-react";

function formatPrice(price: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(change: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${sym}${Math.abs(change).toFixed(2)}`;
}

function CapBadge({ cap }: { cap: string }) {
  const cfg: Record<string, string> = {
    large: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    mid:   "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    small: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase", cfg[cap] ?? cfg.large)}>
      {cap}
    </span>
  );
}

function RsiBadge({ rsi, signal }: { rsi: number | null; signal: string }) {
  if (rsi === null) return null;
  const cls = signal === "oversold" ? "text-bullish" : signal === "overbought" ? "text-bearish" : "text-muted-foreground";
  return <span className={cn("font-data text-xs", cls)}>{Math.round(rsi)}</span>;
}

export default function Watchlist() {
  const { data: watchlist, isLoading } = useGetWatchlist({ query: { staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true } });
  const removeFromWatchlist = useRemoveFromWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearchLoading } = useSearchStocks({ q: searchQuery }, {
    query: { enabled: searchQuery.length >= 1 }
  });

  const handleRemove = (symbol: string) => {
    removeFromWatchlist.mutate({ symbol }, {
      onSuccess: () => {
        toast({ title: "Removed", description: `${symbol} removed from watchlist.` });
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
      }
    });
  };

  const handleAdd = (symbol: string, name: string) => {
    addToWatchlist.mutate({ data: { symbol, name } }, {
      onSuccess: () => {
        toast({ title: "Added", description: `${symbol} added to watchlist.` });
        setSearchQuery("");
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground text-sm">Monitor signals for selected instruments.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search to add (RELIANCE, TCS…)"
            className="pl-9"
          />
          {searchQuery.length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-xl z-50 max-h-64 overflow-y-auto">
              {isSearchLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching…</div>
              ) : searchResults?.length ? (
                <div className="flex flex-col">
                  {searchResults.map(res => (
                    <button
                      key={res.symbol}
                      className="flex justify-between items-center p-3 hover:bg-secondary transition-colors text-left border-b border-border/50 last:border-0"
                      onClick={() => handleAdd(res.symbol, res.name)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{res.currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm">{res.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate">{res.name}</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile card view */}
      <div className="flex-1 overflow-auto md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : watchlist?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Activity className="w-12 h-12 text-muted/50 mb-4" />
            <div>Watchlist is empty. Search for a symbol to add it.</div>
          </div>
        ) : watchlist?.map(item => (
          <Card key={item.symbol} className="bg-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {/* Row 1: flag + symbol + signal + cap */}
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-sm">{item.currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                    <Link href={`/chart/${item.symbol}`} className="font-bold text-base hover:text-primary transition-colors">
                      {item.symbol}
                    </Link>
                    <SignalBadge signal={item.overallSignal} />
                    <CapBadge cap={item.capCategory} />
                  </div>
                  {/* Row 2: name + sector */}
                  <div className="text-xs text-muted-foreground truncate mb-2">
                    {item.name} · <span className="text-muted-foreground/70">{item.sector}</span>
                  </div>
                  {/* Row 3: price + changes */}
                  <div className="flex items-center gap-2">
                    <span className="font-data font-semibold text-sm">{formatPrice(item.price, item.currency)}</span>
                    <span className={cn("font-data text-xs", item.change >= 0 ? "text-bullish" : "text-bearish")}>
                      {formatChange(item.change, item.currency)}
                    </span>
                    <span className={cn("font-data text-xs", item.changePercent >= 0 ? "text-bullish" : "text-bearish")}>
                      ({item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%)
                    </span>
                    <span className="text-muted-foreground text-xs ml-auto">RSI <RsiBadge rsi={item.rsi} signal={item.rsiSignal} /></span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Link href={`/chart/${item.symbol}`}><ExternalLink className="w-4 h-4" /></Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(item.symbol)}
                    disabled={removeFromWatchlist.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block flex-1 overflow-auto bg-card border border-border rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground font-data text-xs border-b border-border sticky top-0 backdrop-blur">
            <tr>
              <th className="px-4 py-3 font-medium">SYMBOL</th>
              <th className="px-4 py-3 font-medium">NAME / SECTOR</th>
              <th className="px-4 py-3 font-medium text-right">PRICE</th>
              <th className="px-4 py-3 font-medium text-right">CHANGE (₹)</th>
              <th className="px-4 py-3 font-medium text-right">CHANGE (%)</th>
              <th className="px-4 py-3 font-medium text-center">RSI</th>
              <th className="px-4 py-3 font-medium">SIGNAL</th>
              <th className="px-4 py-3 font-medium">CAP</th>
              <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                  ))}
                </tr>
              ))
            ) : watchlist?.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <Activity className="w-12 h-12 text-muted/50 mx-auto mb-4" />
                  <div className="text-muted-foreground">Watchlist is empty. Search for a symbol to add it.</div>
                </td>
              </tr>
            ) : watchlist?.map((item) => (
              <tr key={item.symbol} className="hover:bg-secondary/20 transition-colors group">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/chart/${item.symbol}`} className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="text-sm">{item.currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                    {item.symbol}
                  </Link>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <div className="text-foreground truncate text-xs font-medium">{item.name}</div>
                  <div className="text-muted-foreground text-xs truncate">{item.sector}</div>
                </td>
                <td className="px-4 py-3 text-right font-data">{formatPrice(item.price, item.currency)}</td>
                <td className={cn(
                  "px-4 py-3 text-right font-data",
                  item.change >= 0 ? "text-bullish" : "text-bearish"
                )}>
                  {formatChange(item.change, item.currency)}
                </td>
                <td className={cn(
                  "px-4 py-3 text-right font-data",
                  item.changePercent >= 0 ? "text-bullish" : "text-bearish"
                )}>
                  {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <RsiBadge rsi={item.rsi} signal={item.rsiSignal} />
                </td>
                <td className="px-4 py-3">
                  <SignalBadge signal={item.overallSignal} />
                </td>
                <td className="px-4 py-3">
                  <CapBadge cap={item.capCategory} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Link href={`/chart/${item.symbol}`}><ExternalLink className="w-4 h-4" /></Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.symbol)}
                      disabled={removeFromWatchlist.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
