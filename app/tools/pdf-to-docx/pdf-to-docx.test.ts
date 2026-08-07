import { describe, it, expect } from "vitest";
import {
  groupByRow,
  detectTableColumns,
  assignToColumns,
  rowToText,
  cleanOcrTextLine,
} from "./page";

// ─── helpers ──────────────────────────────────────────────────────────────────

function tok(str: string, x: number, y: number, width = str.length * 7) {
  return { str, x, y, width };
}

// ─── groupByRow ───────────────────────────────────────────────────────────────

describe("groupByRow", () => {
  it("groups tokens with same Y into one row", () => {
    const tokens = [tok("A", 10, 100), tok("B", 80, 100), tok("C", 10, 50)];
    const rows = groupByRow(tokens);
    expect(rows).toHaveLength(2);
    // top row (higher Y in PDF = top of page) comes first
    expect(rows[0].y).toBe(100);
    expect(rows[0].tokens).toHaveLength(2);
  });

  it("applies yTolerance when grouping", () => {
    const tokens = [tok("A", 10, 100), tok("B", 80, 103)]; // 3-unit gap < default 4
    const rows = groupByRow(tokens, 4);
    expect(rows).toHaveLength(1);
  });

  it("ignores whitespace-only tokens", () => {
    const tokens = [tok("  ", 10, 100), tok("Hello", 50, 100)];
    const rows = groupByRow(tokens);
    expect(rows[0].tokens).toHaveLength(1);
    expect(rows[0].tokens[0].str).toBe("Hello");
  });

  it("sorts rows top-to-bottom (descending Y)", () => {
    const tokens = [tok("Low", 10, 20), tok("High", 10, 700)];
    const rows = groupByRow(tokens);
    expect(rows[0].y).toBe(700);
    expect(rows[1].y).toBe(20);
  });

  it("sorts tokens within a row left-to-right (ascending X)", () => {
    const tokens = [tok("Second", 200, 100), tok("First", 10, 100)];
    const rows = groupByRow(tokens);
    expect(rows[0].tokens[0].str).toBe("First");
    expect(rows[0].tokens[1].str).toBe("Second");
  });
});

// ─── detectTableColumns ───────────────────────────────────────────────────────

describe("detectTableColumns", () => {
  const PAGE_W = 612;

  function makeTableRows() {
    // Simulate a 3-column table: col0=50, col1=250, col2=450
    return [
      { y: 700, tokens: [tok("Name", 50, 700), tok("Age", 250, 700), tok("City", 450, 700)] },
      { y: 680, tokens: [tok("Alice", 50, 680), tok("30", 250, 680), tok("Jakarta", 450, 680)] },
      { y: 660, tokens: [tok("Bob", 50, 660), tok("25", 250, 660), tok("Bali", 450, 660)] },
    ];
  }

  it("detects 3 columns in a table-shaped layout", () => {
    const cols = detectTableColumns(makeTableRows(), PAGE_W);
    expect(cols).not.toBeNull();
    expect(cols!.length).toBeGreaterThanOrEqual(2);
  });

  it("returns null for a single-column layout", () => {
    const rows = [
      { y: 700, tokens: [tok("Hello world", 50, 700)] },
      { y: 680, tokens: [tok("Another line", 50, 680)] },
    ];
    const cols = detectTableColumns(rows, PAGE_W);
    expect(cols).toBeNull();
  });

  it("returns null when fewer than 2 rows provided", () => {
    const rows = [{ y: 700, tokens: [tok("A", 50, 700), tok("B", 300, 700)] }];
    expect(detectTableColumns(rows, PAGE_W)).toBeNull();
  });

  it("returns null when fewer than 4 tokens total", () => {
    const rows = [
      { y: 700, tokens: [tok("A", 50, 700)] },
      { y: 680, tokens: [tok("B", 300, 680)] },
    ];
    expect(detectTableColumns(rows, PAGE_W)).toBeNull();
  });
});

// ─── assignToColumns ──────────────────────────────────────────────────────────

