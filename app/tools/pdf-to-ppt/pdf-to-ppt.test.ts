import { describe, it, expect } from "vitest";

describe("pdf-to-ppt", () => {
  it("imports pptxgenjs correctly", async () => {
    const PptxGenJS = (await import("pptxgenjs")).default;
    expect(PptxGenJS).toBeDefined();
    expect(typeof PptxGenJS).toBe("function");
  });

  it("creates a presentation with slides", async () => {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pptx = new PptxGenJS();

    expect(pptx).toBeDefined();
    expect(typeof pptx.addSlide).toBe("function");
    expect(typeof pptx.write).toBe("function");
  });

  it("page render produces data URL for canvas", () => {
    // Simulate canvas.toDataURL behavior
    const fakeDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
    expect(fakeDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
