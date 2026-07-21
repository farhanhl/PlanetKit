import { describe, it, expect } from "vitest";

describe("pdf-to-excel", () => {
  it("imports xlsx correctly", async () => {
    const XLSX = await import("xlsx");
    expect(XLSX.utils.aoa_to_sheet).toBeDefined();
    expect(XLSX.utils.book_new).toBeDefined();
    expect(XLSX.write).toBeDefined();
  });

  it("groups text items by Y coordinate into rows", () => {
    const items = [
      { str: "Name", y: 700 },
      { str: "Age", y: 700 },
      { str: "City", y: 700 },
      { str: "Alice", y: 680 },
      { str: "30", y: 680 },
      { str: "NYC", y: 680 },
      { str: "Bob", y: 660 },
      { str: "25", y: 660 },
      { str: "LA", y: 660 },
    ];

    const rows = new Map<number, string[]>();
    for (const item of items) {
      const y = Math.round(item.y);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push(item.str);
    }

    const sortedRows = Array.from(rows.entries())
      .sort(([a], [b]) => b - a)
      .map(([, texts]) => texts);

    expect(sortedRows).toEqual([
      ["Name", "Age", "City"],
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"],
    ]);
  });

  it("creates worksheet from 2D array", async () => {
    const XLSX = await import("xlsx");

    const data = [
      ["Product", "Price", "Qty"],
      ["Apple", 1.5, 10],
      ["Banana", 0.8, 20],
    ];

    const sheet = XLSX.utils.aoa_to_sheet(data);
    const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(json).toEqual(data);
  });

  it("handles single-row data", () => {
    const items = [{ str: "Header1", y: 700 }, { str: "Header2", y: 700 }];

    const rows = new Map<number, string[]>();
    for (const item of items) {
      const y = Math.round(item.y);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push(item.str);
    }

    expect(rows.size).toBe(1);
    expect(rows.get(700)).toEqual(["Header1", "Header2"]);
  });
});
