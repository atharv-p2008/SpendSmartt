import { describe, expect, it } from "vitest";

import { getBudgetStatus } from "./calculations";
import { generateInsights } from "./insights";
import { buildEmptyData } from "./seed";
import { validateTransaction } from "./validation";

const today = new Date(2026, 10, 21);

describe("budget warnings", () => {
  it("is safe below 80% of the budget", () => {
    expect(getBudgetStatus(7900, 10000).level).toBe("safe");
  });
  it("warns when spending approaches the budget (80%)", () => {
    expect(getBudgetStatus(8000, 10000).level).toBe("warning");
  });
  it("flags over budget at 100% or more", () => {
    expect(getBudgetStatus(10000, 10000).level).toBe("over");
  });
});

describe("expense validation", () => {
  const base = { amount: "250", description: "Lunch", category: "Food" as const, date: "2026-11-20", paymentMethod: "UPI" as const };
  it("rejects a zero amount", () => {
    expect(validateTransaction({ ...base, amount: "0" }, today).data).toBeNull();
  });
  it("rejects a future date", () => {
    expect(validateTransaction({ ...base, date: "2026-11-22" }, today).data).toBeNull();
  });
  it("accepts a valid expense", () => {
    expect(validateTransaction(base, today).data?.amount).toBe(250);
  });
});

describe("insights", () => {
  it("produces no insights without data", () => {
    expect(generateInsights(buildEmptyData(), today)).toEqual([]);
  });
});
