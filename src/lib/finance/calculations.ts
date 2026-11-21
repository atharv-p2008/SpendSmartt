import {
  daysBetween,
  daysInMonthKey,
  formatMonthKey,
  monthKeyFromDate,
  parseISODate,
  shiftMonthKey,
} from "./dates";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  type Category,
  type FinanceData,
  type PaymentMethod,
  type SavingsGoal,
  type Transaction,
} from "./types";

/** Spending at or above this share of the budget triggers a warning. */
export const BUDGET_WARNING_RATIO = 0.8;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumAmounts(txs: readonly Transaction[]): number {
  return round2(txs.reduce((sum, t) => sum + t.amount, 0));
}

export function transactionsInMonth(txs: readonly Transaction[], monthKey: string): Transaction[] {
  return txs.filter((t) => t.date.startsWith(monthKey));
}

export function sortByDateDesc(txs: readonly Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

export type BudgetLevel = "unset" | "safe" | "warning" | "over";

export interface BudgetStatus {
  level: BudgetLevel;
  /** spent / budget (unbounded) */
  ratio: number;
  /** ratio as a 0–100 number, capped at 100 for progress bars */
  percent: number;
  remaining: number;
}

export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (!(budget > 0)) return { level: "unset", ratio: 0, percent: 0, remaining: 0 };
  const ratio = spent / budget;
  const level: BudgetLevel =
    ratio >= 1 ? "over" : ratio >= BUDGET_WARNING_RATIO ? "warning" : "safe";
  return { level, ratio, percent: Math.min(100, ratio * 100), remaining: round2(budget - spent) };
}

export interface CategoryTotal {
  category: Category;
  amount: number;
  count: number;
  share: number;
}

export function spendingByCategory(txs: readonly Transaction[]): CategoryTotal[] {
  const total = sumAmounts(txs);
  return CATEGORIES.map((category) => {
    const items = txs.filter((t) => t.category === category);
    const amount = sumAmounts(items);
    return { category, amount, count: items.length, share: total > 0 ? amount / total : 0 };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.amount - a.amount);
}

export interface MethodTotal {
  method: PaymentMethod;
  amount: number;
  count: number;
  share: number;
}

export function spendingByPaymentMethod(txs: readonly Transaction[]): MethodTotal[] {
  const total = sumAmounts(txs);
  return PAYMENT_METHODS.map((method) => {
    const items = txs.filter((t) => t.paymentMethod === method);
    const amount = sumAmounts(items);
    return { method, amount, count: items.length, share: total > 0 ? amount / total : 0 };
  })
    .filter((m) => m.count > 0)
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthTotal {
  key: string;
  label: string;
  total: number;
  count: number;
}

export function monthlyTotals(
  txs: readonly Transaction[],
  endMonthKey: string,
  months = 6,
): MonthTotal[] {
  const out: MonthTotal[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = shiftMonthKey(endMonthKey, -i);
    const items = transactionsInMonth(txs, key);
    out.push({ key, label: formatMonthKey(key), total: sumAmounts(items), count: items.length });
  }
  return out;
}

export interface MonthProgress {
  daysInMonth: number;
  daysElapsed: number;
  /** Days still available to spend, including today */
  daysLeft: number;
  isCurrent: boolean;
}

export function getMonthProgress(monthKey: string, today: Date): MonthProgress {
  const currentKey = monthKeyFromDate(today);
  const daysInMonth = daysInMonthKey(monthKey);
  if (monthKey === currentKey) {
    const daysElapsed = today.getDate();
    return { daysInMonth, daysElapsed, daysLeft: daysInMonth - daysElapsed + 1, isCurrent: true };
  }
  if (monthKey < currentKey) {
    return { daysInMonth, daysElapsed: daysInMonth, daysLeft: 0, isCurrent: false };
  }
  return { daysInMonth, daysElapsed: 0, daysLeft: daysInMonth, isCurrent: false };
}

export interface DailyPoint {
  day: number;
  amount: number;
  cumulative: number;
}

export function dailyCumulative(
  txs: readonly Transaction[],
  monthKey: string,
  today: Date,
): DailyPoint[] {
  const { daysElapsed } = getMonthProgress(monthKey, today);
  const items = transactionsInMonth(txs, monthKey);
  const points: DailyPoint[] = [];
  let running = 0;
  for (let day = 1; day <= daysElapsed; day++) {
    const amount = sumAmounts(items.filter((t) => Number(t.date.slice(8, 10)) === day));
    running = round2(running + amount);
    points.push({ day, amount, cumulative: running });
  }
  return points;
}

export interface MonthSummary {
  monthKey: string;
  spent: number;
  budget: number;
  count: number;
  status: BudgetStatus;
  dailyAverage: number;
  projected: number;
  /** Amount per remaining day that keeps spending within budget */
  safeDailySpend: number;
  progress: MonthProgress;
}

export function getMonthSummary(data: FinanceData, monthKey: string, today: Date): MonthSummary {
  const items = transactionsInMonth(data.transactions, monthKey);
  const spent = sumAmounts(items);
  const progress = getMonthProgress(monthKey, today);
  const dailyAverage = progress.daysElapsed > 0 ? round2(spent / progress.daysElapsed) : 0;
  const projected = progress.isCurrent ? round2(dailyAverage * progress.daysInMonth) : spent;
  const status = getBudgetStatus(spent, data.monthlyBudget);
  const safeDailySpend =
    progress.daysLeft > 0 && status.remaining > 0 ? round2(status.remaining / progress.daysLeft) : 0;
  return {
    monthKey,
    spent,
    budget: data.monthlyBudget,
    count: items.length,
    status,
    dailyAverage,
    projected,
    safeDailySpend,
    progress,
  };
}

export function totalSaved(goals: readonly SavingsGoal[]): number {
  return round2(goals.reduce((sum, g) => sum + g.saved, 0));
}

export function totalTarget(goals: readonly SavingsGoal[]): number {
  return round2(goals.reduce((sum, g) => sum + g.target, 0));
}

export function goalPercent(goal: SavingsGoal): number {
  return goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
}

export function isGoalComplete(goal: SavingsGoal): boolean {
  return goal.saved >= goal.target;
}

/** Months remaining until a deadline, at least 1 (used for "save ₹X/month"). */
export function monthsUntil(deadline: string, today: Date): number {
  const days = daysBetween(today, parseISODate(deadline));
  return Math.max(1, Math.ceil(days / 30.44));
}

/** Month keys that have transactions, newest first, always including the current month. */
export function availableMonthKeys(txs: readonly Transaction[], today: Date): string[] {
  const keys = new Set(txs.map((t) => t.date.slice(0, 7)));
  keys.add(monthKeyFromDate(today));
  return [...keys].sort().reverse();
}
