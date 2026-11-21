import { formatINR } from "@/lib/finance/format";

interface ChartTooltipProps {
  active?: boolean;
  title?: string | undefined;
  rows: { label: string; value: number; color?: string }[];
}

export function ChartTooltip({ active, title, rows }: ChartTooltipProps) {
  if (!active || rows.length === 0) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-card">
      {title && <p className="mb-1 font-semibold text-foreground">{title}</p>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-semibold tabular-nums text-foreground">{formatINR(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
