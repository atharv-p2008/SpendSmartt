import { toISODate } from "./dates";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  type Category,
  type GoalInput,
  type PaymentMethod,
  type TransactionInput,
} from "./types";

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export const MAX_TRANSACTION_AMOUNT = 1_000_000;
export const MAX_GOAL_AMOUNT = 10_000_000;

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type AmountResult = { value: number; error: null } | { value: null; error: string };

/** Parse a rupee amount typed by the user ("1,250.50" → 1250.5). */
export function parseAmount(
  raw: string,
  { max, allowZero = false, label = "Amount" }: { max: number; allowZero?: boolean; label?: string },
): AmountResult {
  const cleaned = raw.replace(/[,\s₹]/g, "");
  if (cleaned === "") return { value: null, error: `${label} is required` };
  if (!AMOUNT_PATTERN.test(cleaned))
    return { value: null, error: "Enter a valid number with up to 2 decimals" };
  const value = Number(cleaned);
  if (!allowZero && value <= 0) return { value: null, error: `${label} must be greater than ₹0` };
  if (value > max)
    return { value: null, error: `${label} can't exceed ₹${max.toLocaleString("en-IN")}` };
  return { value, error: null };
}

export interface TransactionFormValues {
  amount: string;
  description: string;
  category: Category | "";
  date: string;
  paymentMethod: PaymentMethod | "";
}

export function validateTransaction(
  values: TransactionFormValues,
  today: Date = new Date(),
): { data: TransactionInput | null; errors: FormErrors<TransactionFormValues> } {
  const errors: FormErrors<TransactionFormValues> = {};

  const amount = parseAmount(values.amount, { max: MAX_TRANSACTION_AMOUNT });
  if (amount.error) errors.amount = amount.error;

  const description = values.description.trim();
  if (description.length < 2) errors.description = "Add a short description (at least 2 characters)";
  else if (description.length > 60) errors.description = "Keep it under 60 characters";

  const category = values.category;
  if (!category || !(CATEGORIES as readonly string[]).includes(category))
    errors.category = "Choose a category";

  const method = values.paymentMethod;
  if (!method || !(PAYMENT_METHODS as readonly string[]).includes(method))
    errors.paymentMethod = "Choose a payment method";

  if (!DATE_PATTERN.test(values.date)) errors.date = "Pick a date";
  else if (values.date > toISODate(today)) errors.date = "Date can't be in the future";
  else if (values.date < "2000-01-01") errors.date = "Date looks too far in the past";

  if (Object.keys(errors).length > 0 || amount.value === null || !category || !method) {
    return { data: null, errors };
  }
  return {
    data: { amount: amount.value, description, category, date: values.date, paymentMethod: method },
    errors,
  };
}

export interface GoalFormValues {
  name: string;
  target: string;
  saved: string;
  deadline: string;
}

export function validateGoal(
  values: GoalFormValues,
  { today = new Date(), allowPastDeadline = false }: { today?: Date; allowPastDeadline?: boolean } = {},
): { data: GoalInput | null; errors: FormErrors<GoalFormValues> } {
  const errors: FormErrors<GoalFormValues> = {};

  const name = values.name.trim();
  if (name.length < 2) errors.name = "Give your goal a name (at least 2 characters)";
  else if (name.length > 40) errors.name = "Keep the name under 40 characters";

  const target = parseAmount(values.target, { max: MAX_GOAL_AMOUNT, label: "Target" });
  if (target.error) errors.target = target.error;

  const saved =
    values.saved.trim() === ""
      ? ({ value: 0, error: null } as AmountResult)
      : parseAmount(values.saved, { max: MAX_GOAL_AMOUNT, allowZero: true, label: "Saved amount" });
  if (saved.error) errors.saved = saved.error;
  else if (target.value !== null && saved.value !== null && saved.value > target.value)
    errors.saved = "Saved amount can't be more than the target";

  let deadline: string | null = null;
  if (values.deadline.trim() !== "") {
    if (!DATE_PATTERN.test(values.deadline)) errors.deadline = "Pick a valid date";
    else if (!allowPastDeadline && values.deadline < toISODate(today))
      errors.deadline = "Deadline must be today or later";
    else deadline = values.deadline;
  }

  if (Object.keys(errors).length > 0 || target.value === null || saved.value === null) {
    return { data: null, errors };
  }
  return { data: { name, target: target.value, saved: saved.value, deadline }, errors };
}
