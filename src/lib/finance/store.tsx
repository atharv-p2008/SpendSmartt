import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { round2 } from "./calculations";
import { toISODate } from "./dates";
import { buildEmptyData, buildSeedData } from "./seed";
import { loadFinanceData, saveFinanceData } from "./storage";
import type { Category, FinanceData, GoalInput, SavingsGoal, TransactionInput } from "./types";

export interface FinanceActions {
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  setMonthlyBudget: (amount: number) => void;
  setCategoryLimit: (category: Category, amount: number | null) => void;
  addGoal: (input: GoalInput) => void;
  updateGoal: (id: string, input: GoalInput) => void;
  deleteGoal: (id: string) => void;
  /** Positive to deposit, negative to withdraw; clamped between 0 and the target. */
  adjustGoalSaved: (id: string, delta: number) => void;
  resetDemoData: () => void;
  clearAllData: () => void;
}

interface FinanceContextValue {
  data: FinanceData;
  actions: FinanceActions;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function FinanceProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [data, setData] = useState<FinanceData | null>(null);

  // localStorage is browser-only: load after mount so SSR and hydration agree.
  useEffect(() => {
    setData(loadFinanceData());
  }, []);

  useEffect(() => {
    if (data) saveFinanceData(data);
  }, [data]);

  const update = useCallback((fn: (prev: FinanceData) => FinanceData) => {
    setData((prev) => (prev ? fn(prev) : prev));
  }, []);

  const actions = useMemo<FinanceActions>(
    () => ({
      addTransaction: (input) =>
        update((d) => ({ ...d, transactions: [{ ...input, id: newId("tx") }, ...d.transactions] })),
      updateTransaction: (id, input) =>
        update((d) => ({
          ...d,
          transactions: d.transactions.map((t) => (t.id === id ? { ...input, id } : t)),
        })),
      deleteTransaction: (id) =>
        update((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })),
      setMonthlyBudget: (amount) => update((d) => ({ ...d, monthlyBudget: amount })),
      setCategoryLimit: (category, amount) =>
        update((d) => {
          const categoryLimits = { ...d.categoryLimits };
          if (amount && amount > 0) categoryLimits[category] = amount;
          else delete categoryLimits[category];
          return { ...d, categoryLimits };
        }),
      addGoal: (input) =>
        update((d) => {
          const goal: SavingsGoal = { ...input, id: newId("goal"), createdAt: toISODate(new Date()) };
          return { ...d, goals: [...d.goals, goal] };
        }),
      updateGoal: (id, input) =>
        update((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...input } : g)) })),
      deleteGoal: (id) => update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) })),
      adjustGoalSaved: (id, delta) =>
        update((d) => ({
          ...d,
          goals: d.goals.map((g) =>
            g.id === id ? { ...g, saved: round2(Math.min(g.target, Math.max(0, g.saved + delta))) } : g,
          ),
        })),
      resetDemoData: () => setData(buildSeedData(new Date())),
      clearAllData: () => setData(buildEmptyData()),
    }),
    [update],
  );

  if (!data) return <>{fallback}</>;
  return <FinanceContext.Provider value={{ data, actions }}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
