import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/finance/CategoryIcon";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/finance/dates";
import { formatINR } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import type { Transaction } from "@/lib/finance/types";

export function TransactionList({
  transactions,
  showActions = true,
}: {
  transactions: Transaction[];
  showActions?: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} showActions={showActions} />
      ))}
    </ul>
  );
}

function TransactionRow({ tx, showActions }: { tx: Transaction; showActions: boolean }) {
  const { actions } = useFinance();
  return (
    <li className="group flex items-center gap-3 py-3 sm:gap-4">
      <CategoryIcon category={tx.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{tx.description}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{tx.category}</span>
          <span aria-hidden>·</span>
          <span>{tx.paymentMethod}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(tx.date)}</span>
        </p>
      </div>
      <p className="shrink-0 text-right font-display text-sm font-semibold tabular-nums text-foreground sm:text-base">
        −{formatINR(tx.amount)}
      </p>
      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5">
          <TransactionDialog
            transaction={tx}
            trigger={
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" aria-label={`Edit ${tx.description}`}>
                <Pencil />
              </Button>
            }
          />
          <ConfirmDialog
            destructive
            title="Delete this expense?"
            description={`“${tx.description}” for ${formatINR(tx.amount)} on ${formatDate(tx.date)} will be removed permanently.`}
            confirmLabel="Delete"
            onConfirm={() => {
              actions.deleteTransaction(tx.id);
              toast.success("Expense deleted", { description: tx.description });
            }}
            trigger={
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-destructive-soft hover:text-destructive" aria-label={`Delete ${tx.description}`}>
                <Trash2 />
              </Button>
            }
          />
        </div>
      )}
    </li>
  );
}