describe("assignToColumns", () => {
  it("assigns tokens to correct columns", () => {
    const columns = [50, 250, 450];
    const tokens = [tok("Name", 50, 700), tok("Age", 252, 700), tok("City", 453, 700)];
    const cells = assignToColumns(tokens, columns);
    expect(cells[0]).toBe("Name");
    expect(cells[1]).toBe("Age");
    expect(cells[2]).toBe("City");
  });

  it("concatenates multiple tokens in the same column with space", () => {
    const columns = [50, 300];
    const tokens = [tok("Hello", 50, 700), tok("World", 60, 700), tok("Right", 300, 700)];
    const cells = assignToColumns(tokens, columns);
    expect(cells[0]).toBe("Hello World");
    expect(cells[1]).toBe("Right");
  });

  it("returns empty strings for columns with no tokens", () => {
    const columns = [50, 250, 450];
    const tokens = [tok("Only left", 50, 700)];
    const cells = assignToColumns(tokens, columns);
    expect(cells[0]).toBe("Only left");
    expect(cells[1]).toBe("");
    expect(cells[2]).toBe("");
  });
});

// ─── rowToText ────────────────────────────────────────────────────────────────

describe("rowToText", () => {
  it("returns empty string for empty row", () => {
    expect(rowToText({ y: 100, tokens: [] })).toBe("");
  });

  it("returns single token text unchanged", () => {
    const row = { y: 100, tokens: [tok("Hello", 10, 100, 35)] };
    expect(rowToText(row)).toBe("Hello");
  });

  it("inserts space when gap between tokens is large", () => {
    // tok("Hello", x=10, width=35) → right edge at 45
    // tok("World", x=100) → gap = 55, charW = 35/5 = 7, 55 > 7*0.4 → space
    const row = { y: 100, tokens: [tok("Hello", 10, 100, 35), tok("World", 100, 100, 35)] };
    expect(rowToText(row)).toBe("Hello World");
  });

  it("does NOT insert space when tokens are adjacent", () => {
    // tok("Hel", x=10, width=21) → right edge at 31
    // tok("lo", x=31) → gap = 0, no space
    const row = { y: 100, tokens: [{ str: "Hel", x: 10, y: 100, width: 21 }, { str: "lo", x: 31, y: 100, width: 14 }] };
    expect(rowToText(row)).toBe("Hello");
  });
});

// ─── docx library integration ─────────────────────────────────────────────────

describe("pdf-to-docx docx library", () => {
  it("imports required symbols including Table exports", async () => {
    const docx = await import("docx");
    expect(docx.Document).toBeDefined();
    expect(docx.Packer).toBeDefined();
    expect(docx.Paragraph).toBeDefined();
    expect(docx.TextRun).toBeDefined();
    expect(docx.Table).toBeDefined();
    expect(docx.TableRow).toBeDefined();
    expect(docx.TableCell).toBeDefined();
    expect(docx.WidthType).toBeDefined();
    expect(docx.BorderStyle).toBeDefined();
  });

  it("creates a DOCX document with a table", async () => {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } =
      await import("docx");

    const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
    const doc = new Document({
      sections: [
        {
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: ["Name", "Age"].map(
                    (text) =>
                      new TableCell({
                        borders: { top: border, bottom: border, left: border, right: border },
                        children: [new Paragraph({ children: [new TextRun(text)] })],
                      })
                  ),
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    expect(blob.size).toBeGreaterThan(0);
  });
});

// ─── cleanOcrTextLine ─────────────────────────────────────────────────────────

describe("cleanOcrTextLine", () => {
  it("normalizes form field labels with dotted underline lines", () => {
    expect(cleanOcrTextLine("Nama NE OE SR")).toBe(
      "Nama : ............................................................................................"
    );
    expect(cleanOcrTextLine("Tempat/Tgl Lahir 3! ior snbaachien oda Anid AASB EIA")).toBe(
      "Tempat, Tgl Lahir : ............................................................................................"
    );
    expect(cleanOcrTextLine("Sekolah REA")).toBe(
      "Sekolah : ............................................................................................"
    );
  });

  it("filters out garbage header logo fragments", () => {
    expect(cleanOcrTextLine("Palang KOTA")).toBe("");
    expect(cleanOcrTextLine("Pp) Merah | | JAKARTA")).toBe("");
    expect(cleanOcrTextLine("Indonesia UTARA")).toBe("");
  });

  it("normalizes city date lines", () => {
    expect(cleanOcrTextLine("Jakarta, ..........i...... 2026")).toBe(
      "Jakarta, .................................... 2026"
    );
  });

  it("preserves standard body paragraphs", () => {
    const paragraph =
      "1. Bersedia mengikuti seluruh rangkaian proses seleksi International Exchange Program";
    expect(cleanOcrTextLine(paragraph)).toBe(paragraph);
  });
});

