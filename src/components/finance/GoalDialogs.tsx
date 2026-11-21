import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { FormField, RupeeInputWrap } from "@/components/finance/FormField";
import { Button } from "@/components/ui/button";
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
import { toISODate } from "@/lib/finance/dates";
import { formatINR } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import type { SavingsGoal } from "@/lib/finance/types";
import {
  MAX_GOAL_AMOUNT,
  parseAmount,
  validateGoal,
  type FormErrors,
  type GoalFormValues,
} from "@/lib/finance/validation";

function goalValues(goal?: SavingsGoal): GoalFormValues {
  return goal
    ? { name: goal.name, target: String(goal.target), saved: String(goal.saved), deadline: goal.deadline ?? "" }
    : { name: "", target: "", saved: "", deadline: "" };
}

export function GoalDialog({ trigger, goal }: { trigger: ReactNode; goal?: SavingsGoal }) {
  const { actions } = useFinance();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<GoalFormValues>(() => goalValues(goal));
  const [errors, setErrors] = useState<FormErrors<GoalFormValues>>({});

  function handleOpenChange(next: boolean) {
    if (next) {
      setValues(goalValues(goal));
      setErrors({});
    }
    setOpen(next);
  }

  function set(key: keyof GoalFormValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Editing keeps an existing (possibly past) deadline valid.
    const keepsDeadline = Boolean(goal?.deadline && goal.deadline === values.deadline);
    const result = validateGoal(values, { allowPastDeadline: keepsDeadline });
    if (!result.data) {
      setErrors(result.errors);
      return;
    }
    if (goal) {
      actions.updateGoal(goal.id, result.data);
      toast.success("Goal updated", { description: result.data.name });
    } else {
      actions.addGoal(result.data);
      toast.success("Savings goal created", { description: `${result.data.name} · target ${formatINR(result.data.target)}` });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{goal ? "Edit goal" : "New savings goal"}</DialogTitle>
          <DialogDescription>
            {goal ? "Change the name, target or deadline." : "Name what you're saving for and how much you need."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField id="goal-name" label="Goal name" error={errors.name}>
            <Input
              id="goal-name"
              placeholder="e.g. New laptop"
              maxLength={40}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="goal-target" label="Target amount" error={errors.target}>
              <RupeeInputWrap>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  placeholder="10000"
                  className="pl-7 tabular-nums"
                  value={values.target}
                  onChange={(e) => set("target", e.target.value)}
                  aria-invalid={Boolean(errors.target)}
                />
              </RupeeInputWrap>
            </FormField>
            <FormField id="goal-saved" label="Already saved" error={errors.saved} hint="Optional">
              <RupeeInputWrap>
                <Input
                  id="goal-saved"
                  inputMode="decimal"
                  placeholder="0"
                  className="pl-7 tabular-nums"
                  value={values.saved}
                  onChange={(e) => set("saved", e.target.value)}
                  aria-invalid={Boolean(errors.saved)}
                />
              </RupeeInputWrap>
            </FormField>
          </div>
          <FormField id="goal-deadline" label="Target date" error={errors.deadline} hint="Optional — used to suggest a monthly saving amount">
            <Input
              id="goal-deadline"
              type="date"
              min={toISODate(new Date())}
              value={values.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              aria-invalid={Boolean(errors.deadline)}
            />
          </FormField>
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand">
              {goal ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalAmountDialog({
  goal,
  mode,
  trigger,
}: {
  goal: SavingsGoal;
  mode: "deposit" | "withdraw";
  trigger: ReactNode;
}) {
  const { actions } = useFinance();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const deposit = mode === "deposit";
  const max = deposit ? Math.max(0, goal.target - goal.saved) : goal.saved;

  function handleOpenChange(next: boolean) {
    if (next) {
      setAmount("");
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAmount(amount, { max: MAX_GOAL_AMOUNT });
    if (parsed.value === null) return setError(parsed.error);
    if (parsed.value > max) {
      return setError(
        deposit
          ? `Only ${formatINR(max)} left to reach this goal`
          : `You can withdraw at most ${formatINR(max)}`,
      );
    }
    actions.adjustGoalSaved(goal.id, deposit ? parsed.value : -parsed.value);
    toast.success(deposit ? `${formatINR(parsed.value)} added to “${goal.name}”` : `${formatINR(parsed.value)} withdrawn from “${goal.name}”`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{deposit ? "Add savings" : "Withdraw savings"}</DialogTitle>
          <DialogDescription>
            {goal.name} · {formatINR(goal.saved)} of {formatINR(goal.target)} saved
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField
            id={`goal-amount-${goal.id}`}
            label="Amount"
            error={error ?? undefined}
            hint={deposit ? `Up to ${formatINR(max)} to complete this goal` : `Up to ${formatINR(max)} available`}
          >
            <RupeeInputWrap>
              <Input
                id={`goal-amount-${goal.id}`}
                autoFocus
                inputMode="decimal"
                placeholder="500"
                className="pl-7 tabular-nums"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
              />
            </RupeeInputWrap>
          </FormField>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={deposit ? "brand" : "default"}>
              {deposit ? "Add to goal" : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
