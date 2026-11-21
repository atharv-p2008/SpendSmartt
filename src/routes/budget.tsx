import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Gauge, Pencil, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { BudgetAlert, BudgetBar, LEVEL_STYLES } from "@/components/finance/budget-ui";
import { CategoryIcon } from "@/components/finance/CategoryIcon";
import { FormField, RupeeInputWrap } from "@/components/finance/FormField";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BUDGET_WARNING_RATIO,
  getBudgetStatus,
  getMonthSummary,
  sumAmounts,
  transactionsInMonth,
} from "@/lib/finance/calculations";
import { formatMonthKey, monthKeyFromDate } from "@/lib/finance/dates";
import { formatINR, formatINRWhole, formatPercent } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import { CATEGORIES, type Category } from "@/lib/finance/types";
import { MAX_TRANSACTION_AMOUNT, parseAmount } from "@/lib/finance/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budget — SpendSmart" },
      { name: "description", content: "Set a monthly budget and category limits, and get warned before you overspend." },
      { property: "og:title", content: "Budget — SpendSmart" },
      { property: "og:description", content: "Set a monthly budget and category limits, and get warned before you overspend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BudgetPage,
});

const PRESETS = [5000, 8000, 10000, 15000];

function BudgetPage() {
  const { data, actions } = useFinance();
  const today = new Date();
  const monthKey = monthKeyFromDate(today);
  const summary = getMonthSummary(data, monthKey, today);
  const monthTx = transactionsInMonth(data.transactions, monthKey);
  const [amount, setAmount] = useState(data.monthlyBudget > 0 ? String(data.monthlyBudget) : "");
  const [error, setError] = useState<string | null>(null);

  function saveBudget(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAmount(amount, { max: MAX_TRANSACTION_AMOUNT, label: "Budget" });
    if (parsed.value === null) return setError(parsed.error);
    actions.setMonthlyBudget(parsed.value);
    setAmount(String(parsed.value));
    toast.success(`Monthly budget set to ${formatINR(parsed.value)}`);
  }

  const { status } = summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        description={`Plan your spending for ${formatMonthKey(monthKey, "long")}. You'll be warned at ${formatPercent(BUDGET_WARNING_RATIO)} and when you go over.`}
      />

      <BudgetAlert status={status} spent={summary.spent} budget={summary.budget} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly budget</CardTitle>
            <p className="text-sm text-muted-foreground">How much you plan to spend each month, e.g. your allowance.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveBudget} noValidate className="space-y-4">
              <FormField id="budget-amount" label="Budget amount" error={error ?? undefined}>
                <RupeeInputWrap>
                  <Input
                    id="budget-amount"
                    inputMode="decimal"
                    placeholder="10000"
                    className="h-11 pl-7 text-base tabular-nums"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                    aria-invalid={Boolean(error)}
                  />
                </RupeeInputWrap>
              </FormField>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAmount(String(p));
                      setError(null);
                    }}
                  >
                    {formatINRWhole(p)}
                  </Button>
                ))}
              </div>
              <Button type="submit" variant="brand" className="w-full">
                Save budget
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Spending progress</CardTitle>
            <p className="text-sm text-muted-foreground">{formatMonthKey(monthKey, "long")}</p>
          </CardHeader>
          <CardContent>
            {summary.budget > 0 ? (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="font-display text-4xl font-semibold tabular-nums">
                    {formatINRWhole(summary.spent)}
                    <span className="text-lg font-medium text-muted-foreground"> / {formatINRWhole(summary.budget)}</span>
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      status.level === "safe" && "bg-success-soft text-success",
                      status.level === "warning" && "bg-warning-soft text-warning-foreground",
                      status.level === "over" && "bg-destructive-soft text-destructive",
                    )}
                  >
                    {LEVEL_STYLES[status.level].label} · {formatPercent(status.ratio)}
                  </span>
                </div>
                <div className="relative mt-5">
                  <BudgetBar status={status} className="h-4" />
                  <div
                    className="absolute -top-1 h-6 w-0.5 rounded bg-warning"
                    style={{ left: `${BUDGET_WARNING_RATIO * 100}%` }}
                    title="Warning threshold"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>₹0</span>
                  <span>Warning at {formatPercent(BUDGET_WARNING_RATIO)}</span>
                  <span>{formatINRWhole(summary.budget)}</span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniStat label={status.remaining >= 0 ? "Remaining" : "Over by"} value={formatINR(Math.abs(status.remaining))} />
                  <MiniStat label="Safe daily spend" value={summary.safeDailySpend > 0 ? formatINRWhole(summary.safeDailySpend) : "₹0"} />
                  <MiniStat label="Projected month-end" value={formatINRWhole(summary.projected)} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Wallet className="size-6" />
                </div>
                <p className="mt-3 font-semibold">No budget set yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Enter an amount on the left. You've spent {formatINRWhole(summary.spent)} so far this month.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Days left this month" value={String(summary.progress.daysLeft)} icon={CalendarClock} tone="teal" hint={`Day ${summary.progress.daysElapsed} of ${summary.progress.daysInMonth}`} />
        <StatCard label="Daily average so far" value={formatINRWhole(summary.dailyAverage)} icon={Gauge} tone="primary" hint={`${summary.count} expenses this month`} />
        <StatCard
          label="Category limits set"
          value={String(Object.keys(data.categoryLimits).length)}
          icon={Wallet}
          tone="warning"
          hint="Optional caps per category"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category limits</CardTitle>
          <p className="text-sm text-muted-foreground">Optional caps for individual categories this month.</p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {CATEGORIES.map((category) => {
              const spent = sumAmounts(monthTx.filter((t) => t.category === category));
              const limit = data.categoryLimits[category] ?? 0;
              const catStatus = getBudgetStatus(spent, limit);
              return (
                <li key={category} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <CategoryIcon category={category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">{category}</p>
                        <p className="text-sm tabular-nums">
                          <span className="font-semibold">{formatINRWhole(spent)}</span>
                          <span className="text-muted-foreground">{limit > 0 ? ` / ${formatINRWhole(limit)}` : " spent"}</span>
                        </p>
                      </div>
                      {limit > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <BudgetBar status={catStatus} className="h-2" />
                          <span className={cn("w-10 text-right text-xs font-semibold tabular-nums", LEVEL_STYLES[catStatus.level].text)}>
                            {formatPercent(catStatus.ratio)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">No limit</p>
                      )}
                    </div>
                  </div>
                  <CategoryLimitDialog category={category} current={limit} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function CategoryLimitDialog({ category, current }: { category: Category; current: number }) {
  const { actions } = useFinance();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setValue(current > 0 ? String(current) : "");
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAmount(value, { max: MAX_TRANSACTION_AMOUNT, label: "Limit" });
    if (parsed.value === null) return setError(parsed.error);
    actions.setCategoryLimit(category, parsed.value);
    toast.success(`${category} limit set to ${formatINR(parsed.value)}`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={current > 0 ? "outline" : "soft"} size="sm" className="self-start sm:self-auto">
          <Pencil />
          {current > 0 ? "Edit limit" : "Set limit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{category} limit</DialogTitle>
          <DialogDescription>Maximum you want to spend on {category.toLowerCase()} each month.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField id={`limit-${category}`} label="Monthly limit" error={error ?? undefined}>
            <RupeeInputWrap>
              <Input
                id={`limit-${category}`}
                autoFocus
                inputMode="decimal"
                placeholder="2000"
                className="pl-7 tabular-nums"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
              />
            </RupeeInputWrap>
          </FormField>
          <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
            {current > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                onClick={() => {
                  actions.setCategoryLimit(category, null);
                  toast.success(`${category} limit removed`);
                  setOpen(false);
                }}
              >
                Remove limit
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" variant="brand">
              Save limit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
