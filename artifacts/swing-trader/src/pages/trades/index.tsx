import { useState } from "react";
import { Link } from "wouter";
import { useGetTrades, useGetTradeStats, getGetTradesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Briefcase, Activity, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Trades() {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  
  const { data: stats, isLoading: isStatsLoading } = useGetTradeStats();
  
  const tradesParams = filter === "all" ? {} : { status: filter as "open" | "closed" };
  const { data: trades, isLoading: isTradesLoading } = useGetTrades(tradesParams, {
    query: { queryKey: getGetTradesQueryKey(tradesParams) }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-muted-foreground text-sm">Log and analyze your swing trades.</p>
        </div>
        <Button asChild>
          <Link href="/trades/new">
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Total PnL</div>
            {isStatsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className={cn(
                "text-2xl font-bold font-data",
                (stats?.totalPnl || 0) > 0 ? "text-bullish" : (stats?.totalPnl || 0) < 0 ? "text-bearish" : ""
              )}>
                ₹{stats?.totalPnl?.toFixed(2) || '0.00'}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
            {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-data text-foreground">
                {stats?.winRate != null ? Number(stats.winRate).toFixed(1) : '0'}%
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Profit Factor</div>
            {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-data text-foreground">
                {stats?.profitFactor?.toFixed(2) || '-'}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Active/Total</div>
            {isStatsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold font-data text-foreground">
                {stats?.openTrades || 0} <span className="text-muted-foreground text-lg">/ {stats?.totalTrades || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col bg-card min-h-0 border-border">
        <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between shrink-0">
          <div className="flex gap-2">
            {(["all", "open", "closed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded font-medium capitalize transition-colors",
                  filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/30 text-muted-foreground font-data text-xs border-b border-border sticky top-0 backdrop-blur">
              <tr>
                <th className="px-4 py-3 font-medium">SYMBOL</th>
                <th className="px-4 py-3 font-medium">SIDE</th>
                <th className="px-4 py-3 font-medium">ENTRY</th>
                <th className="px-4 py-3 font-medium">EXIT</th>
                <th className="px-4 py-3 font-medium text-right">PnL</th>
                <th className="px-4 py-3 font-medium text-center">STATUS</th>
                <th className="px-4 py-3 font-medium">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isTradesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-10" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : trades?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted/50 mx-auto mb-4" />
                    <div className="text-muted-foreground">No trades found. Start logging your trades.</div>
                  </td>
                </tr>
              ) : trades?.map((trade) => (
                <tr key={trade.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer relative">
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/trades/${trade.id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">View {trade.symbol}</span>
                    </Link>
                    {trade.symbol}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium",
                      trade.side === 'long' ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"
                    )}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-data">₹{trade.entryPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 font-data text-muted-foreground">
                    {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-data">
                    {trade.pnl !== null ? (
                      <span className={trade.pnl > 0 ? "text-bullish" : trade.pnl < 0 ? "text-bearish" : ""}>
                        {trade.pnl > 0 ? "+" : ""}₹{trade.pnl.toFixed(2)}
                        <span className="text-xs ml-1 opacity-70">
                          ({trade.pnlPercent?.toFixed(2)}%)
                        </span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {trade.status === 'open' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-accent">
                        <Activity className="w-3 h-3" /> OPEN
                      </span>
                    ) : trade.pnl && trade.pnl > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-bullish">
                        <CheckCircle2 className="w-3 h-3" /> WIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-bearish">
                        <XCircle className="w-3 h-3" /> LOSS
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(trade.entryDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
