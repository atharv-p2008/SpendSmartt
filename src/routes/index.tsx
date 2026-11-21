import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb, PiggyBank, Plus, ReceiptText, TrendingDown, Wallet } from "lucide-react";

import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { BudgetAlert, BudgetBar, LEVEL_STYLES } from "@/components/finance/budget-ui";
import { CategoryDot } from "@/components/finance/CategoryIcon";
import { EmptyState } from "@/components/finance/EmptyState";
import { InsightCard } from "@/components/finance/InsightCard";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { TransactionList } from "@/components/finance/TransactionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getMonthSummary,
  goalPercent,
  isGoalComplete,
  monthlyTotals,
  sortByDateDesc,
  spendingByCategory,
  totalSaved,
  transactionsInMonth,
} from "@/lib/finance/calculations";
import { CATEGORY_META } from "@/lib/finance/categories";
import { formatMonthKey, monthKeyFromDate } from "@/lib/finance/dates";
import { formatINR, formatINRWhole, formatPercent } from "@/lib/finance/format";
import { generateInsights } from "@/lib/finance/insights";
import { useFinance } from "@/lib/finance/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SpendSmart" },
      { name: "description", content: "Your monthly budget, expenses, remaining balance and savings at a glance." },
      { property: "og:title", content: "Dashboard — SpendSmart" },
      { property: "og:description", content: "Your monthly budget, expenses, remaining balance and savings at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function greeting(date: Date) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { data } = useFinance();
  const today = new Date();
  const monthKey = monthKeyFromDate(today);
  const summary = getMonthSummary(data, monthKey, today);
  const monthTx = transactionsInMonth(data.transactions, monthKey);
  const categories = spendingByCategory(monthTx).slice(0, 5);
  const recent = sortByDateDesc(data.transactions).slice(0, 6);
  const trend = monthlyTotals(data.transactions, monthKey, 6);
  const insights = generateInsights(data, today).slice(0, 3);
  const saved = totalSaved(data.goals);
  const activeGoals = data.goals.filter((g) => !isGoalComplete(g)).slice(0, 3);
  const { status } = summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting(today)} 👋`}
        description={`Here's your money snapshot for ${formatMonthKey(monthKey, "long")}.`}
        actions={
          <TransactionDialog
            trigger={
              <Button variant="brand" size="lg">
                <Plus />
                Add expense
              </Button>
            }
          />
        }
      />

      <BudgetAlert status={status} spent={summary.spent} budget={summary.budget} />

      {/* Hero balance card */}
      <div className="animate-rise relative overflow-hidden rounded-3xl bg-hero p-6 text-hero-foreground shadow-hero sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="text-sm font-medium text-hero-muted">Remaining this month</p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {summary.budget > 0 ? formatINR(status.remaining) : "—"}
            </p>
            <p className="mt-2 text-sm text-hero-muted">
              {summary.budget > 0
                ? status.remaining >= 0
                  ? `${formatINRWhole(summary.safeDailySpend)}/day keeps you on budget for the next ${summary.progress.daysLeft} days`
                  : "You've spent more than your budget this month"
                : "Set a monthly budget to track what's left"}
            </p>
          </div>
          <div className="rounded-2xl bg-hero-foreground/10 p-4 backdrop-blur">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-hero-muted">Spent</span>
              <span className="font-semibold tabular-nums">
                {formatINRWhole(summary.spent)}
                {summary.budget > 0 && <span className="font-normal text-hero-muted"> / {formatINRWhole(summary.budget)}</span>}
              </span>
            </div>
            {summary.budget > 0 ? (
              <>
                <BudgetBar status={status} className="mt-3 bg-hero-foreground/15" />
                <p className="mt-2 text-xs text-hero-muted">
                  {formatPercent(status.ratio)} used · {LEVEL_STYLES[status.level].label}
                </p>
              </>
            ) : (
              <Button asChild variant="secondary" size="sm" className="mt-3">
                <Link to="/budget">Set budget</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly budget"
          value={summary.budget > 0 ? formatINRWhole(summary.budget) : "Not set"}
          icon={Wallet}
          tone="primary"
          hint={<Link to="/budget" className="font-semibold text-primary hover:underline">{summary.budget > 0 ? "Adjust budget" : "Set a budget"}</Link>}
        />
        <StatCard
          label="Total expenses"
          value={formatINR(summary.spent)}
          icon={ReceiptText}
          tone="teal"
          hint={`${summary.count} transaction${summary.count === 1 ? "" : "s"} this month`}
        />
        <StatCard
          label="Remaining balance"
          value={summary.budget > 0 ? formatINR(status.remaining) : "—"}
          icon={TrendingDown}
          tone={status.level === "over" ? "destructive" : status.level === "warning" ? "warning" : "success"}
          hint={summary.budget > 0 ? `${formatPercent(Math.max(0, 1 - status.ratio))} of budget left` : "Needs a monthly budget"}
        />
        <StatCard
          label="Savings"
          value={formatINR(saved)}
          icon={PiggyBank}
          tone="success"
          hint={`Across ${data.goals.length} goal${data.goals.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Spending trend</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Last 6 months vs your budget</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/analytics">
                Analytics <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.transactions.length > 0 ? (
              <MonthlyTrendChart data={trend} budget={data.monthlyBudget} selectedKey={monthKey} height={240} />
            ) : (
              <EmptyState icon={ReceiptText} title="No spending yet" description="Your 6-month trend appears after you add expenses." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Where it went</CardTitle>
            <p className="text-sm text-muted-foreground">Top categories this month</p>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <ul className="space-y-4">
                {categories.map((c) => (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <CategoryDot category={c.category} />
                        {c.category}
                      </span>
                      <span className="font-semibold tabular-nums">{formatINRWhole(c.amount)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={c.share * 100} className="h-1.5" indicatorClassName={CATEGORY_META[c.category].dot} />
                      <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{formatPercent(c.share)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses recorded this month yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Your latest expenses</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/transactions">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {recent.length > 0 ? (
              <TransactionList transactions={recent} />
            ) : (
              <div className="pt-4">
                <EmptyState
                  icon={ReceiptText}
                  title="No transactions yet"
                  description="Add your first expense to start tracking where your money goes."
                  action={
                    <TransactionDialog trigger={<Button variant="brand"><Plus /> Add expense</Button>} />
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-4 text-teal" /> Smart insights
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/insights">
                  All <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length > 0 ? (
                insights.map((i) => <InsightCard key={i.id} insight={i} compact />)
              ) : (
                <p className="text-sm text-muted-foreground">Insights appear once you've added a few expenses.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="size-4 text-primary" /> Savings goals
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/goals">
                  Manage <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeGoals.length > 0 ? (
                activeGoals.map((g) => (
                  <div key={g.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{g.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatINRWhole(g.saved)} / {formatINRWhole(g.target)}
                      </span>
                    </div>
                    <Progress value={goalPercent(g)} className="mt-2 h-2" indicatorClassName="bg-brand" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {data.goals.length > 0 ? "All your goals are complete 🎉" : "No savings goals yet. Create one to start saving with purpose."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
