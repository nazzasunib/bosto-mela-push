/**
 * Bosto Mela cost-code system.
 * Each letter maps to a digit; the decoded number is the cost price in Taka.
 * B=1 R=2 I=3 G=4 H=5 T=6 D=7 A=8 Y=9 S=0  →  BSS = 100, RBS = 210, HTS = 560, AYB = 891, YAB = 981
 */
export const CODE_MAP: Readonly<Record<string, string>> = { B: "1", R: "2", I: "3", G: "4", H: "5", T: "6", D: "7", A: "8", Y: "9", S: "0" };
const DIGIT_MAP: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(CODE_MAP).map(([k, v]) => [v, k]));

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Returns true when every character of the code is a valid cost letter. */
export function isCostCode(code: string): boolean {
  const c = normalizeCode(code);
  return c.length > 0 && [...c].every((ch) => ch in CODE_MAP);
}

/**
 * Decodes the cost price from a product code.
 * Only the leading run of valid cost letters is used, so "BSS-01" or "BSS/L" still decode to 100.
 * Returns null when the code does not start with a cost letter.
 */
export function decodeCostCode(code: string): number | null {
  const c = normalizeCode(code);
  let digits = "";
  for (const ch of c) {
    const d = CODE_MAP[ch];
    if (d === undefined) break;
    digits += d;
  }
  if (!digits) return null;
  return Number.parseInt(digits, 10);
}

/** Encodes a whole-number cost price into letters (e.g. 210 → "RBS"). */
export function encodeCostCode(cost: number): string {
  if (!Number.isFinite(cost) || cost < 0) return "";
  return [...String(Math.round(cost))].map((d) => DIGIT_MAP[d]).join("");
}

export interface QuantityInput { term: string; quantity: number }

/**
 * Parses quick-quantity input from the POS search box.
 * "BSS*3" → { term: "BSS", quantity: 3 }, "BSS × 2" → 2, "3*BSS" → 3, "BSS" → 1.
 */
export function parseQuantityInput(input: string): QuantityInput {
  const raw = input.trim();
  if (!raw) return { term: "", quantity: 1 };
  const suffix = raw.match(/^(.+?)\s*[*×]\s*(\d{1,4})$/);
  if (suffix && suffix[1].trim()) {
    const q = Number.parseInt(suffix[2], 10);
    return { term: suffix[1].trim(), quantity: q > 0 ? q : 1 };
  }
  const prefix = raw.match(/^(\d{1,4})\s*[*×]\s*(.+)$/);
  if (prefix && prefix[2].trim()) {
    const q = Number.parseInt(prefix[1], 10);
    return { term: prefix[2].trim(), quantity: q > 0 ? q : 1 };
  }
  return { term: raw, quantity: 1 };
}

/** Splits a multi-entry line such as "BSS*3 RBS*2, HTS*1" into individual entries. */
export function parseMultiInput(input: string): QuantityInput[] {
  const parts = input.split(/[,;\n]+|\s+(?=[A-Za-z0-9]+\s*[*×])/).map((p) => p.trim()).filter(Boolean);
  return parts.map(parseQuantityInput).filter((p) => p.term.length > 0);
}
