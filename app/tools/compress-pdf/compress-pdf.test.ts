import { describe, it, expect } from "vitest";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

describe("compress-pdf", () => {
  describe("formatSize", () => {
    it("formats bytes", () => {
      expect(formatSize(512)).toBe("512 B");
    });

    it("formats kilobytes", () => {
      expect(formatSize(1536)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
      expect(formatSize(2 * 1024 * 1024)).toBe("2.0 MB");
    });

    it("formats zero", () => {
      expect(formatSize(0)).toBe("0 B");
    });
  });

  it("imports pdf-lib correctly", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    expect(pdf).toBeDefined();
    expect(pdf.getPageCount()).toBe(0);
  });

  it("compresses PDF by stripping metadata and using object streams", async () => {
    const { PDFDocument } = await import("pdf-lib");

    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.setTitle("Test Title");
    pdf.setAuthor("Test Author");

    const originalBytes = await pdf.save();

    pdf.setTitle("");
    pdf.setAuthor("");
    pdf.setSubject("");
    pdf.setKeywords([]);
    pdf.setProducer("");
    pdf.setCreator("");

    const compressedBytes = await pdf.save({ useObjectStreams: true });

    expect(compressedBytes).toBeInstanceOf(Uint8Array);
    expect(compressedBytes.length).toBeGreaterThan(0);
    expect(compressedBytes.length).toBeLessThanOrEqual(originalBytes.length);
  });

  it("loads and re-saves a valid PDF", async () => {
    const { PDFDocument } = await import("pdf-lib");

    const original = await PDFDocument.create();
    original.addPage([595, 842]);
    const bytes = await original.save();

    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
  });
});
