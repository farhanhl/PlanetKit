import { describe, it, expect } from "vitest";

describe("pdf-to-docx", () => {
  it("imports docx library correctly", async () => {
    const docx = await import("docx");
    expect(docx.Document).toBeDefined();
    expect(docx.Packer).toBeDefined();
    expect(docx.Paragraph).toBeDefined();
    expect(docx.TextRun).toBeDefined();
  });

  it("creates a document with paragraphs", async () => {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Hello World")],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("creates document with multiple pages", async () => {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");

    const paragraphs = [];
    for (let i = 1; i <= 3; i++) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(`--- Page ${i} ---`)],
          heading: "HEADING_1",
        })
      );
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(`Content for page ${i}`)],
        })
      );
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("text extraction groups items by empty strings", () => {
    const items = [
      { str: "Line one" },
      { str: "" },
      { str: "Line two" },
      { str: "continues" },
    ];

    const paragraphs: string[] = [];
    let current = "";
    for (const item of items) {
      if (item.str === "") {
        if (current) paragraphs.push(current);
        current = "";
      } else {
        current += (current ? " " : "") + item.str;
      }
    }
    if (current) paragraphs.push(current);

    expect(paragraphs).toEqual(["Line one", "Line two continues"]);
  });
});
