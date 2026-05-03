import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart2,
  Briefcase,
  Search,
  LayoutDashboard,
  X,
  Menu,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStocks } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/watchlist", label: "Watchlist", icon: Activity },
  { path: "/trades", label: "Trades", icon: Briefcase },
  { path: "/chart/RELIANCE", label: "Charts", icon: BarChart2 },
];

function GlobalSearch({ onClose }: { onClose?: () => void }) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useSearchStocks(
    { q: query },
    { query: { enabled: query.length > 1 } }
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery("");
    onClose?.();
    navigate(`/chart/${symbol}`);
  };

  const currencyFlag = (currency: string) =>
    currency === "INR" ? "🇮🇳" : "🇺🇸";

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          type="text"
          placeholder="Search stocks (RELIANCE, TCS, AAPL…)"
          className="w-full bg-secondary border-none rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          onKeyDown={e => {
            if (e.key === "Escape") {
              setQuery("");
              onClose?.();
            }
            if (e.key === "Enter" && results?.length) {
              handleSelect(results[0].symbol);
            }
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {query.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-xl z-[100] max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Searching…</div>
          ) : results?.length ? (
            results.map(r => (
              <button
                key={r.symbol}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border/50 last:border-0"
                onClick={() => handleSelect(r.symbol)}
              >
                <span className="text-base">{currencyFlag(r.currency)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{r.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-muted-foreground font-data">{r.exchange}</div>
                  <div className="text-[10px] text-muted-foreground">{r.sector}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dark">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {/* Overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "border-r border-border flex flex-col bg-card z-50 transition-all duration-200",
        "fixed md:relative h-full",
        mobileSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:w-16 lg:w-64"
      )}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight lg:block hidden">SwingEdge</span>
            <span className="font-bold text-lg tracking-tight md:hidden">{mobileSidebarOpen ? "SwingEdge" : ""}</span>
          </div>
          {mobileSidebarOpen && (
            <button
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path.split("/").slice(0, 2).join("/")));
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                  isActive
                    ? "bg-secondary text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm lg:block md:hidden">{item.label}</span>
                {mobileSidebarOpen && <span className="text-sm md:block">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border lg:block hidden">
          <div className="text-xs text-muted-foreground font-data">
            SYS.OP. NORMAL
            <br />
            v0.2.0-alpha
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-background flex items-center px-3 md:px-4 gap-3 shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search — full width on mobile, fixed width on desktop */}
          {mobileSearchOpen ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1">
                <GlobalSearch onClose={() => setMobileSearchOpen(false)} />
              </div>
              <button
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Mobile search button */}
              <button
                className="md:hidden shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop search */}
              <div className="hidden md:block w-72 lg:w-96">
                <GlobalSearch />
              </div>

              {/* Market ticker */}
              <div className="flex items-center gap-3 ml-auto font-data text-xs">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-muted-foreground">SENSEX</span>
                  <span className="text-bullish">72,841</span>
                  <span className="text-bullish">+0.8%</span>
                </div>
                <div className="w-px h-4 bg-border hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-muted-foreground">NIFTY</span>
                  <span className="text-bullish">22,104</span>
                  <span className="text-bullish">+0.6%</span>
                </div>
                <div className="w-px h-4 bg-border hidden lg:block" />
                <div className="hidden lg:flex items-center gap-1.5">
                  <span className="text-muted-foreground">SPY</span>
                  <span className="text-bullish">512.42</span>
                  <span className="text-bullish">+1.2%</span>
                </div>
              </div>

              {/* Mobile: show symbol for current chart page */}
              <span className="ml-auto text-xs text-muted-foreground md:hidden font-data">
                {location.startsWith("/chart/") ? location.split("/")[2] : ""}
              </span>
            </>
          )}
        </header>

        <div className="flex-1 overflow-auto p-3 md:p-4 lg:p-6 bg-background">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden border-t border-border bg-card flex items-center justify-around py-2 shrink-0">
          {NAV_ITEMS.map(item => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path.split("/").slice(0, 2).join("/")));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
