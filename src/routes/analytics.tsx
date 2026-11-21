import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChartPie, Hash, Plus, Receipt, TrendingUp } from "lucide-react";
import { useState } from "react";

import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { DailySpendChart } from "@/components/charts/DailySpendChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { CategoryIcon } from "@/components/finance/CategoryIcon";
import { EmptyState } from "@/components/finance/EmptyState";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  availableMonthKeys,
  dailyCumulative,
  getMonthSummary,
  monthlyTotals,
  spendingByCategory,
  spendingByPaymentMethod,
  transactionsInMonth,
} from "@/lib/finance/calculations";
import { formatMonthKey, formatShortDate, monthKeyFromDate } from "@/lib/finance/dates";
import { formatINR, formatINRWhole, formatPercent } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import type { Category } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SpendSmart" },
      { name: "description", content: "Interactive charts of category-wise spending and monthly spending trends." },
      { property: "og:title", content: "Analytics — SpendSmart" },
      { property: "og:description", content: "Interactive charts of category-wise spending and monthly spending trends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useFinance();
  const today = new Date();
  const currentKey = monthKeyFromDate(today);
  const [monthKey, setMonthKey] = useState(currentKey);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  if (data.transactions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="See where your money goes, month by month." />
        <EmptyState
          icon={ChartPie}
          title="Nothing to analyse yet"
          description="Charts are built from your expenses. Add a few to see category breakdowns and monthly trends."
          action={<TransactionDialog trigger={<Button variant="brand"><Plus /> Add expense</Button>} />}
        />
      </div>
    );
  }

  const months = availableMonthKeys(data.transactions, today);
  const monthTx = transactionsInMonth(data.transactions, monthKey);
  const summary = getMonthSummary(data, monthKey, today);
  const categories = spendingByCategory(monthTx);
  const methods = spendingByPaymentMethod(monthTx);
  const trendEnd = monthKey > currentKey ? monthKey : currentKey;
  const trend = monthlyTotals(data.transactions, trendEnd, 6);
  const daily = dailyCumulative(data.transactions, monthKey, today);
  const top = categories[0];
  const activeCategory = selectedCategory && categories.some((c) => c.category === selectedCategory) ? selectedCategory : null;
  const categoryTx = activeCategory
    ? monthTx.filter((t) => t.category === activeCategory).sort((a, b) => b.amount - a.amount).slice(0, 5)
    : [];

  function changeMonth(key: string) {
    setMonthKey(key);
    setSelectedCategory(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Click a month bar or a category slice to drill in."
        actions={
          <Select value={monthKey} onValueChange={changeMonth}>
            <SelectTrigger className="w-48" aria-label="Choose month">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonthKey(m, "long")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spent" value={formatINR(summary.spent)} icon={Receipt} tone="primary" hint={formatMonthKey(monthKey, "long")} />
        <StatCard label="Daily average" value={formatINRWhole(summary.dailyAverage)} icon={TrendingUp} tone="teal" hint={`Over ${summary.progress.daysElapsed} days`} />
        <StatCard label="Top category" value={top ? top.category : "—"} icon={ChartPie} tone="warning" hint={top ? `${formatINRWhole(top.amount)} · ${formatPercent(top.share)}` : "No expenses"} />
        <StatCard label="Transactions" value={String(summary.count)} icon={Hash} tone="success" hint={summary.count > 0 ? `Avg ${formatINRWhole(summary.spent / summary.count)} each` : "No expenses"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Spending by category</CardTitle>
            <p className="text-sm text-muted-foreground">{formatMonthKey(monthKey, "long")}</p>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <>
                <CategoryDonut data={categories} selected={activeCategory} onSelect={setSelectedCategory} />
                <ul className="mt-4 space-y-1">
                  {categories.map((c) => (
                    <li key={c.category}>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(activeCategory === c.category ? null : c.category)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                          activeCategory === c.category && "bg-muted",
                        )}
                        aria-pressed={activeCategory === c.category}
                      >
                        <CategoryIcon category={c.category} className="size-8 rounded-lg" />
                        <span className="flex-1 font-medium">{c.category}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{formatPercent(c.share)}</span>
                        <span className="w-20 text-right font-semibold tabular-nums">{formatINRWhole(c.amount)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No expenses in this month.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Monthly spending trend</CardTitle>
              <p className="text-sm text-muted-foreground">Six months ending {formatMonthKey(trendEnd, "long")} · dashed line is your budget</p>
            </CardHeader>
            <CardContent>
              <MonthlyTrendChart data={trend} budget={data.monthlyBudget} selectedKey={monthKey} onSelect={changeMonth} />
            </CardContent>
          </Card>

          {activeCategory ? (
            <Card className="animate-rise">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Top {activeCategory} expenses</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                  Show cumulative chart
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {categoryTx.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0 truncate font-medium">{t.description}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">{formatShortDate(t.date)}</span>
                        <span className="w-20 text-right font-semibold tabular-nums">{formatINR(t.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cumulative spending</CardTitle>
                <p className="text-sm text-muted-foreground">Day-by-day running total for {formatMonthKey(monthKey, "long")}</p>
              </CardHeader>
              <CardContent>
                {daily.length > 0 ? (
                  <DailySpendChart data={daily} budget={data.monthlyBudget} height={220} />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">This month hasn't started yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Payment methods</CardTitle>
          <p className="text-sm text-muted-foreground">How you paid in {formatMonthKey(monthKey, "long")}</p>
        </CardHeader>
        <CardContent>
          {methods.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {methods.map((m) => (
                <li key={m.method} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold">{m.method}</span>
                    <span className="text-xs text-muted-foreground">{m.count} payment{m.count === 1 ? "" : "s"}</span>
                  </div>
                  <p className="mt-1 font-display text-lg font-semibold tabular-nums">{formatINRWhole(m.amount)}</p>
                  <Progress value={m.share * 100} className="mt-2 h-1.5" indicatorClassName="bg-teal" />
                  <p className="mt-1 text-xs text-muted-foreground">{formatPercent(m.share)} of spending</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No payments in this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
