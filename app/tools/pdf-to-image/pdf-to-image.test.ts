import { describe, it, expect } from "vitest";

describe("pdfjs-dist", () => {
  it("version string is accessible without full import", async () => {
    const pkg = await import("pdfjs-dist/package.json", { with: { type: "json" } });
    expect(pkg.default.version).toBeDefined();
    expect(pkg.default.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("worker file exists in build directory", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const workerPath = path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
    );
    expect(fs.existsSync(workerPath)).toBe(true);
  });
});

describe("pdf-to-image", () => {
  it("JSZip import pattern works", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    expect(typeof zip.file).toBe("function");
    expect(typeof zip.generateAsync).toBe("function");
  });

  it("can create zip with image blobs", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    const fakeBlob = new Uint8Array([1, 2, 3, 4]);
    zip.file("test_page_1.png", fakeBlob);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe("pdf-to-text", () => {
  it("text extraction logic works", () => {
    const textContent = {
      items: [
        { str: "Hello", transform: [1, 0, 0, 1, 0, 700] },
        { str: "World", transform: [1, 0, 0, 1, 50, 700] },
        { str: "", transform: [1, 0, 0, 1, 0, 680] },
        { str: "Second line", transform: [1, 0, 0, 1, 0, 680] },
      ],
    };

    const extracted = textContent.items
      .filter((item: { str: string }) => item.str)
      .map((item: { str: string }) => item.str)
      .join(" ");

    expect(extracted).toBe("Hello World Second line");
  });

  it("groups text items by Y coordinate", () => {
    const items = [
      { str: "Name", y: 700 },
      { str: "Age", y: 700 },
      { str: "Alice", y: 680 },
      { str: "30", y: 680 },
    ];

    const rows: Map<number, string[]> = new Map();
    for (const item of items) {
      const y = Math.round(item.y);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push(item.str);
    }

    const sortedRows = Array.from(rows.entries())
      .sort(([a], [b]) => b - a)
      .map(([, texts]) => texts);

    expect(sortedRows).toEqual([
      ["Name", "Age"],
      ["Alice", "30"],
    ]);
  });
});
