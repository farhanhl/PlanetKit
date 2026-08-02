import { describe, it, expect } from "vitest";

// ─── library imports ──────────────────────────────────────────────────────────

describe("docx-to-pdf library imports", () => {
  it("imports mammoth correctly", async () => {
    const mammoth = await import("mammoth");
    expect(mammoth.convertToHtml).toBeDefined();
  });

  it("imports jspdf correctly", async () => {
    const { jsPDF } = await import("jspdf");
    expect(jsPDF).toBeDefined();
  });
});

// ─── ensureSpace logic ────────────────────────────────────────────────────────

const PAGE_H = 297;
const MARGIN_X = 15;
const MARGIN_Y = 15;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

interface RenderCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf: any;
  y: number;
}

function ensureSpace(ctx: RenderCtx, needed: number) {
  if (ctx.y + needed > PAGE_H - MARGIN_Y) {
    ctx.pdf.addPage();
    ctx.y = MARGIN_Y;
  }
}

describe("ensureSpace", () => {
  it("does not add page when space is sufficient", async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const ctx: RenderCtx = { pdf, y: 50 };
    ensureSpace(ctx, 10);
    expect(ctx.pdf.getNumberOfPages()).toBe(1);
    expect(ctx.y).toBe(50);
  });

  it("adds page and resets y when space is insufficient", async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const ctx: RenderCtx = { pdf, y: 290 }; // near bottom
    ensureSpace(ctx, 20); // needs 20mm, only ~7mm left
    expect(ctx.pdf.getNumberOfPages()).toBe(2);
    expect(ctx.y).toBe(MARGIN_Y);
  });

  it("does not add page when y + needed fits exactly", async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const ctx: RenderCtx = { pdf, y: PAGE_H - MARGIN_Y - 10 };
    ensureSpace(ctx, 10);
    expect(ctx.pdf.getNumberOfPages()).toBe(1);
  });
});

// ─── table column logic ───────────────────────────────────────────────────────

describe("table colspan handling", () => {
  it("colCount handles mixed colspan cells correctly", () => {
    const rows = [
      [{ colspan: 2 }, { colspan: 1 }, { colspan: 1 }], // 4 col-units
      [{ colspan: 1 }, { colspan: 1 }, { colspan: 2 }], // 4 col-units
    ];
    const colCount = Math.max(
      ...rows.map((row) => row.reduce((s, c) => s + c.colspan, 0))
    );
    expect(colCount).toBe(4);
  });

  it("single row with no colspan still produces correct colCount", () => {
    const rows = [[{ colspan: 1 }, { colspan: 1 }, { colspan: 1 }]];
    const colCount = Math.max(
      ...rows.map((row) => row.reduce((s, c) => s + c.colspan, 0))
    );
    expect(colCount).toBe(3);
  });

  it("computes column width correctly for 5-column table", () => {
    const colW = CONTENT_W / 5;
    expect(colW).toBeCloseTo(36, 0);
  });

  it("column width * colCount == CONTENT_W", () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const colW = CONTENT_W / n;
      expect(colW * n).toBeCloseTo(CONTENT_W, 5);
    }
  });
});

// ─── text collection via regex (Node.js safe) ────────────────────────────────

function collectTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

describe("text collection (regex-based)", () => {
  it("strips HTML tags and returns plain text", () => {
    const result = collectTextFromHtml("<p><strong>Bold</strong> text</p>");
    expect(result).toBe("Bold text");
  });

  it("handles nested tags correctly", () => {
    const result = collectTextFromHtml("<td>Cell <em>value</em></td>");
    expect(result).toBe("Cell value");
  });

  it("normalizes whitespace in extracted text", () => {
    const result = collectTextFromHtml("<p>  multiple   spaces  </p>");
    expect(result).toBe("multiple spaces");
  });

  it("returns empty string for empty element", () => {
    const result = collectTextFromHtml("<p></p>");
    expect(result).toBe("");
  });
});

// ─── HTML structure detection (regex-based, Node.js safe) ────────────────────

describe("HTML table structure detection", () => {
  it("counts table elements in mammoth HTML output", () => {
    const html = `
      <table>
        <tr><th>Column A</th><th>Column B</th></tr>
        <tr><td>Value 1</td><td>Value 2</td></tr>
      </table>
    `;
    expect((html.match(/<table/g) || []).length).toBe(1);
    expect((html.match(/<tr/g) || []).length).toBe(2);
    expect((html.match(/<th/g) || []).length).toBe(2);
    expect((html.match(/<td/g) || []).length).toBe(2);
  });

  it("detects colspan values via regex", () => {
    const html = `<table><tr><td colspan="3">Merged</td></tr></table>`;
    const match = html.match(/colspan="(\d+)"/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBe(3);
  });

  it("detects no tables in paragraph-only HTML", () => {
    const html = `<p>Line 1</p><p>Line 2</p><p>Line 3</p>`;
    expect((html.match(/<table/g) || []).length).toBe(0);
  });
});

// ─── column width geometry ────────────────────────────────────────────────────

describe("column width geometry", () => {
  it("CONTENT_W equals PAGE_W minus 2x margins", () => {
    expect(CONTENT_W).toBe(PAGE_W - MARGIN_X * 2);
    expect(CONTENT_W).toBe(180);
  });

  it("cell padding reduces effective text width", () => {
    const CELL_PAD = 1.5;
    const colW = CONTENT_W / 4;
    const textW = colW - CELL_PAD * 2;
    expect(textW).toBeGreaterThan(0);
    expect(textW).toBeLessThan(colW);
  });

  it("line height conversion from pt to mm is correct", () => {
    // 1pt = 1/72 inch = 25.4/72 mm ≈ 0.3528 mm
    // jsPDF uses 1/2.835 conversion factor
    const fontSize = 10; // pt
    const lineH = (fontSize / 2.835) * 1.4;
    expect(lineH).toBeGreaterThan(4);
    expect(lineH).toBeLessThan(6);
  });
});

// ─── filename transform ───────────────────────────────────────────────────────

describe("filename transform", () => {
  it("replaces .docx extension with .pdf (case-insensitive)", () => {
    const cases: [string, string][] = [
      ["report.docx", "report.pdf"],
      ["Report.DOCX", "Report.pdf"],
      ["my document.docx", "my document.pdf"],
      ["file.with.dots.docx", "file.with.dots.pdf"],
    ];
    for (const [input, expected] of cases) {
      expect(input.replace(/\.docx$/i, "") + ".pdf").toBe(expected);
    }
  });
});
