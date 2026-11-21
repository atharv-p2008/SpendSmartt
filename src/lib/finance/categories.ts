import {
  Bus,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Shapes,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { Category } from "./types";

interface CategoryMeta {
  icon: LucideIcon;
  /** CSS colour used by charts */
  color: string;
  /** Soft chip background + icon colour */
  chip: string;
  /** Solid swatch */
  dot: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: {
    icon: UtensilsCrossed,
    color: "var(--cat-food)",
    chip: "bg-cat-food/15 text-cat-food",
    dot: "bg-cat-food",
  },
  Transport: {
    icon: Bus,
    color: "var(--cat-transport)",
    chip: "bg-cat-transport/15 text-cat-transport",
    dot: "bg-cat-transport",
  },
  Shopping: {
    icon: ShoppingBag,
    color: "var(--cat-shopping)",
    chip: "bg-cat-shopping/15 text-cat-shopping",
    dot: "bg-cat-shopping",
  },
  Education: {
    icon: GraduationCap,
    color: "var(--cat-education)",
    chip: "bg-cat-education/15 text-cat-education",
    dot: "bg-cat-education",
  },
  Entertainment: {
    icon: Clapperboard,
    color: "var(--cat-entertainment)",
    chip: "bg-cat-entertainment/15 text-cat-entertainment",
    dot: "bg-cat-entertainment",
  },
  Health: {
    icon: HeartPulse,
    color: "var(--cat-health)",
    chip: "bg-cat-health/15 text-cat-health",
    dot: "bg-cat-health",
  },
  Other: {
    icon: Shapes,
    color: "var(--cat-other)",
    chip: "bg-cat-other/15 text-cat-other",
    dot: "bg-cat-other",
  },
};
