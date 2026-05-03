import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart2, 
  Briefcase, 
  Search,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/watchlist", label: "Watchlist", icon: Activity },
  { path: "/trades", label: "Trades", icon: Briefcase },
  { path: "/chart/AAPL", label: "Charts", icon: BarChart2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dark">
      <aside className="w-16 md:w-64 border-r border-border flex flex-col bg-card">
        <div className="h-14 flex items-center justify-center md:justify-start px-0 md:px-4 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden md:block ml-3 font-bold text-lg tracking-tight">SwingEdge</span>
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                isActive 
                  ? "bg-secondary text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:block text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border hidden md:block">
          <div className="text-xs text-muted-foreground font-data">
            SYS.OP. NORMAL
            <br/>
            v0.1.0-alpha
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header for search and quick info */}
        <header className="h-14 border-b border-border bg-background flex items-center px-4 justify-between shrink-0">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search symbol (e.g. MSFT)..." 
              className="w-full bg-secondary border-none rounded-sm pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex items-center gap-4 font-data text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">SPY</span>
              <span className="text-bullish">512.42</span>
              <span className="text-bullish">+1.2%</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">QQQ</span>
              <span className="text-bullish">440.11</span>
              <span className="text-bullish">+1.5%</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
