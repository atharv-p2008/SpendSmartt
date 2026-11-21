import { AlertTriangle, CircleAlert } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { BudgetLevel, BudgetStatus } from "@/lib/finance/calculations";
import { formatINRWhole, formatPercent } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const LEVEL_STYLES: Record<BudgetLevel, { bar: string; text: string; label: string }> = {
  unset: { bar: "bg-muted-foreground", text: "text-muted-foreground", label: "No budget set" },
  safe: { bar: "bg-success", text: "text-success", label: "On track" },
  warning: { bar: "bg-warning", text: "text-warning-foreground", label: "Approaching limit" },
  over: { bar: "bg-destructive", text: "text-destructive", label: "Over budget" },
};

export function BudgetBar({ status, className }: { status: BudgetStatus; className?: string }) {
  return (
    <Progress
      value={status.percent}
      className={cn("h-2.5", className)}
      indicatorClassName={LEVEL_STYLES[status.level].bar}
      aria-label={`${Math.round(status.ratio * 100)}% of budget used`}
    />
  );
}

export function BudgetAlert({
  status,
  spent,
  budget,
  scope = "monthly budget",
}: {
  status: BudgetStatus;
  spent: number;
  budget: number;
  scope?: string;
}) {
  if (status.level !== "warning" && status.level !== "over") return null;
  const over = status.level === "over";
  const Icon = over ? CircleAlert : AlertTriangle;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        over
          ? "border-destructive/30 bg-destructive-soft text-destructive"
          : "border-warning/40 bg-warning-soft text-warning-foreground",
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold">
          {over
            ? `You've exceeded your ${scope} by ${formatINRWhole(spent - budget)}`
            : `You've used ${formatPercent(status.ratio)} of your ${scope}`}
        </p>
        <p className="mt-0.5 opacity-90">
          {over
            ? `Spent ${formatINRWhole(spent)} of ${formatINRWhole(budget)}. Consider pausing non-essential spending until next month.`
            : `Only ${formatINRWhole(status.remaining)} left of ${formatINRWhole(budget)}. Slow down on non-essentials to stay on track.`}
        </p>
      </div>
    </div>
  );
}
