import { resolveRange, type DateRange, type RangeKey } from "./dates";

const KEYS: RangeKey[] = ["today", "yesterday", "7d", "30d", "month", "custom"];

/** Reads ?range=&from=&to= search params into a resolved date range. */
export function rangeFromParams(sp: { range?: string; from?: string; to?: string }, fallback: RangeKey = "today"): { key: RangeKey; range: DateRange } {
  const key = KEYS.includes(sp.range as RangeKey) ? (sp.range as RangeKey) : fallback;
  return { key, range: resolveRange(key, sp.from, sp.to) };
}
