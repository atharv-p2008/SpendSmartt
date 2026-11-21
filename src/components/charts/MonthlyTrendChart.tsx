import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { MonthTotal } from "@/lib/finance/calculations";
import { formatMonthKey } from "@/lib/finance/dates";
import { formatINRCompact } from "@/lib/finance/format";

interface MonthlyTrendChartProps {
  data: MonthTotal[];
  budget: number;
  selectedKey: string;
  onSelect?: (key: string) => void;
  height?: number;
}

export function MonthlyTrendChart({ data, budget, selectedKey, onSelect, height = 260 }: MonthlyTrendChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(v: number) => formatINRCompact(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", radius: 8 }}
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as MonthTotal | undefined;
              return (
                <ChartTooltip
                  active={Boolean(active)}
                  title={item ? formatMonthKey(item.key, "long") : undefined}
                  rows={
                    item
                      ? [
                          { label: `${item.count} expenses`, value: item.total, color: "var(--primary)" },
                          ...(budget > 0 ? [{ label: "Budget", value: budget, color: "var(--warning)" }] : []),
                        ]
                      : []
                  }
                />
              );
            }}
          />
          {budget > 0 && (
            <ReferenceLine
              y={budget}
              stroke="var(--warning)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: "Budget", position: "insideTopRight", fill: "var(--warning-foreground)", fontSize: 11 }}
            />
          )}
          <Bar
            dataKey="total"
            radius={[8, 8, 4, 4]}
            maxBarSize={44}
            onClick={(entry: { key?: string }) => entry.key && onSelect?.(entry.key)}
          >
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.key === selectedKey ? "var(--primary)" : "var(--bar-muted)"}
                style={{ cursor: onSelect ? "pointer" : "default" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
