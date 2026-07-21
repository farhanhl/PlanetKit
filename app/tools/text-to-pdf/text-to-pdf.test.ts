import { describe, it, expect } from "vitest";

const PAGE_SIZES: Record<string, { w: number; h: number }> = {
  A4: { w: 595, h: 842 },
  Letter: { w: 612, h: 792 },
  Legal: { w: 612, h: 1008 },
};

describe("text-to-pdf", () => {
  it("page sizes are valid", () => {
    for (const [name, size] of Object.entries(PAGE_SIZES)) {
      expect(size.w).toBeGreaterThan(0);
      expect(size.h).toBeGreaterThan(0);
      expect(size.h).toBeGreaterThan(size.w);
    }
  });

  it("calculates maxLines correctly", () => {
    const margin = 40;
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const { w, h } = PAGE_SIZES.A4;
    const maxWidth = w - margin * 2;
    const maxLines = Math.floor((h - margin * 2) / lineHeight);

    expect(maxWidth).toBe(515);
    expect(maxLines).toBe(42);
  });

  it("detects page overflow", () => {
    const maxLines = 50;
    let lineCount = 0;
    let pageCount = 1;

    for (let i = 0; i < 60; i++) {
      if (lineCount >= maxLines) {
        pageCount++;
        lineCount = 0;
      }
      lineCount++;
    }

    expect(pageCount).toBe(2);
  });

  it("imports jspdf correctly", async () => {
    const { jsPDF } = await import("jspdf");
    expect(jsPDF).toBeDefined();
    expect(typeof jsPDF).toBe("function");
  });

  it("creates a PDF with jspdf", async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: [595, 842] });

    pdf.setFontSize(12);
    pdf.text("Hello World", 40, 40);

    const output = pdf.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(0);
  });
});
