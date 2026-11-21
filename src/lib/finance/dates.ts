import { format } from "date-fns";

/** Format a Date as a local YYYY-MM-DD string (no timezone shifting). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function monthKeyFromDate(d: Date): string {
  return toISODate(d).slice(0, 7);
}

export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKeyFromDate(new Date(y ?? 1970, (m ?? 1) - 1 + delta, 1));
}

export function daysInMonthKey(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 1970, m ?? 1, 0).getDate();
}

export function formatMonthKey(key: string, style: "short" | "long" = "short"): string {
  return format(parseISODate(`${key}-01`), style === "short" ? "MMM yy" : "MMMM yyyy");
}

export function formatDate(s: string): string {
  return format(parseISODate(s), "d MMM yyyy");
}

export function formatShortDate(s: string): string {
  return format(parseISODate(s), "d MMM");
}

/** Whole days from a to b (b - a), ignoring time of day. */
export function daysBetween(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}
