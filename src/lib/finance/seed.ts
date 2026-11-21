import { round2 } from "./calculations";
import { daysInMonthKey, monthKeyFromDate, shiftMonthKey, toISODate } from "./dates";
import type { Category, FinanceData, PaymentMethod, SavingsGoal, Transaction } from "./types";

type Template = [day: number, description: string, category: Category, amount: number, method: PaymentMethod, optional?: boolean];

/** A typical month for a college student living in a hostel. */
const MONTHLY_TEMPLATES: Template[] = [
  [1, "Hostel mess fee", "Food", 3200, "UPI"],
  [1, "Metro card recharge", "Transport", 500, "UPI"],
  [2, "Chai & samosa at canteen", "Food", 60, "Cash"],
  [3, "Photocopy of lecture notes", "Education", 120, "Cash"],
  [3, "Swiggy – biryani night", "Food", 340, "UPI"],
  [4, "Spotify Premium (student)", "Entertainment", 59, "Debit Card"],
  [5, "Rapido to college", "Transport", 85, "UPI"],
  [5, "Stationery & notebooks", "Education", 260, "Cash"],
  [6, "Zomato – pizza with roommates", "Food", 420, "UPI"],
  [7, "Pharmacy – cold medicine", "Health", 180, "UPI", true],
  [8, "Movie tickets at PVR", "Entertainment", 450, "Debit Card"],
  [9, "Groceries at D-Mart", "Food", 650, "Debit Card"],
  [10, "Mobile recharge (Jio)", "Other", 299, "UPI"],
  [10, "Coursera certificate", "Education", 499, "Credit Card", true],
  [11, "Uber home after late lab", "Transport", 210, "UPI"],
  [12, "Amazon – phone cover", "Shopping", 349, "UPI"],
  [13, "Café coffee with friends", "Food", 280, "UPI"],
  [14, "Gym membership", "Health", 800, "UPI"],
  [15, "Myntra – t-shirts", "Shopping", 899, "Credit Card", true],
  [16, "Laundry service", "Other", 250, "Cash"],
  [17, "Bus pass top-up", "Transport", 300, "Cash"],
  [18, "Weekend trip snacks", "Food", 190, "Cash"],
  [19, "Maggi at night canteen", "Food", 70, "Cash"],
  [20, "Textbook – Data Structures", "Education", 650, "Net Banking", true],
  [22, "BookMyShow – stand-up show", "Entertainment", 399, "UPI", true],
  [24, "Blinkit – late night snacks", "Food", 230, "UPI"],
  [26, "Haircut", "Other", 150, "Cash"],
  [27, "Swiggy – dinner", "Food", 310, "UPI"],
];

/** One-offs this month so the dashboard and insights have something to say. */
const CURRENT_MONTH_EXTRAS: Template[] = [
  [2, "Birthday dinner for roommate", "Food", 1150, "UPI"],
  [4, "Concert tickets", "Entertainment", 1499, "Credit Card"],
  [6, "Chai at canteen", "Food", 40, "Cash"],
  [8, "Auto to railway station", "Transport", 120, "Cash"],
];

export const DEMO_MONTHLY_BUDGET = 12000;

function roundTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

export function buildSeedData(today: Date = new Date()): FinanceData {
  const currentKey = monthKeyFromDate(today);
  const transactions: Transaction[] = [];
  let id = 0;

  for (let back = 5; back >= 0; back--) {
    const key = shiftMonthKey(currentKey, -back);
    const dim = daysInMonthKey(key);
    const isCurrent = back === 0;
    const templates = isCurrent ? [...MONTHLY_TEMPLATES, ...CURRENT_MONTH_EXTRAS] : MONTHLY_TEMPLATES;

    templates.forEach(([day, description, category, amount, method, optional], index) => {
      if (optional && (back + index) % 3 === 0) return;
      const date = `${key}-${String(Math.min(day, dim)).padStart(2, "0")}`;
      if (isCurrent && Number(date.slice(8)) > today.getDate()) return;
      // Deterministic month-to-month variation of roughly ±12%.
      const factor = 1 + (((back * 3 + index) % 5) - 2) * 0.06;
      const fixed = description === "Hostel mess fee" || description === "Gym membership" || description.startsWith("Spotify");
      const value = fixed ? amount : roundTo(amount * factor, amount < 200 ? 5 : 10);
      transactions.push({
        id: `seed-${id++}`,
        amount: round2(value),
        description,
        category,
        date,
        paymentMethod: method,
      });
    });
  }

  const inMonths = (months: number) =>
    toISODate(new Date(today.getFullYear(), today.getMonth() + months, 15));
  const created = toISODate(new Date(today.getFullYear(), today.getMonth() - 3, 1));

  const goals: SavingsGoal[] = [
    { id: "seed-goal-1", name: "New laptop for final year", target: 55000, saved: 18500, deadline: inMonths(7), createdAt: created },
    { id: "seed-goal-2", name: "Goa trip with friends", target: 12000, saved: 7800, deadline: inMonths(3), createdAt: created },
    { id: "seed-goal-3", name: "Emergency fund", target: 10000, saved: 4200, deadline: null, createdAt: created },
    { id: "seed-goal-4", name: "Noise-cancelling headphones", target: 6000, saved: 6000, deadline: inMonths(1), createdAt: created },
  ];

  return {
    version: 1,
    monthlyBudget: DEMO_MONTHLY_BUDGET,
    categoryLimits: { Food: 5500, Entertainment: 1500, Shopping: 1500 },
    transactions,
    goals,
  };
}

export function buildEmptyData(): FinanceData {
  return { version: 1, monthlyBudget: 0, categoryLimits: {}, transactions: [], goals: [] };
}
