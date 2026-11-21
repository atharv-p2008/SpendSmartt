import { Wallet } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="grid size-12 animate-pulse place-items-center rounded-2xl bg-brand shadow-elevated">
          <Wallet className="size-6 text-primary-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading your finances…</p>
      </div>
    </div>
  );
}
