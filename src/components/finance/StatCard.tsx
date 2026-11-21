import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTone = "primary" | "teal" | "success" | "warning" | "destructive";

const TONE: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  teal: "bg-teal-soft text-teal",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: ReactNode;
}

export function StatCard({ label, value, icon: Icon, tone = "primary", hint }: StatCardProps) {
  return (
    <Card className="animate-rise p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TONE[tone])}>
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
