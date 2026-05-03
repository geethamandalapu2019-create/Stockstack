import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 text-center">
      <div className="font-data text-6xl font-bold text-muted-foreground/30">404</div>
      <h1 className="text-2xl font-bold tracking-tight">Signal Not Found</h1>
      <p className="text-muted-foreground max-w-md">
        The page or symbol you're looking for doesn't exist or is unavailable.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
