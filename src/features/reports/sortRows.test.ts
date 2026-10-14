import { describe, expect, it } from "vitest";
import { sortRows } from "./sortRows";
import type { BreakdownRow } from "./types";

describe("Sorting", () => {
  const sampleRows: BreakdownRow[] = [
    {
      key: "k1",
      name: "Colombo Central",
      orderCount: 15,
      salesValue: 250000,
      averageOrderValue: 16666.67,
    },
    {
      key: "k2",
      name: "Kandy North",
      orderCount: 25,
      salesValue: 180000,
      averageOrderValue: 7200,
    },
    {
      key: "k3",
      name: "Galle Fort",
      orderCount: 10,
      salesValue: 500000,
      averageOrderValue: 50000,
    },
    {
      key: "k4",
      name: "Jaffna Town",
      orderCount: 25,
      salesValue: 250000,
      averageOrderValue: 10000,
    },
  ];

  it("sorts text column alphabetically ascending and descending", () => {
    const asc = sortRows(sampleRows, "name", "asc");
    expect(asc.map((r) => r.name)).toEqual([
      "Colombo Central",
      "Galle Fort",
      "Jaffna Town",
      "Kandy North",
    ]);

    const desc = sortRows(sampleRows, "name", "desc");
    expect(desc.map((r) => r.name)).toEqual([
      "Kandy North",
      "Jaffna Town",
      "Galle Fort",
      "Colombo Central",
    ]);
  });

  it("sorts numeric column ascending and descending", () => {
    const ascSales = sortRows(sampleRows, "salesValue", "asc");
    expect(ascSales.map((r) => r.salesValue)).toEqual([180000, 250000, 250000, 500000]);

    const descSales = sortRows(sampleRows, "salesValue", "desc");
    expect(descSales.map((r) => r.salesValue)).toEqual([500000, 250000, 250000, 180000]);

    const ascAov = sortRows(sampleRows, "averageOrderValue", "asc");
    expect(ascAov.map((r) => r.averageOrderValue)).toEqual([7200, 10000, 16666.67, 50000]);
  });

  it("maintains stable order on ties according to original index", () => {
    // k1 and k4 have the same salesValue: 250000; k1 came before k4
    const descSales = sortRows(sampleRows, "salesValue", "desc");
    const tiedSales = descSales.filter((r) => r.salesValue === 250000);
    expect(tiedSales[0]?.key).toBe("k1");
    expect(tiedSales[1]?.key).toBe("k4");

    // k2 and k4 have the same orderCount: 25; k2 came before k4
    const descOrders = sortRows(sampleRows, "orderCount", "desc");
    const tiedOrders = descOrders.filter((r) => r.orderCount === 25);
    expect(tiedOrders[0]?.key).toBe("k2");
    expect(tiedOrders[1]?.key).toBe("k4");
  });

  it("does not mutate the original rows array", () => {
    const copy = [...sampleRows];
    sortRows(sampleRows, "salesValue", "asc");
    expect(sampleRows).toEqual(copy);
  });
});
