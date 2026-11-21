import { Eraser, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance/store";

export function DataActions() {
  const { actions } = useFinance();
  return (
    <div className="space-y-1">
      <ConfirmDialog
        title="Reset to demo data?"
        description="All your expenses, budgets and goals will be replaced with SpendSmart's sample student data. This can't be undone."
        confirmLabel="Reset demo data"
        onConfirm={() => {
          actions.resetDemoData();
          toast.success("Demo data restored");
        }}
        trigger={
          <Button variant="sidebar" size="sm" className="w-full">
            <RotateCcw />
            Reset demo data
          </Button>
        }
      />
      <ConfirmDialog
        destructive
        title="Clear all data?"
        description="Every expense, budget, limit and savings goal will be deleted so you can start from scratch. This can't be undone."
        confirmLabel="Clear everything"
        onConfirm={() => {
          actions.clearAllData();
          toast.success("All data cleared", { description: "Start by setting a budget and adding an expense." });
        }}
        trigger={
          <Button variant="sidebar" size="sm" className="w-full">
            <Eraser />
            Clear all data
          </Button>
        }
      />
    </div>
  );
}
