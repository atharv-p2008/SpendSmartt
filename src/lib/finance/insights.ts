/**
 * Smart Insights — transparent, rule-based observations.
 * Every insight is computed from the stored transactions with the rule
 * described in its `rule` field. No AI or external service is involved.
 */
import {
  getMonthSummary,
  isGoalComplete,
  monthsUntil,
  spendingByCategory,
  spendingByPaymentMethod,
  sumAmounts,
  transactionsInMonth,
} from "./calculations";
import { dayOfMonth, formatDate, monthKeyFromDate, parseISODate, shiftMonthKey } from "./dates";
import { formatINR, formatINRWhole, formatPercent } from "./format";
import { CATEGORIES, type FinanceData } from "./types";

export type InsightTone = "alert" | "warning" | "positive" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  /** Plain-language description of the rule that produced this insight */
  rule: string;
}

const TONE_ORDER: Record<InsightTone, number> = { alert: 0, warning: 1, positive: 2, info: 3 };

export const SMALL_PURCHASE_LIMIT = 150;

export function generateInsights(data: FinanceData, today: Date = new Date()): Insight[] {
  const insights: Insight[] = [];
  const txs = data.transactions;
  const key = monthKeyFromDate(today);
  const thisMonth = transactionsInMonth(txs, key);
  const summary = getMonthSummary(data, key, today);
  const { daysElapsed, daysLeft } = summary.progress;
  const budget = data.monthlyBudget;

  // 1. Budget pace
  if (budget > 0 && thisMonth.length > 0) {
    const rule =
      "Projection = (spent so far ÷ days elapsed) × days in the month, compared with your monthly budget.";
    if (summary.status.level === "over") {
      insights.push({
        id: "budget-over",
        tone: "alert",
        title: `You're ${formatINRWhole(-summary.status.remaining)} over your monthly budget`,
        detail: `You've spent ${formatINRWhole(summary.spent)} against a budget of ${formatINRWhole(budget)}, with ${Math.max(0, daysLeft - 1)} days still to go this month.`,
        rule,
      });
    } else if (daysElapsed >= 3 && summary.projected > budget) {
      insights.push({
        id: "budget-pace",
        tone: "warning",
        title: `On pace to overshoot your budget by ${formatINRWhole(summary.projected - budget)}`,
        detail: `At your current average of ${formatINRWhole(summary.dailyAverage)}/day you'll spend about ${formatINRWhole(summary.projected)} this month. Keep daily spending under ${formatINRWhole(summary.safeDailySpend)} to stay within ${formatINRWhole(budget)}.`,
        rule,
      });
    } else if (daysElapsed >= 3) {
      insights.push({
        id: "budget-on-track",
        tone: "positive",
        title: "On track to finish the month under budget",
        detail: `Projected month-end spending is ${formatINRWhole(summary.projected)}, leaving roughly ${formatINRWhole(budget - summary.projected)} of your ${formatINRWhole(budget)} budget.`,
        rule,
      });
    }
  }

  // 2. Top category this month
  const byCategory = spendingByCategory(thisMonth);
  const top = byCategory[0];
  if (top) {
    insights.push({
      id: "top-category",
      tone: "info",
      title: `${top.category} is your biggest expense this month`,
      detail: `${formatINRWhole(top.amount)} across ${top.count} transaction${top.count === 1 ? "" : "s"} — ${formatPercent(top.share)} of everything you've spent this month.`,
      rule: "The category with the highest total among this month's transactions.",
    });
  }

  // 3. Same-period comparison with last month
  const lastKey = shiftMonthKey(key, -1);
  const lastSamePeriod = transactionsInMonth(txs, lastKey).filter(
    (t) => dayOfMonth(t.date) <= daysElapsed,
  );
  const lastTotal = sumAmounts(lastSamePeriod);
  if (lastTotal > 0 && thisMonth.length > 0) {
    const change = (summary.spent - lastTotal) / lastTotal;
    const rule = `Compares spending from the 1st to day ${daysElapsed} of this month with the same days last month.`;
    if (Math.abs(change) < 0.05) {
      insights.push({
        id: "mom-flat",
        tone: "info",
        title: "Spending is steady compared with last month",
        detail: `${formatINRWhole(summary.spent)} so far vs ${formatINRWhole(lastTotal)} at this point last month.`,
        rule,
      });
    } else if (change > 0) {
      insights.push({
        id: "mom-up",
        tone: "warning",
        title: `Spending is up ${formatPercent(change)} vs last month`,
        detail: `${formatINRWhole(summary.spent)} so far vs ${formatINRWhole(lastTotal)} by day ${daysElapsed} last month — ${formatINRWhole(summary.spent - lastTotal)} more.`,
        rule,
      });
    } else {
      insights.push({
        id: "mom-down",
        tone: "positive",
        title: `Spending is down ${formatPercent(-change)} vs last month`,
        detail: `${formatINRWhole(summary.spent)} so far vs ${formatINRWhole(lastTotal)} by day ${daysElapsed} last month — you've saved ${formatINRWhole(lastTotal - summary.spent)}.`,
        rule,
      });
    }
  }

  // 4. Category spikes vs 3-month average
  const priorKeys = [1, 2, 3].map((i) => shiftMonthKey(key, -i));
  const priorMonthsWithData = priorKeys.filter((k) => transactionsInMonth(txs, k).length > 0);
  if (priorMonthsWithData.length >= 2) {
    const spikes = CATEGORIES.map((category) => {
      const current = sumAmounts(thisMonth.filter((t) => t.category === category));
      const priorTotal = priorMonthsWithData.reduce(
        (sum, k) =>
          sum + sumAmounts(transactionsInMonth(txs, k).filter((t) => t.category === category)),
        0,
      );
      const average = priorTotal / priorMonthsWithData.length;
      return { category, current, average, diff: current - average };
    })
      .filter((s) => s.average > 0 && s.current > s.average * 1.25 && s.diff >= 300)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 2);
    for (const s of spikes) {
      insights.push({
        id: `spike-${s.category}`,
        tone: "warning",
        title: `${s.category} spending is ${formatPercent(s.diff / s.average)} above your usual`,
        detail: `You've already spent ${formatINRWhole(s.current)} on ${s.category.toLowerCase()} this month, compared with a typical ${formatINRWhole(s.average)} for a whole month.`,
        rule: `This month's ${s.category} total (so far) is more than 25% and ₹300 above its average over the previous ${priorMonthsWithData.length} months with data.`,
      });
    }
  }

  // 5. Category limits
  for (const category of CATEGORIES) {
    const limit = data.categoryLimits[category];
    if (!limit || limit <= 0) continue;
    const spent = sumAmounts(thisMonth.filter((t) => t.category === category));
    const ratio = spent / limit;
    if (ratio >= 1) {
      insights.push({
        id: `limit-over-${category}`,
        tone: "alert",
        title: `${category} limit exceeded`,
        detail: `${formatINRWhole(spent)} spent against your ${formatINRWhole(limit)} ${category.toLowerCase()} limit (${formatPercent(ratio)}).`,
        rule: "Category total this month is at or above the limit you set on the Budget page.",
      });
    } else if (ratio >= 0.8) {
      insights.push({
        id: `limit-near-${category}`,
        tone: "warning",
        title: `${category} limit almost reached`,
        detail: `${formatINRWhole(limit - spent)} left of your ${formatINRWhole(limit)} ${category.toLowerCase()} limit (${formatPercent(ratio)} used).`,
        rule: "Category total this month is at least 80% of the limit you set on the Budget page.",
      });
    }
  }

  // 6. Small purchases add up
  const small = thisMonth.filter((t) => t.amount <= SMALL_PURCHASE_LIMIT);
  if (small.length >= 4) {
    insights.push({
      id: "small-purchases",
      tone: "info",
      title: `${small.length} small purchases added up to ${formatINRWhole(sumAmounts(small))}`,
      detail: `Chai, snacks and quick rides under ${formatINR(SMALL_PURCHASE_LIMIT)} each make up ${formatPercent(sumAmounts(small) / Math.max(summary.spent, 1))} of this month's spending.`,
      rule: `Counts this month's transactions of ${formatINR(SMALL_PURCHASE_LIMIT)} or less.`,
    });
  }

  // 7. Weekend spending
  if (thisMonth.length >= 6 && summary.spent > 0) {
    const weekend = thisMonth.filter((t) => {
      const day = parseISODate(t.date).getDay();
      return day === 0 || day === 6;
    });
    const share = sumAmounts(weekend) / summary.spent;
    if (share >= 0.4) {
      insights.push({
        id: "weekend",
        tone: "info",
        title: `${formatPercent(share)} of your spending happens on weekends`,
        detail: `Weekends are only about 29% of the days, but ${formatINRWhole(sumAmounts(weekend))} of this month's spending fell on a Saturday or Sunday.`,
        rule: "Share of this month's spending dated on a Saturday or Sunday; shown when it's 40% or more.",
      });
    }
  }

  // 8. Largest single expense
  const largest = [...thisMonth].sort((a, b) => b.amount - a.amount)[0];
  if (largest && thisMonth.length >= 3) {
    insights.push({
      id: "largest",
      tone: "info",
      title: `Largest expense: ${formatINRWhole(largest.amount)} on ${largest.description}`,
      detail: `Recorded on ${formatDate(largest.date)} under ${largest.category} — ${formatPercent(largest.amount / summary.spent)} of this month's total.`,
      rule: "The single highest-amount transaction this month.",
    });
  }

  // 9. Dominant payment method
  const topMethod = spendingByPaymentMethod(thisMonth)[0];
  if (topMethod && thisMonth.length >= 5 && topMethod.share >= 0.5) {
    insights.push({
      id: "payment-method",
      tone: "info",
      title: `${topMethod.method} covers ${formatPercent(topMethod.share)} of your spending`,
      detail: `${topMethod.count} of ${thisMonth.length} payments this month were made by ${topMethod.method}. Review that history when you reconcile your expenses.`,
      rule: "The payment method with the highest total this month; shown when it's half or more of spending.",
    });
  }

  // 10. No-spend days
  if (daysElapsed >= 7 && thisMonth.length > 0) {
    const spendDays = new Set(thisMonth.map((t) => t.date)).size;
    const noSpend = daysElapsed - spendDays;
    if (noSpend >= 3) {
      insights.push({
        id: "no-spend",
        tone: "positive",
        title: `${noSpend} no-spend days this month`,
        detail: `You didn't record any expense on ${noSpend} of the ${daysElapsed} days so far. Every no-spend day helps your savings goals.`,
        rule: "Days elapsed this month minus the number of distinct dates that have a transaction.",
      });
    }
  }

  // 11. Savings goals
  const completed = data.goals.filter(isGoalComplete);
  const nextDeadline = data.goals
    .filter((g) => !isGoalComplete(g) && g.deadline)
    .sort((a, b) => ((a.deadline ?? "") < (b.deadline ?? "") ? -1 : 1))[0];
  if (nextDeadline?.deadline) {
    const months = monthsUntil(nextDeadline.deadline, today);
    const needed = (nextDeadline.target - nextDeadline.saved) / months;
    insights.push({
      id: "goal-pace",
      tone: "info",
      title: `Save ${formatINRWhole(needed)}/month to reach “${nextDeadline.name}”`,
      detail: `${formatINRWhole(nextDeadline.target - nextDeadline.saved)} to go with about ${months} month${months === 1 ? "" : "s"} until ${formatDate(nextDeadline.deadline)}.`,
      rule: "Amount still needed for your goal with the nearest deadline ÷ months remaining.",
    });
  }
  if (completed.length > 0) {
    insights.push({
      id: "goals-complete",
      tone: "positive",
      title: `${completed.length} savings goal${completed.length === 1 ? "" : "s"} completed`,
      detail: `${completed.map((g) => g.name).join(", ")} — fully funded. Nice work!`,
      rule: "Goals where the saved amount has reached the target.",
    });
  }

  return insights
    .map((insight, index) => ({ insight, index }))
    .sort((a, b) => TONE_ORDER[a.insight.tone] - TONE_ORDER[b.insight.tone] || a.index - b.index)
    .map(({ insight }) => insight);
}
