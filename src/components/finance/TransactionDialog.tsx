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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_META } from "@/lib/finance/categories";
import { toISODate } from "@/lib/finance/dates";
import { formatINR } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  type Category,
  type PaymentMethod,
  type Transaction,
} from "@/lib/finance/types";
import {
  validateTransaction,
  type FormErrors,
  type TransactionFormValues,
} from "@/lib/finance/validation";

function initialValues(tx?: Transaction): TransactionFormValues {
  if (tx) {
    return {
      amount: String(tx.amount),
      description: tx.description,
      category: tx.category,
      date: tx.date,
      paymentMethod: tx.paymentMethod,
    };
  }
  return { amount: "", description: "", category: "", date: toISODate(new Date()), paymentMethod: "UPI" };
}

interface TransactionDialogProps {
  trigger: ReactNode;
  transaction?: Transaction;
}

export function TransactionDialog({ trigger, transaction }: TransactionDialogProps) {
  const { actions } = useFinance();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<TransactionFormValues>(() => initialValues(transaction));
  const [errors, setErrors] = useState<FormErrors<TransactionFormValues>>({});
  const isEdit = Boolean(transaction);

  function handleOpenChange(next: boolean) {
    if (next) {
      setValues(initialValues(transaction));
      setErrors({});
    }
    setOpen(next);
  }

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateTransaction(values);
    if (!result.data) {
      setErrors(result.errors);
      return;
    }
    if (transaction) {
      actions.updateTransaction(transaction.id, result.data);
      toast.success("Expense updated", { description: result.data.description });
    } else {
      actions.addTransaction(result.data);
      toast.success(`${formatINR(result.data.amount)} expense added`, {
        description: `${result.data.description} · ${result.data.category}`,
      });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? "Edit expense" : "Add an expense"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details of this transaction." : "Record what you spent so your budget stays accurate."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tx-amount" label="Amount" error={errors.amount}>
              <RupeeInputWrap>
                <Input
                  id="tx-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="pl-7 tabular-nums"
                  value={values.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  aria-invalid={Boolean(errors.amount)}
                />
              </RupeeInputWrap>
            </FormField>
            <FormField id="tx-date" label="Date" error={errors.date}>
              <Input
                id="tx-date"
                type="date"
                max={toISODate(new Date())}
                value={values.date}
                onChange={(e) => set("date", e.target.value)}
                aria-invalid={Boolean(errors.date)}
              />
            </FormField>
          </div>

          <FormField id="tx-description" label="Description" error={errors.description}>
            <Input
              id="tx-description"
              placeholder="e.g. Lunch at canteen"
              maxLength={60}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              aria-invalid={Boolean(errors.description)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tx-category" label="Category" error={errors.category}>
              <Select
                value={values.category}
                onValueChange={(v) => set("category", v as Category)}
              >
                <SelectTrigger id="tx-category" aria-invalid={Boolean(errors.category)}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => {
                    const Icon = CATEGORY_META[c].icon;
                    return (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" />
                          {c}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="tx-method" label="Payment method" error={errors.paymentMethod}>
              <Select
                value={values.paymentMethod}
                onValueChange={(v) => set("paymentMethod", v as PaymentMethod)}
              >
                <SelectTrigger id="tx-method" aria-invalid={Boolean(errors.paymentMethod)}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand">
              {isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
