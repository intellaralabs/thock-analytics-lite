import { daily, parseIso, type DayMetrics } from "@/data/analytics";

const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const numberFmt = new Intl.NumberFormat("en-US");
const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export const compact = (n: number) => compactFmt.format(n);
export const num = (n: number) => numberFmt.format(n);
export const money = (n: number) => moneyFmt.format(n);
export const moneyCompact = (n: number) => `$${compactFmt.format(n)}`;
export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const formatDate = (s: string | Date) => dateFmt.format(typeof s === "string" ? parseIso(s) : s);
export const shortDate = (s: string | Date) => shortDateFmt.format(typeof s === "string" ? parseIso(s) : s);

/** Percentage change, rounded to one decimal. */
export const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : 0);

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function lastSeen(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** The daily rows inside an inclusive ISO date range, and the same number of days just before it. */
export function slice(from: string, to: string): { current: DayMetrics[]; previous: DayMetrics[] } {
  const start = daily.findIndex((d) => d.date >= from);
  let end = daily.findIndex((d) => d.date > to);
  if (end === -1) end = daily.length;
  const s = start === -1 ? daily.length : start;
  const current = daily.slice(s, end);
  const previous = daily.slice(Math.max(0, s - current.length), s);
  return { current, previous };
}

/** Groups daily rows into weeks when a range is long, so charts stay readable. */
export function bucket(rows: DayMetrics[], size: number): DayMetrics[] {
  if (size <= 1) return rows;
  const out: DayMetrics[] = [];
  for (let i = 0; i < rows.length; i += size) {
    const group = rows.slice(i, i + size);
    out.push({
      date: group[0].date,
      visitors: sum(group.map((g) => g.visitors)),
      sessions: sum(group.map((g) => g.sessions)),
      signups: sum(group.map((g) => g.signups)),
      activations: sum(group.map((g) => g.activations)),
      revenue: sum(group.map((g) => g.revenue)),
    });
  }
  return out;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
