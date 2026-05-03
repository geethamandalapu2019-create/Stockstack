import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetTrade, 
  useUpdateTrade, 
  useDeleteTrade,
  getGetTradeQueryKey,
  getGetTradesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Activity, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const closeFormSchema = z.object({
  exitPrice: z.coerce.number().positive("Must be greater than 0"),
  exitDate: z.string().min(1, "Exit date is required"),
  notes: z.string().optional(),
});

type CloseFormValues = z.infer<typeof closeFormSchema>;

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const tradeId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isClosing, setIsClosing] = useState(false);

  const { data: trade, isLoading } = useGetTrade(tradeId, {
    query: { enabled: !!tradeId, queryKey: getGetTradeQueryKey(tradeId) }
  });

  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();

  const form = useForm<CloseFormValues>({
    resolver: zodResolver(closeFormSchema),
    defaultValues: {
      exitPrice: undefined,
      exitDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const onConfirmClose = (values: CloseFormValues) => {
    updateTrade.mutate({ 
      id: tradeId, 
      data: {
        status: "closed",
        exitPrice: values.exitPrice,
        exitDate: values.exitDate,
        // Append new notes to old notes if provided
        notes: values.notes ? `${trade?.notes ? trade.notes + '\n\n---\nExit Notes:\n' : ''}${values.notes}` : trade?.notes
      }
    }, {
      onSuccess: () => {
        toast({ title: "Trade closed", description: "The position has been closed and PnL calculated." });
        queryClient.invalidateQueries({ queryKey: getGetTradeQueryKey(tradeId) });
        queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
        setIsClosing(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to close trade.", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this trade? This cannot be undone.")) return;
    
    deleteTrade.mutate({ id: tradeId }, {
      onSuccess: () => {
        toast({ title: "Trade deleted" });
        queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
        setLocation("/trades");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete trade.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!trade) {
    return <div className="p-8 text-center text-muted-foreground">Trade not found.</div>;
  }

  // Pre-fill current notes into form if closing
  if (isClosing && !form.getValues("notes") && trade.notes) {
     form.setValue("notes", ""); // Leave empty to just append exit notes
  }

  const isWin = trade.pnl && trade.pnl > 0;
  const isLoss = trade.pnl && trade.pnl < 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" className="text-muted-foreground -ml-4" onClick={() => setLocation("/trades")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trades
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chart/${trade.symbol}`}>
              <BarChart2 className="w-4 h-4 mr-2" /> View Chart
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card border-border">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <CardTitle className="text-3xl">{trade.symbol}</CardTitle>
                  <span className={cn(
                    "text-sm px-2 py-0.5 rounded font-bold uppercase",
                    trade.side === 'long' ? "bg-bullish/10 text-bullish border border-bullish/20" : "bg-bearish/10 text-bearish border border-bearish/20"
                  )}>
                    {trade.side}
                  </span>
                  {trade.status === 'open' ? (
                    <span className="text-sm px-2 py-0.5 rounded bg-accent/10 text-accent font-medium border border-accent/20 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> OPEN
                    </span>
                  ) : (
                    <span className="text-sm px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium border border-border">
                      CLOSED
                    </span>
                  )}
                </div>
                <CardDescription>{trade.name}</CardDescription>
              </div>
              
              {trade.status === 'closed' && trade.pnl !== null && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground font-medium">Realized PnL</div>
                  <div className={cn(
                    "text-3xl font-bold font-data",
                    isWin ? "text-bullish" : isLoss ? "text-bearish" : ""
                  )}>
                    {isWin ? "+" : ""}${trade.pnl.toFixed(2)}
                  </div>
                  <div className={cn(
                    "text-sm font-data",
                    isWin ? "text-bullish/80" : isLoss ? "text-bearish/80" : ""
                  )}>
                    {isWin ? "+" : ""}{trade.pnlPercent?.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border border-b border-border">
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                <div className="font-data text-lg font-medium">${trade.entryPrice.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(trade.entryDate).toLocaleDateString()}</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Exit Price</div>
                <div className="font-data text-lg font-medium">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</div>
                <div className="text-xs text-muted-foreground mt-1">{trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'Active'}</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Shares/Size</div>
                <div className="font-data text-lg font-medium">{trade.shares}</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Value</div>
                <div className="font-data text-lg font-medium">${(trade.entryPrice * trade.shares).toFixed(2)}</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
                <div className="font-data text-lg font-medium">{trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : '-'}</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Take Profit</div>
                <div className="font-data text-lg font-medium">{trade.takeProfit ? `$${trade.takeProfit.toFixed(2)}` : '-'}</div>
              </div>
              <div className="p-4 col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Strategy</div>
                <div className="font-medium">{trade.strategy || '-'}</div>
              </div>
            </div>
            
            <div className="p-6 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Thesis & Notes</div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 bg-secondary/30 p-4 rounded-md border border-border">
                {trade.notes || 'No notes recorded.'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          {trade.status === 'open' && !isClosing ? (
            <Card className="bg-card border-border sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Manage Position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setIsClosing(true)}>
                  Close Trade
                </Button>
                {/* Edit could go here, but omitted for simplicity to focus on closing flow */}
              </CardContent>
            </Card>
          ) : trade.status === 'open' && isClosing ? (
            <Card className="bg-card border-primary border-2 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Close Position</CardTitle>
                <CardDescription>Record exit price to calculate PnL.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onConfirmClose)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="exitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} className="font-data border-primary/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Why did you exit? Did you follow your plan?" 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsClosing(false)}>Cancel</Button>
                      <Button type="submit" className="flex-1" disabled={updateTrade.isPending}>
                        Confirm Close
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
