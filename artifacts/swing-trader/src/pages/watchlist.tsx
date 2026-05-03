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
import { getGetWatchlistQueryKey, getGetStockQuoteQueryKey } from "@workspace/api-client-react";

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
  return <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase", cfg[cap] ?? cfg.large)}>{cap}</span>;
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
    query: { enabled: searchQuery.length >= 1, staleTime: 0, gcTime: 0, refetchOnMount: "always" }
  });

  const handleRemove = (symbol: string) => {
    removeFromWatchlist.mutate({ symbol }, {
      onSuccess: () => {
        toast({ title: "Removed", description: `${symbol} removed from watchlist.` });
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStockQuoteQueryKey(symbol) });
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
        queryClient.invalidateQueries({ queryKey: getGetStockQuoteQueryKey(symbol) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
      }
    });
  };

  return <div />;
}
