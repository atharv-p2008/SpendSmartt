export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Education",
  "Entertainment",
  "Health",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = ["UPI", "Cash", "Debit Card", "Credit Card", "Net Banking"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: Category;
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  paymentMethod: PaymentMethod;
}
export type TransactionInput = Omit<Transaction, "id">;

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** YYYY-MM-DD or null when the goal has no deadline */
  deadline: string | null;
  createdAt: string;
}
export type GoalInput = Pick<SavingsGoal, "name" | "target" | "saved" | "deadline">;

export type CategoryLimits = Partial<Record<Category, number>>;

export interface FinanceData {
  version: 1;
  monthlyBudget: number;
  categoryLimits: CategoryLimits;
  transactions: Transaction[];
  goals: SavingsGoal[];
}
