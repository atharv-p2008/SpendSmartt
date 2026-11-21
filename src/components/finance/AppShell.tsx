import { Link } from "@tanstack/react-router";
import {
  ChartPie,
  LayoutDashboard,
  Lightbulb,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { BudgetBar, LEVEL_STYLES } from "@/components/finance/budget-ui";
import { DataActions } from "@/components/finance/DataActions";
import { Logo } from "@/components/finance/Logo";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getMonthSummary } from "@/lib/finance/calculations";
import { formatMonthKey, monthKeyFromDate } from "@/lib/finance/dates";
import { formatINRWhole } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Expenses", icon: ReceiptText },
  { to: "/analytics", label: "Analytics", icon: ChartPie },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/goals", label: "Savings Goals", icon: PiggyBank },
  { to: "/insights", label: "Smart Insights", icon: Lightbulb },
] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = useFinance();
  const today = new Date();
  const summary = getMonthSummary(data, monthKeyFromDate(today), today);

  return (
    <div className="flex h-full flex-col bg-sidebar-gradient px-4 py-6">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">Menu</p>
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.to === "/" }}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground data-[status=active]:shadow-[inset_3px_0_0_var(--sidebar-primary)]",
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Link
        to="/budget"
        onClick={onNavigate}
        className="mt-8 block rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4 transition-colors hover:bg-sidebar-accent"
      >
        <p className="text-xs font-medium text-sidebar-muted">{formatMonthKey(summary.monthKey, "long")}</p>
        {summary.budget > 0 ? (
          <>
            <p className="mt-1 text-sm font-semibold text-sidebar-accent-foreground">
              {formatINRWhole(summary.spent)}{" "}
              <span className="font-normal text-sidebar-muted">of {formatINRWhole(summary.budget)}</span>
            </p>
            <BudgetBar status={summary.status} className="mt-3 h-1.5 bg-sidebar-border" />
            <p className={cn("mt-2 text-xs font-medium", summary.status.level === "safe" ? "text-sidebar-primary" : LEVEL_STYLES[summary.status.level].text, summary.status.level === "warning" && "text-warning")}>
              {LEVEL_STYLES[summary.status.level].label} · {Math.round(summary.status.ratio * 100)}% used
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm font-semibold text-sidebar-accent-foreground">Set a monthly budget →</p>
        )}
      </Link>

      <div className="mt-auto border-t border-sidebar-border pt-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">Data</p>
        <DataActions />
        <p className="mt-3 px-3 text-[11px] leading-relaxed text-sidebar-muted">
          Saved privately in this browser. No account or bank connection needed.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto lg:block">
        <SidebarBody />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-sidebar px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="sidebar" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground [&>button]:data-[state=open]:bg-transparent"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Logo showTagline={false} />
        <TransactionDialog
          trigger={
            <Button variant="brand" size="icon" aria-label="Add expense">
              <Plus className="size-5" />
            </Button>
          }
        />
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
