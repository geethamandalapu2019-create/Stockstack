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

export default function Watchlist() {
  const { data: watchlist, isLoading } = useGetWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearchLoading } = useSearchStocks({ q: searchQuery }, {
    query: {
      enabled: searchQuery.length > 1
    }
  });

  const handleRemove = (symbol: string) => {
    removeFromWatchlist.mutate({ symbol }, {
      onSuccess: () => {
        toast({ title: "Removed from watchlist", description: `${symbol} has been removed.` });
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
        toast({ title: "Added to watchlist", description: `${symbol} has been added.` });
        setSearchQuery("");
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground text-sm">Monitor signals for selected instruments.</p>
        </div>
        <div className="relative w-64 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Add to watchlist..." 
            className="pl-9"
          />
          {searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {isSearchLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults?.length ? (
                <div className="flex flex-col">
                  {searchResults.map(res => (
                    <button 
                      key={res.symbol}
                      className="flex justify-between items-center p-3 hover:bg-secondary transition-colors text-left"
                      onClick={() => handleAdd(res.symbol, res.name)}
                    >
                      <div>
                        <div className="font-bold">{res.symbol}</div>
                        <div className="text-xs text-muted-foreground">{res.name}</div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
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

      <div className="flex-1 overflow-auto bg-card border border-border rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground font-data text-xs border-b border-border sticky top-0 backdrop-blur">
            <tr>
              <th className="px-4 py-3 font-medium">SYMBOL</th>
              <th className="px-4 py-3 font-medium">NAME</th>
              <th className="px-4 py-3 font-medium text-right">PRICE</th>
              <th className="px-4 py-3 font-medium text-right">CHANGE</th>
              <th className="px-4 py-3 font-medium">SIGNAL</th>
              <th className="px-4 py-3 font-medium">ADDED</th>
              <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-6 w-20" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                </tr>
              ))
            ) : watchlist?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Activity className="w-12 h-12 text-muted/50 mx-auto mb-4" />
                  <div className="text-muted-foreground">Watchlist is empty. Search for a symbol to add it.</div>
                </td>
              </tr>
            ) : watchlist?.map((item) => (
              <tr key={item.symbol} className="hover:bg-secondary/20 transition-colors group">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/chart/${item.symbol}`} className="hover:text-primary transition-colors flex items-center gap-1">
                    {item.symbol}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{item.name}</td>
                <td className="px-4 py-3 text-right font-data">${item.price.toFixed(2)}</td>
                <td className={cn(
                  "px-4 py-3 text-right font-data",
                  item.changePercent > 0 ? "text-bullish" : "text-bearish"
                )}>
                  {item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                </td>
                <td className="px-4 py-3">
                  <SignalBadge signal={item.overallSignal} />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.addedAt).toLocaleDateString()}
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
