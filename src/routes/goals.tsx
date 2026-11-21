import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Minus, Pencil, PiggyBank, Plus, Target, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { EmptyState } from "@/components/finance/EmptyState";
import { GoalAmountDialog, GoalDialog } from "@/components/finance/GoalDialogs";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { goalPercent, isGoalComplete, monthsUntil, totalSaved, totalTarget } from "@/lib/finance/calculations";
import { daysBetween, formatDate, parseISODate } from "@/lib/finance/dates";
import { formatINR, formatINRWhole, formatPercent } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import type { SavingsGoal } from "@/lib/finance/types";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Savings Goals — SpendSmart" },
      { name: "description", content: "Create savings goals, set targets and track your progress." },
      { property: "og:title", content: "Savings Goals — SpendSmart" },
      { property: "og:description", content: "Create savings goals, set targets and track your progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data } = useFinance();
  const saved = totalSaved(data.goals);
  const target = totalTarget(data.goals);
  const completed = data.goals.filter(isGoalComplete).length;
  const addButton = (
    <GoalDialog trigger={<Button variant="brand" size="lg"><Plus /> New goal</Button>} />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Savings Goals" description="Save with purpose — track every goal to the finish line." actions={addButton} />
      {data.goals.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No savings goals yet" description="Create a goal like a new laptop or a trip with friends, then add money as you save." action={addButton} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total saved" value={formatINR(saved)} icon={PiggyBank} tone="success" hint={`of ${formatINRWhole(target)} across all goals`} />
            <StatCard label="Overall progress" value={formatPercent(target > 0 ? saved / target : 0)} icon={Target} tone="primary" hint={`${formatINRWhole(Math.max(0, target - saved))} still to save`} />
            <StatCard label="Goals completed" value={`${completed} / ${data.goals.length}`} icon={Trophy} tone="teal" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.goals.map((g) => <GoalCard key={g.id} goal={g} />)}
          </div>
        </>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const { actions } = useFinance();
  const today = new Date();
  const done = isGoalComplete(goal);
  const daysLeft = goal.deadline ? daysBetween(today, parseISODate(goal.deadline)) : null;
  const perMonth = goal.deadline && !done ? (goal.target - goal.saved) / monthsUntil(goal.deadline, today) : null;

  return (
    <Card className="animate-rise flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{goal.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {goal.deadline
              ? `${formatDate(goal.deadline)} · ${daysLeft !== null && daysLeft < 0 ? "deadline passed" : `${daysLeft} days left`}`
              : "No deadline"}
          </p>
        </div>
        {done && <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Completed</span>}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold tabular-nums">
        {formatINR(goal.saved)}
        <span className="text-sm font-medium text-muted-foreground"> / {formatINR(goal.target)}</span>
      </p>
      <Progress value={goalPercent(goal)} className="mt-3 h-2.5" indicatorClassName={done ? "bg-success" : "bg-brand"} />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(goalPercent(goal))}% saved</span>
        <span>{done ? "Goal reached 🎉" : `${formatINRWhole(goal.target - goal.saved)} to go`}</span>
      </div>
      {perMonth !== null && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Save about <span className="font-semibold text-foreground">{formatINRWhole(perMonth)}/month</span> to hit your date.
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <GoalAmountDialog goal={goal} mode="deposit" trigger={<Button variant="brand" size="sm" disabled={done}><Plus /> Add money</Button>} />
        <GoalAmountDialog goal={goal} mode="withdraw" trigger={<Button variant="outline" size="sm" disabled={goal.saved <= 0}><Minus /> Withdraw</Button>} />
        <div className="ml-auto flex">
          <GoalDialog goal={goal} trigger={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" aria-label={`Edit ${goal.name}`}><Pencil /></Button>} />
          <ConfirmDialog
            destructive
            title="Delete this goal?"
            description={`“${goal.name}” and its ${formatINR(goal.saved)} saved progress will be removed.`}
            confirmLabel="Delete goal"
            onConfirm={() => {
              actions.deleteGoal(goal.id);
              toast.success("Goal deleted", { description: goal.name });
            }}
            trigger={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-destructive-soft hover:text-destructive" aria-label={`Delete ${goal.name}`}><Trash2 /></Button>}
          />
        </div>
      </div>
    </Card>
  );
}
