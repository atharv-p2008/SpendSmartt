import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { CATEGORY_META } from "@/lib/finance/categories";
import type { CategoryTotal } from "@/lib/finance/calculations";
import { formatINRWhole } from "@/lib/finance/format";
import type { Category } from "@/lib/finance/types";

interface CategoryDonutProps {
  data: CategoryTotal[];
  selected?: Category | null;
  onSelect?: (category: Category | null) => void;
  height?: number;
}

export function CategoryDonut({ data, selected = null, onSelect, height = 240 }: CategoryDonutProps) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const focus = selected ? data.find((d) => d.category === selected) : undefined;

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius="64%"
            outerRadius="94%"
            paddingAngle={2}
            cornerRadius={6}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive
            onClick={(_, index) => {
              const cat = data[index]?.category ?? null;
              onSelect?.(cat === selected ? null : cat);
            }}
          >
            {data.map((d) => (
              <Cell
                key={d.category}
                fill={CATEGORY_META[d.category].color}
                fillOpacity={selected && selected !== d.category ? 0.3 : 1}
                style={{ cursor: onSelect ? "pointer" : "default" }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              const p = payload?.[0];
              const item = p?.payload as CategoryTotal | undefined;
              return (
                <ChartTooltip
                  active={Boolean(active)}
                  title={item?.category}
                  rows={item ? [{ label: `${Math.round(item.share * 100)}% of total`, value: item.amount, color: CATEGORY_META[item.category].color }] : []}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xs font-medium text-muted-foreground">{focus ? focus.category : "Total spent"}</p>
        <p className="font-display text-xl font-semibold tabular-nums text-foreground">
          {formatINRWhole(focus ? focus.amount : total)}
        </p>
        {focus && <p className="text-xs text-muted-foreground">{Math.round(focus.share * 100)}% of month</p>}
      </div>
    </div>
  );
}
