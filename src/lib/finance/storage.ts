import { z } from "zod";

import { buildSeedData } from "./seed";
import { CATEGORIES, PAYMENT_METHODS, type FinanceData } from "./types";

export const STORAGE_KEY = "spendsmart:data:v1";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const financeSchema = z.object({
  version: z.literal(1),
  monthlyBudget: z.number().nonnegative(),
  categoryLimits: z.record(z.enum(CATEGORIES), z.number().nonnegative()),
  transactions: z.array(
    z.object({
      id: z.string(),
      amount: z.number().positive(),
      description: z.string(),
      category: z.enum(CATEGORIES),
      date: isoDate,
      paymentMethod: z.enum(PAYMENT_METHODS),
    }),
  ),
  goals: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      target: z.number().positive(),
      saved: z.number().nonnegative(),
      deadline: isoDate.nullable(),
      createdAt: z.string(),
    }),
  ),
});

/** Browser-only: read saved data, falling back to demo data when missing or corrupt. */
export function loadFinanceData(): FinanceData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = financeSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data as FinanceData;
    }
  } catch {
    // Storage unavailable or corrupt JSON — fall through to demo data.
  }
  return buildSeedData(new Date());
}

export function saveFinanceData(data: FinanceData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or private mode: keep working in memory.
  }
}
