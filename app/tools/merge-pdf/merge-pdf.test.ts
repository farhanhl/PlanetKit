import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";

async function mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

async function createTestPdf(pageCount: number): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842]);
  }
  return pdf.save();
}

describe("merge-pdf", () => {
  it("merges two PDFs", async () => {
    const pdf1 = await createTestPdf(2);
    const pdf2 = await createTestPdf(3);

    const result = await mergePdfs([pdf1.buffer, pdf2.buffer]);
    const merged = await PDFDocument.load(result);

    expect(merged.getPageCount()).toBe(5);
  });

  it("merges single PDF", async () => {
    const pdf = await createTestPdf(4);
    const result = await mergePdfs([pdf.buffer]);
    const merged = await PDFDocument.load(result);

    expect(merged.getPageCount()).toBe(4);
  });

  it("merges empty list produces valid PDF", async () => {
    const result = await mergePdfs([]);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("produces valid PDF bytes", async () => {
    const pdf = await createTestPdf(1);
    const result = await mergePdfs([pdf.buffer]);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe(0x25); // % (PDF magic byte)
    expect(result[1]).toBe(0x50); // P
    expect(result[2]).toBe(0x44); // D
    expect(result[3]).toBe(0x46); // F
  });
});
