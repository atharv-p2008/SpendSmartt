import { CATEGORY_META } from "@/lib/finance/categories";
import type { Category } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", meta.chip, className)}>
      <Icon className="size-[18px]" />
    </div>
  );
}

export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", CATEGORY_META[category].dot, className)} />;
}
