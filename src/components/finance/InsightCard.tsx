import { AlertTriangle, ChevronDown, CircleAlert, CircleCheck, Info } from "lucide-react";

import type { Insight, InsightTone } from "@/lib/finance/insights";
import { cn } from "@/lib/utils";

const TONE: Record<InsightTone, { icon: typeof Info; chip: string; label: string }> = {
  alert: { icon: CircleAlert, chip: "bg-destructive-soft text-destructive", label: "Needs attention" },
  warning: { icon: AlertTriangle, chip: "bg-warning-soft text-warning-foreground", label: "Heads up" },
  positive: { icon: CircleCheck, chip: "bg-success-soft text-success", label: "Good news" },
  info: { icon: Info, chip: "bg-primary-soft text-primary", label: "Observation" },
};

export function InsightCard({ insight, compact = false }: { insight: Insight; compact?: boolean }) {
  const tone = TONE[insight.tone];
  const Icon = tone.icon;
  return (
    <div className={cn("flex gap-3", !compact && "rounded-2xl border border-border/70 bg-card p-5 shadow-card")}>
      <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone.chip)}>
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tone.label}</p>
        )}
        <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "mt-0.5 text-[15px]")}>{insight.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
        {!compact && (
          <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-primary [&::-webkit-details-marker]:hidden">
              How this is calculated
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{insight.rule}</p>
          </details>
        )}
      </div>
    </div>
  );
}
