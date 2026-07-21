import { describe, it, expect } from "vitest";

describe("csv-to-excel", () => {
  it("imports xlsx correctly", async () => {
    const XLSX = await import("xlsx");
    expect(XLSX.read).toBeDefined();
    expect(XLSX.utils).toBeDefined();
    expect(XLSX.writeFile).toBeDefined();
  });

  it("converts CSV text to Excel workbook", async () => {
    const XLSX = await import("xlsx");

    const csvText = "Name,Age,City\nAlice,30,NYC\nBob,25,LA";
    const buffer = new TextEncoder().encode(csvText).buffer;
    const workbook = XLSX.read(buffer, { type: "array" });

    expect(workbook.SheetNames.length).toBe(1);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data[0]).toEqual(["Name", "Age", "City"]);
    expect(data[1][0]).toBe("Alice");
    expect(data[2][0]).toBe("Bob");
  });

  it("handles empty CSV", async () => {
    const XLSX = await import("xlsx");

    const csvText = "A,B\n";
    const buffer = new TextEncoder().encode(csvText).buffer;
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data.length).toBe(1);
    expect(data[0]).toEqual(["A", "B"]);
  });

  it("handles CSV with special characters", async () => {
    const XLSX = await import("xlsx");

    const csvText = 'Name,Description\nTest,"Hello, World"';
    const buffer = new TextEncoder().encode(csvText).buffer;
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data[1][1]).toBe("Hello, World");
  });

  it("renames .csv extension to .xlsx", () => {
    const fileName = "data.csv";
    const result = fileName.replace(/\.csv$/i, ".xlsx");
    expect(result).toBe("data.xlsx");
  });
});
