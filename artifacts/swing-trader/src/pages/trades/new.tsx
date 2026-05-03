import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTrade, CreateTradeBodySide } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  name: z.string().min(1, "Company name is required"),
  side: z.enum(["long", "short"]),
  entryPrice: z.coerce.number().positive("Must be greater than 0"),
  shares: z.coerce.number().positive("Must be greater than 0"),
  entryDate: z.string().min(1, "Entry date is required"),
  stopLoss: z.coerce.number().optional().or(z.literal("")),
  takeProfit: z.coerce.number().optional().or(z.literal("")),
  strategy: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTrade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTrade = useCreateTrade();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: "",
      name: "",
      side: "long",
      entryPrice: undefined,
      shares: undefined,
      entryDate: new Date().toISOString().split("T")[0],
      stopLoss: "",
      takeProfit: "",
      strategy: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    // Process optional number fields correctly
    const payload = {
      ...values,
      stopLoss: values.stopLoss === "" ? null : Number(values.stopLoss),
      takeProfit: values.takeProfit === "" ? null : Number(values.takeProfit),
      notes: values.notes || null,
      strategy: values.strategy || null,
    };

    createTrade.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast({ title: "Trade logged", description: "Successfully created a new trade entry." });
        setLocation("/trades");
      },
      onError: (err) => {
        toast({ title: "Error", description: "Failed to create trade.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" className="text-muted-foreground -ml-4" onClick={() => setLocation("/trades")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trades
      </Button>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Log New Trade</CardTitle>
          <CardDescription>Record entry parameters and thesis for a new position.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="RELIANCE" {...field} className="uppercase font-data" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Reliance Industries Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="side"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Side</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-medium">
                            <SelectValue placeholder="Select side" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="long" className="text-bullish font-medium">LONG</SelectItem>
                          <SelectItem value="short" className="text-bearish font-medium">SHORT</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} className="font-data" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shares / Size</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="100" {...field} className="font-data" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stopLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} className="font-data" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="takeProfit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Take Profit</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} className="font-data" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MACD Crossover, Bounce off SMA50" {...field} />
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
                    <FormLabel>Thesis / Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Why are you taking this trade? What are the technical signals confirming this?" 
                        className="min-h-[120px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setLocation("/trades")}>Cancel</Button>
                <Button type="submit" disabled={createTrade.isPending}>
                  {createTrade.isPending ? "Saving..." : "Log Trade"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
