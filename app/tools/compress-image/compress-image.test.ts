import { describe, it, expect } from "vitest";

describe("compress-image", () => {
  it("imports jszip correctly for multi-file", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    expect(typeof zip.file).toBe("function");
  });

  it("renames file extension correctly", () => {
    const testCases = [
      { input: "photo.png", expected: "photo.jpg" },
      { input: "image.jpeg", expected: "image.jpg" },
      { input: "my.pic.PNG", expected: "my.pic.jpg" },
    ];

    for (const { input, expected } of testCases) {
      const result = input.replace(/\.[^.]+$/, ".jpg");
      expect(result).toBe(expected);
    }
  });

  it("calculates resized dimensions maintaining aspect ratio", () => {
    function calcResize(
      origW: number,
      origH: number,
      maxWidth: number
    ): { w: number; h: number } {
      let w = origW;
      let h = origH;
      if (maxWidth > 0 && w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      return { w, h };
    }

    expect(calcResize(2000, 1000, 800)).toEqual({ w: 800, h: 400 });
    expect(calcResize(400, 300, 800)).toEqual({ w: 400, h: 300 });
    expect(calcResize(1920, 1080, 1920)).toEqual({ w: 1920, h: 1080 });
    expect(calcResize(1920, 1080, 0)).toEqual({ w: 1920, h: 1080 });
  });
});

describe("convert-image", () => {
  it("imports jszip via default export", async () => {
    const JSZip = (await import("jszip")).default;
    expect(JSZip).toBeDefined();
  });

  it("creates zip with converted images", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    const mimeTypes = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };

    const baseName = "photo";
    const ext = "png";

    zip.file(`${baseName}.${ext}`, new Uint8Array([1, 2, 3]));

    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    expect(buffer.length).toBeGreaterThan(0);

    const loaded = await JSZip.loadAsync(buffer);
    const file = loaded.file(`${baseName}.${ext}`);
    expect(file).not.toBeNull();
  });

  it("renames file extension based on output format", () => {
    const fileNames = ["image.png", "photo.jpeg", "pic.webp"];
    const outputFormat = "jpeg";

    for (const name of fileNames) {
      const baseName = name.replace(/\.[^.]+$/, "");
      const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
      expect(`${baseName}.${ext}`).not.toBe(name);
    }
  });
});
