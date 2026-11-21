import { createFileRoute } from "@tanstack/react-router";
import { FilterX, Plus, ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/finance/EmptyState";
import { PageHeader } from "@/components/finance/PageHeader";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { TransactionList } from "@/components/finance/TransactionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { availableMonthKeys, sumAmounts } from "@/lib/finance/calculations";
import { formatMonthKey, monthKeyFromDate } from "@/lib/finance/dates";
import { formatINR } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import { CATEGORIES, PAYMENT_METHODS, type Transaction } from "@/lib/finance/types";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Expenses — SpendSmart" },
      { name: "description", content: "Add, edit, delete and search every expense you've recorded." },
      { property: "og:title", content: "Expenses — SpendSmart" },
      { property: "og:description", content: "Add, edit, delete and search every expense you've recorded." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const SORTERS: Record<SortKey, (a: Transaction, b: Transaction) => number> = {
  newest: (a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1),
  oldest: (a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1),
  highest: (a, b) => b.amount - a.amount,
  lowest: (a, b) => a.amount - b.amount,
};

function TransactionsPage() {
  const { data } = useFinance();
  const today = new Date();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [month, setMonth] = useState<string>(monthKeyFromDate(today));
  const [sort, setSort] = useState<SortKey>("newest");

  const months = availableMonthKeys(data.transactions, today);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.transactions
      .filter((t) => (month === "all" ? true : t.date.startsWith(month)))
      .filter((t) => (category === "all" ? true : t.category === category))
      .filter((t) => (method === "all" ? true : t.paymentMethod === method))
      .filter((t) => (q ? t.description.toLowerCase().includes(q) : true))
      .sort(SORTERS[sort]);
  }, [data.transactions, query, category, method, month, sort]);

  const hasFilters = query !== "" || category !== "all" || method !== "all" || month !== "all";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setMethod("all");
    setMonth("all");
  }

  const addButton = (
    <TransactionDialog
      trigger={
        <Button variant="brand" size="lg">
          <Plus />
          Add expense
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Every rupee you've spent, searchable and editable."
        actions={addButton}
      />

      {data.transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No expenses yet"
          description="Start by adding something you bought today — a chai, a metro ride or a new notebook."
          action={addButton}
        />
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search descriptions…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search expenses"
                />
              </div>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger aria-label="Filter by month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatMonthKey(m, "long")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Filter by category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger aria-label="Filter by payment method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment methods</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger aria-label="Sort expenses">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest">Highest amount</SelectItem>
                  <SelectItem value="lowest">Lowest amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> expense
                {filtered.length === 1 ? "" : "s"} · total{" "}
                <span className="font-semibold tabular-nums text-foreground">{formatINR(sumAmounts(filtered))}</span>
              </p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FilterX />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="mt-2">
              {filtered.length > 0 ? (
                <TransactionList transactions={filtered} />
              ) : (
                <div className="pt-4">
                  <EmptyState
                    icon={FilterX}
                    title="No matching expenses"
                    description="Try a different month, category or search term."
                    action={
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
