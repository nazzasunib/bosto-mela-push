import { describe, expect, it } from "vitest";
import { decodeCostCode, encodeCostCode, isCostCode, parseMultiInput, parseQuantityInput } from "../code-parser";
import { cartTotals, changeDue, lineProfit, netProfit, refundFor } from "../calc";
import { addDays, dayStartISO, resolveRange } from "../dates";
import type { CartItem } from "../types";

describe("product code parser", () => {
  it("decodes the shop mapping", () => {
    expect(decodeCostCode("BSS")).toBe(100);
    expect(decodeCostCode("RBS")).toBe(210);
    expect(decodeCostCode("HTS")).toBe(560);
    expect(decodeCostCode("AYB")).toBe(891);
    expect(decodeCostCode("YAB")).toBe(981);
    expect(decodeCostCode("bss")).toBe(100);
    expect(decodeCostCode("GIDT")).toBe(4376);
  });
  it("uses only the leading cost letters", () => {
    expect(decodeCostCode("BSS-01")).toBe(100);
    expect(decodeCostCode("XYZ")).toBeNull();
    expect(decodeCostCode("")).toBeNull();
  });
  it("encodes back", () => {
    expect(encodeCostCode(100)).toBe("BSS");
    expect(encodeCostCode(981)).toBe("YAB");
    expect(isCostCode("RBS")).toBe(true);
    expect(isCostCode("RBX")).toBe(false);
  });
});

describe("quantity parser", () => {
  it("parses CODE*QTY", () => {
    expect(parseQuantityInput("BSS*2")).toEqual({ term: "BSS", quantity: 2 });
    expect(parseQuantityInput("BSS * 3")).toEqual({ term: "BSS", quantity: 3 });
    expect(parseQuantityInput("rbs*2")).toEqual({ term: "rbs", quantity: 2 });
    expect(parseQuantityInput("3*HTS")).toEqual({ term: "HTS", quantity: 3 });
    expect(parseQuantityInput("BSS")).toEqual({ term: "BSS", quantity: 1 });
    expect(parseQuantityInput("BSS*0")).toEqual({ term: "BSS", quantity: 1 });
    expect(parseQuantityInput("8901234567890")).toEqual({ term: "8901234567890", quantity: 1 });
    expect(parseQuantityInput("MAX12")).toEqual({ term: "MAX12", quantity: 1 });
  });
  it("parses multiple entries", () => {
    expect(parseMultiInput("BSS*3 RBS*2, HTS*1")).toEqual([{ term: "BSS", quantity: 3 }, { term: "RBS", quantity: 2 }, { term: "HTS", quantity: 1 }]);
    expect(parseMultiInput("Blue Shirt")).toEqual([{ term: "Blue Shirt", quantity: 1 }]);
  });
});

const item = (p: Partial<CartItem>): CartItem => ({ productId: "x", name: "n", code: "BSS", size: "", color: "", costPrice: 100, price: 180, quantity: 1, discount: 0, stock: 10, imageUrl: null, ...p });

describe("sale & profit calculation", () => {
  it("matches the spec example", () => {
    expect(lineProfit(100, 180, 2)).toEqual({ revenue: 360, cost: 200, grossProfit: 160 });
  });
  it("computes cart totals with discounts", () => {
    const t = cartTotals([item({ quantity: 2 }), item({ code: "RBS", costPrice: 210, price: 350, discount: 50 })], 30);
    expect(t).toMatchObject({ subtotal: 710, itemDiscount: 50, orderDiscount: 30, total: 630, cost: 410, profit: 220, items: 3 });
  });
  it("caps order discount", () => {
    expect(cartTotals([item({})], 500).total).toBe(0);
  });
  it("change due", () => {
    expect(changeDue(1500, 2000)).toBe(500);
    expect(changeDue(1500, 1000)).toBe(0);
  });
  it("net profit", () => {
    expect(netProfit(6320, 1250, 0)).toBe(5070);
  });
  it("refunds reconcile to the line total", () => {
    const a = refundFor(343.64, 2, 0, 1); const b = refundFor(343.64, 2, 1, 1);
    expect(a).toBe(171.82); expect(a + b).toBeCloseTo(343.64, 2);
    const parts = [refundFor(100, 3, 0, 1), refundFor(100, 3, 1, 1), refundFor(100, 3, 2, 1)];
    expect(parts.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 2);
  });
});

describe("dates", () => {
  it("builds Dhaka day bounds", () => {
    expect(dayStartISO("2026-09-24")).toBe("2026-09-23T18:00:00.000Z");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    const r = resolveRange("custom", "2026-09-10", "2026-09-01");
    expect(r).toEqual({ from: "2026-09-01", to: "2026-09-10" });
  });
});
