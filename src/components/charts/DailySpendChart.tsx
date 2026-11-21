import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { DailyPoint } from "@/lib/finance/calculations";
import { formatINRCompact } from "@/lib/finance/format";

export function DailySpendChart({ data, budget, height = 260 }: { data: DailyPoint[]; budget: number; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(v: number) => formatINRCompact(v)}
            domain={[0, (max: number) => Math.max(max, budget) * 1.05]}
          />
          <Tooltip
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as DailyPoint | undefined;
              return (
                <ChartTooltip
                  active={Boolean(active)}
                  title={item ? `Day ${item.day}` : undefined}
                  rows={item ? [
                    { label: "Spent that day", value: item.amount, color: "var(--primary)" },
                    { label: "Month to date", value: item.cumulative, color: "var(--teal)" },
                  ] : []}
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
              label={{ value: "Budget", position: "insideTopLeft", fill: "var(--warning-foreground)", fontSize: 11 }}
            />
          )}
          <Area type="monotone" dataKey="cumulative" stroke="var(--teal)" strokeWidth={2.5} fill="url(#dailyFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
