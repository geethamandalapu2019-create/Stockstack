import { useGetDashboardSummary, useGetDashboardSignals } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Activity, Target, ShieldAlert, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatPrice(price: number, currency: string) {
  const symbol = currency === "INR" ? "₹" : "$";
  if (currency === "INR" && price >= 100000) {
    return `${symbol}${(price / 100000).toFixed(2)}L`;
  }
  return `${symbol}${price.toFixed(2)}`;
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: signals, isLoading: isLoadingSignals } = useGetDashboardSignals();

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Market Pulse</h1>
        <p className="text-muted-foreground text-sm">Real-time overview and aggregated signals.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Open Trades PnL"
          value={isLoadingSummary ? null : `₹${summary?.totalPnl?.toFixed(2) || "0.00"}`}
          subtitle={summary?.totalPnl && summary.totalPnl > 0 ? "Profitable" : "In loss"}
          trend={summary?.totalPnl && summary.totalPnl > 0 ? "up" : "down"}
          icon={Activity}
        />
        <StatCard
          title="Win Rate"
          value={isLoadingSummary ? null : `${(summary?.winRate || 0).toFixed(1)}%`}
          subtitle="All time"
          icon={Target}
        />
        <StatCard
          title="Watchlist"
          value={isLoadingSummary ? null : summary?.watchlistCount}
          subtitle="Active items"
          icon={ShieldAlert}
        />
        <StatCard
          title="Market Mood"
          value={isLoadingSummary ? null : summary?.marketMood?.toUpperCase()}
          subtitle="Aggregated"
          trend={summary?.marketMood === "bullish" ? "up" : summary?.marketMood === "bearish" ? "down" : "neutral"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base md:text-lg font-semibold tracking-tight">Top Swing Signals</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[560px]">
              <thead className="bg-secondary/50 text-muted-foreground font-data text-xs border-b border-border">
                <tr>
                  <th className="px-3 md:px-4 py-3 font-medium">SYMBOL</th>
                  <th className="px-3 md:px-4 py-3 font-medium text-right">PRICE</th>
                  <th className="px-3 md:px-4 py-3 font-medium text-right">CHANGE</th>
                  <th className="px-3 md:px-4 py-3 font-medium">SIGNAL</th>
                  <th className="px-3 md:px-4 py-3 font-medium">RSI / MACD</th>
                  <th className="px-3 md:px-4 py-3 font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingSignals ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-3 md:px-4 py-3">
                          <Skeleton className="h-4 w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : signals?.map((signal) => (
                  <tr key={signal.symbol} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-3 md:px-4 py-3 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{signal.currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                        {signal.symbol}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right font-data">
                      {formatPrice(signal.price, signal.currency)}
                    </td>
                    <td className={cn(
                      "px-3 md:px-4 py-3 text-right font-data",
                      signal.changePercent > 0 ? "text-bullish" : "text-bearish"
                    )}>
                      {signal.changePercent > 0 ? "+" : ""}{signal.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <SignalBadge signal={signal.overallSignal} />
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs">
                      <div className="flex gap-2">
                        <span className={cn(
                          signal.rsiSignal === "oversold" ? "text-bullish" :
                          signal.rsiSignal === "overbought" ? "text-bearish" : "text-muted-foreground"
                        )}>RSI: {Math.round(signal.currentRsi || 0)}</span>
                        <span className={cn(
                          signal.macdSignal === "bullish" ? "text-bullish" :
                          signal.macdSignal === "bearish" ? "text-bearish" : "text-muted-foreground"
                        )}>MACD</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <Link
                        href={`/chart/${signal.symbol}`}
                        className="text-xs bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 rounded text-foreground font-medium whitespace-nowrap"
                      >
                        Chart
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!signals || signals.length === 0) && !isLoadingSignals && (
              <div className="p-8 text-center text-muted-foreground text-sm">No active signals found.</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base md:text-lg font-semibold tracking-tight">Movers</h2>
          <div className="space-y-3">
            <Card className="bg-card">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs text-muted-foreground">Top Gainer</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {isLoadingSummary ? <Skeleton className="h-10 w-full" /> : (
                  summary?.topGainer ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg flex items-center gap-1.5">
                          <span className="text-sm">{summary.topGainer.currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                          {summary.topGainer.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">{summary.topGainer.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-data text-bullish">+{summary.topGainer.changePercent.toFixed(2)}%</div>
                        <div className="font-data text-muted-foreground text-sm">
                          {formatPrice(summary.topGainer.price, summary.topGainer.currency)}
                        </div>
                      </div>
                    </div>
                  ) : <div className="text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs text-muted-foreground">Top Loser</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {isLoadingSummary ? <Skeleton className="h-10 w-full" /> : (
                  summary?.topLoser ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg flex items-center gap-1.5">
                          <span className="text-sm">{summary.topLoser.currency === "INR" ? "🇮🇳" : "🇺🇸"}</span>
                          {summary.topLoser.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">{summary.topLoser.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-data text-bearish">{summary.topLoser.changePercent.toFixed(2)}%</div>
                        <div className="font-data text-muted-foreground text-sm">
                          {formatPrice(summary.topLoser.price, summary.topLoser.currency)}
                        </div>
                      </div>
                    </div>
                  ) : <div className="text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, trend, icon: Icon }: any) {
  return (
    <Card className="bg-card">
      <CardContent className="p-3 md:p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="text-xs text-muted-foreground font-medium">{title}</div>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          {value === null ? (
            <Skeleton className="h-7 w-20 mb-1" />
          ) : (
            <div className={cn(
              "text-xl md:text-2xl font-bold tracking-tight font-data",
              trend === "up" ? "text-bullish" : trend === "down" ? "text-bearish" : "text-foreground"
            )}>
              {value}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === "up" && <ArrowUpRight className="w-3 h-3 text-bullish" />}
            {trend === "down" && <ArrowDownRight className="w-3 h-3 text-bearish" />}
            {subtitle}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SignalBadge({ signal }: { signal: string }) {
  const mapping: Record<string, { label: string; cls: string }> = {
    strong_buy: { label: "STRONG BUY", cls: "bg-bullish text-black" },
    buy: { label: "BUY", cls: "bg-bullish/70 text-black" },
    neutral: { label: "NEUTRAL", cls: "bg-secondary text-muted-foreground border border-border" },
    sell: { label: "SELL", cls: "bg-bearish/70 text-white" },
    strong_sell: { label: "STRONG SELL", cls: "bg-bearish text-white" },
  };

  const config = mapping[signal] || mapping.neutral;

  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider whitespace-nowrap", config.cls)}>
      {config.label}
    </span>
  );
}
