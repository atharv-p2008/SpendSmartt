import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb, Plus, ScrollText } from "lucide-react";

import { EmptyState } from "@/components/finance/EmptyState";
import { InsightCard } from "@/components/finance/InsightCard";
import { PageHeader } from "@/components/finance/PageHeader";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { Button } from "@/components/ui/button";
import { generateInsights } from "@/lib/finance/insights";
import { useFinance } from "@/lib/finance/store";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Smart Insights — SpendSmart" },
      { name: "description", content: "Rule-based observations about your spending, each with the rule that produced it." },
      { property: "og:title", content: "Smart Insights — SpendSmart" },
      { property: "og:description", content: "Rule-based observations about your spending, each with the rule that produced it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { data } = useFinance();
  const insights = generateInsights(data, new Date());

  return (
    <div className="space-y-6">
      <PageHeader title="Smart Insights" description="Observations generated from your own transactions." />
      <div className="flex items-start gap-3 rounded-2xl border border-teal/30 bg-teal-soft p-4 text-sm text-accent-foreground">
        <ScrollText className="mt-0.5 size-5 shrink-0" />
        <p>
          <span className="font-semibold">Transparent, rule-based logic — no AI.</span> Each insight comes from a simple
          calculation on your data. Open “How this is calculated” on any card to see the exact rule.
        </p>
      </div>
      {insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Not enough data yet"
          description="Add some expenses this month (and set a budget) to unlock insights about your spending."
          action={<TransactionDialog trigger={<Button variant="brand"><Plus /> Add expense</Button>} />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((i) => <InsightCard key={i.id} insight={i} />)}
        </div>
      )}
    </div>
  );
}
