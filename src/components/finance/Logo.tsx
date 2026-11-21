import { Wallet } from "lucide-react";

export function Logo({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-brand shadow-elevated">
        <Wallet className="size-5 text-primary-foreground" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
          SpendSmart
        </p>
        {showTagline && (
          <p className="text-[11px] font-medium text-sidebar-muted">Take Control. Spend Smarter.</p>
        )}
      </div>
    </div>
  );
}
