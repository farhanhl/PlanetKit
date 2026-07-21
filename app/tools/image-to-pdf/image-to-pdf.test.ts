import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";

async function createImageToPdf(
  imageData: { bytes: ArrayBuffer; width: number; height: number; type: "png" | "jpg" }[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (const img of imageData) {
    let embedded;
    if (img.type === "png") {
      embedded = await pdf.embedPng(img.bytes);
    } else {
      embedded = await pdf.embedJpg(img.bytes);
    }
    const page = pdf.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  return pdf.save();
}

describe("image-to-pdf", () => {
  it("imports pdf-lib and creates a valid empty PDF", async () => {
    const pdf = await PDFDocument.create();
    const bytes = await pdf.save();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("can create a multi-page PDF with pages sized to dimensions", async () => {
    const pdf = await PDFDocument.create();

    const page1 = pdf.addPage([100, 80]);
    expect(page1.getSize()).toEqual({ width: 100, height: 80 });

    const page2 = pdf.addPage([200, 150]);
    expect(page2.getSize()).toEqual({ width: 200, height: 150 });

    const bytes = await pdf.save();
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(2);
  });
});
