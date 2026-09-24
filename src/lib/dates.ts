/** Shop timezone. Bangladesh has no DST, so a fixed offset is safe. */
export const SHOP_TZ = "Asia/Dhaka";
export const SHOP_OFFSET = "+06:00";
const OFFSET_MS = 6 * 60 * 60 * 1000;

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";
export const RANGE_LABELS: Record<RangeKey, string> = { today: "Today", yesterday: "Yesterday", "7d": "Last 7 Days", "30d": "Last 30 Days", month: "This Month", custom: "Custom" };

/** YYYY-MM-DD for a Date in shop time. */
export function shopDate(d: Date = new Date()): string {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
/** UTC ISO timestamp of 00:00 shop time on the given date. */
export function dayStartISO(date: string): string {
  return new Date(`${date}T00:00:00${SHOP_OFFSET}`).toISOString();
}
export function isValidDate(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());
}

export interface DateRange { from: string; to: string } // inclusive shop dates

export function resolveRange(key: RangeKey, from?: string, to?: string): DateRange {
  const today = shopDate();
  switch (key) {
    case "yesterday": { const y = addDays(today, -1); return { from: y, to: y }; }
    case "7d": return { from: addDays(today, -6), to: today };
    case "30d": return { from: addDays(today, -29), to: today };
    case "month": return { from: `${today.slice(0, 8)}01`, to: today };
    case "custom": {
      const f = isValidDate(from) ? from : today; const t = isValidDate(to) ? to : f;
      return f <= t ? { from: f, to: t } : { from: t, to: f };
    }
    default: return { from: today, to: today };
  }
}

/** Timestamp bounds [start, end) for a shop-date range. */
export function rangeBounds(r: DateRange) {
  return { start: dayStartISO(r.from), end: dayStartISO(addDays(r.to, 1)) };
}

export function eachDay(r: DateRange): string[] {
  const out: string[] = [];
  for (let d = r.from; d <= r.to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
