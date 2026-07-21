import { describe, it, expect } from "vitest";

describe("jszip import pattern", () => {
  it("imports JSZip correctly via default export", async () => {
    const JSZip = (await import("jszip")).default;
    expect(JSZip).toBeDefined();
    expect(typeof JSZip).toBe("function");
  });

  it("creates a new JSZip instance", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    expect(zip).toBeDefined();
    expect(typeof zip.file).toBe("function");
    expect(typeof zip.generateAsync).toBe("function");
  });

  it("adds files and generates a valid zip", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    zip.file("test.txt", "hello world");
    zip.file("data.json", JSON.stringify({ key: "value" }));

    const blob = await zip.generateAsync({ type: "nodebuffer" });
    expect(blob).toBeDefined();
    expect(blob.length).toBeGreaterThan(0);
  });

  it("loads an existing zip and reads files", async () => {
    const JSZip = (await import("jszip")).default;

    const original = new JSZip();
    original.file("hello.txt", "Hello!");
    const buffer = await original.generateAsync({ type: "nodebuffer" });

    const loaded = await JSZip.loadAsync(buffer);
    const content = await loaded.file("hello.txt")!.async("string");
    expect(content).toBe("Hello!");
  });
});

describe("ppt-to-pdf", () => {
  it("extracts text from PPTX slide XML via regex", () => {
    const slideXml = `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Hello World</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    const texts: string[] = [];
    const regex = /<a:t>([^<]*)<\/a:t>/g;
    let match;
    while ((match = regex.exec(slideXml)) !== null) {
      texts.push(match[1]);
    }

    expect(texts).toEqual(["Hello World"]);
  });

  it("extracts multiple text elements from slide via regex", () => {
    const slideXml = `<?xml version="1.0"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree>
    <p:sp><p:txBody>
      <a:p><a:r><a:t>Title</a:t></a:r></a:p>
    </p:txBody></p:sp>
    <p:sp><p:txBody>
      <a:p><a:r><a:t>Subtitle</a:t></a:r></a:p>
    </p:txBody></p:sp>
  </p:spTree></p:cSld>
</p:sld>`;

    const texts: string[] = [];
    const regex = /<a:t>([^<]*)<\/a:t>/g;
    let match;
    while ((match = regex.exec(slideXml)) !== null) {
      texts.push(match[1]);
    }

    expect(texts).toEqual(["Title", "Subtitle"]);
  });
});
