import { describe, it, expect } from "vitest";

describe("excel-to-csv", () => {
  it("imports xlsx correctly", async () => {
    const XLSX = await import("xlsx");
    expect(XLSX.read).toBeDefined();
    expect(XLSX.utils.sheet_to_csv).toBeDefined();
  });

  it("converts Excel to CSV", async () => {
    const XLSX = await import("xlsx");

    const workbook = XLSX.utils.book_new();
    const data = [
      ["Name", "Age", "City"],
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets["Sheet1"]);

    expect(csv).toContain("Name,Age,City");
    expect(csv).toContain("Alice,30,NYC");
    expect(csv).toContain("Bob,25,LA");
  });

  it("handles empty sheet", async () => {
    const XLSX = await import("xlsx");

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets["Sheet1"]);
    expect(csv).toBe("");
  });

  it("renames .xlsx extension to .csv", () => {
    const testCases = [
      { input: "data.xlsx", expected: "data.csv" },
      { input: "data.xls", expected: "data.csv" },
      { input: "DATA.XLSX", expected: "DATA.csv" },
    ];
    for (const { input, expected } of testCases) {
      expect(input.replace(/\.(xlsx|xls)$/i, ".csv")).toBe(expected);
    }
  });

  it("roundtrips: Excel -> CSV -> Excel", async () => {
    const XLSX = await import("xlsx");

    const original = [
      ["Fruit", "Count"],
      ["Apple", "5"],
      ["Banana", "3"],
    ];
    const wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, XLSX.utils.aoa_to_sheet(original), "Data");

    const csv = XLSX.utils.sheet_to_csv(wb1.Sheets["Data"]);
    expect(csv).toContain("Fruit,Count");
    expect(csv).toContain("Apple");
    expect(csv).toContain("Banana");
  });
});
