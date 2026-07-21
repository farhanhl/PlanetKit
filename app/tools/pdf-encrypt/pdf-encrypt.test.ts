import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { encryptPdf } from "@/app/lib/pdf-encrypt";

describe("pdf-encrypt", () => {
  it("encryptPdf produces valid PDF bytes", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([595, 842]);
    const plainBytes = await pdf.save();

    const encrypted = await encryptPdf(plainBytes, "secret");
    expect(encrypted).toBeInstanceOf(Uint8Array);
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("encrypted PDF has valid header", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([595, 842]);
    const plainBytes = await pdf.save();

    const encrypted = await encryptPdf(plainBytes, "mypassword");
    expect(encrypted[0]).toBe(0x25); // %
    expect(encrypted[1]).toBe(0x50); // P
    expect(encrypted[2]).toBe(0x44); // D
    expect(encrypted[3]).toBe(0x46); // F
  });

  it("encrypted PDF contains Encrypt dict in trailer", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([595, 842]);
    const plainBytes = await pdf.save();

    const encrypted = await encryptPdf(plainBytes, "test");
    const text = new TextDecoder().decode(encrypted);
    expect(text).toContain("/Encrypt");
    expect(text).toContain("/Standard");
  });

  it("output filename pattern works", () => {
    const fileName = "document.pdf";
    const result = fileName.replace(/\.pdf$/i, "_encrypted.pdf");
    expect(result).toBe("document_encrypted.pdf");
  });
});
