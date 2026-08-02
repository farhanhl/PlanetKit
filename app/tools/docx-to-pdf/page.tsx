"use client";

import { useState, useCallback, useRef } from "react";
import { FileDown } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

// ────────────────────────────────────────────────────────────
// Native jsPDF renderer — no html2canvas (vector output)
// ────────────────────────────────────────────────────────────

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 15;
const MARGIN_Y = 15;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

interface RenderCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf: any;
  y: number;
}

function ensureSpace(ctx: RenderCtx, needed: number) {
  if (ctx.y + needed > PAGE_H - MARGIN_Y) {
    ctx.pdf.addPage();
    ctx.y = MARGIN_Y;
  }
}

function renderText(
  ctx: RenderCtx,
  text: string,
  opts: {
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    indent?: number;
    lineHeightFactor?: number;
  } = {}
) {
  const {
    fontSize = 10,
    bold = false,
    italic = false,
    indent = 0,
    lineHeightFactor = 1.4,
  } = opts;

  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return;

  const style =
    bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";
  ctx.pdf.setFont("helvetica", style);
  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setTextColor(0, 0, 0);

  const maxW = CONTENT_W - indent;
  const lines: string[] = ctx.pdf.splitTextToSize(cleanText, maxW);
  const lineH = (fontSize / 2.835) * lineHeightFactor;

  for (const line of lines) {
    ensureSpace(ctx, lineH + 1);
    ctx.pdf.text(line, MARGIN_X + indent, ctx.y);
    ctx.y += lineH;
  }
}

function collectText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  let out = "";
  for (const child of Array.from(node.childNodes)) {
    out += collectText(child);
  }
  return out;
}

function renderParagraphEl(
  ctx: RenderCtx,
  el: Element,
  opts: { fontSize?: number; bold?: boolean; indent?: number } = {}
) {
  const { fontSize = 10, bold = false, indent = 0 } = opts;
  const fullText = collectText(el).replace(/\s+/g, " ").trim();
  if (!fullText) {
    ctx.y += (fontSize / 2.835) * 0.5;
    return;
  }
  renderText(ctx, fullText, { fontSize, bold, indent });
  ctx.y += (fontSize / 2.835) * 0.25;
}

function renderTable(ctx: RenderCtx, table: Element) {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length === 0) return;

  const FONT_SIZE = 8;
  const CELL_PAD = 1.5;
  const lineH = (FONT_SIZE / 2.835) * 1.35;

  type CellData = { text: string; colspan: number; isHeader: boolean };

  const grid: CellData[][] = rows.map((tr) =>
    Array.from(tr.querySelectorAll("th, td")).map((cell) => ({
      text: collectText(cell).replace(/\s+/g, " ").trim(),
      colspan: Math.max(1, parseInt((cell as HTMLElement).getAttribute("colspan") ?? "1", 10) || 1),
      isHeader: cell.tagName.toLowerCase() === "th",
    }))
  );

  const colCount = Math.max(...grid.map((row) => row.reduce((s, c) => s + c.colspan, 0)));
  if (colCount === 0) return;

  const colW = CONTENT_W / colCount;

  // Measure row heights
  const rowHeights: number[] = grid.map((row) => {
    let maxLines = 1;
    for (const cell of row) {
      const cellW = colW * cell.colspan - CELL_PAD * 2;
      ctx.pdf.setFont("helvetica", cell.isHeader ? "bold" : "normal");
      ctx.pdf.setFontSize(FONT_SIZE);
      const ls: string[] = ctx.pdf.splitTextToSize(cell.text, Math.max(cellW, 1));
      maxLines = Math.max(maxLines, ls.length);
    }
    return Math.max(lineH + CELL_PAD * 2, maxLines * lineH + CELL_PAD * 2);
  });

  ctx.pdf.setDrawColor(100, 100, 100);
  ctx.pdf.setLineWidth(0.2);

  for (let r = 0; r < grid.length; r++) {
    const rowH = rowHeights[r];
    ensureSpace(ctx, rowH + 0.5);

    let xCursor = MARGIN_X;

    for (const cell of grid[r]) {
      const cellW = colW * cell.colspan;

      // Fill
      if (cell.isHeader) {
        ctx.pdf.setFillColor(210, 210, 210);
      } else if (r % 2 === 0) {
        ctx.pdf.setFillColor(248, 248, 248);
      } else {
        ctx.pdf.setFillColor(255, 255, 255);
      }
      ctx.pdf.rect(xCursor, ctx.y, cellW, rowH, "F");

      // Border
      ctx.pdf.setDrawColor(120, 120, 120);
      ctx.pdf.rect(xCursor, ctx.y, cellW, rowH, "S");

      // Text
      ctx.pdf.setFont("helvetica", cell.isHeader ? "bold" : "normal");
      ctx.pdf.setFontSize(FONT_SIZE);
      ctx.pdf.setTextColor(0, 0, 0);

      const textW = Math.max(cellW - CELL_PAD * 2, 1);
      const lines: string[] = ctx.pdf.splitTextToSize(cell.text, textW);
      for (let li = 0; li < lines.length; li++) {
        ctx.pdf.text(
          lines[li],
          xCursor + CELL_PAD,
          ctx.y + CELL_PAD + lineH * (li + 0.75)
        );
      }

      xCursor += cellW;
    }

    ctx.y += rowH;
  }

  ctx.y += 3;
}

function renderNode(ctx: RenderCtx, node: Node, listDepth = 0) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = (node.textContent ?? "").replace(/\s+/g, " ").trim();
    if (t) renderText(ctx, t);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "h1":
      ctx.y += 2;
      renderParagraphEl(ctx, el, { fontSize: 18, bold: true });
      ctx.y += 1.5;
      break;
    case "h2":
      ctx.y += 1.5;
      renderParagraphEl(ctx, el, { fontSize: 14, bold: true });
      ctx.y += 1;
      break;
    case "h3":
    case "h4":
      ctx.y += 1;
      renderParagraphEl(ctx, el, { fontSize: 11, bold: true });
      ctx.y += 0.5;
      break;
    case "h5":
    case "h6":
      renderParagraphEl(ctx, el, { fontSize: 10, bold: true });
      break;
    case "p": {
      renderParagraphEl(ctx, el, { fontSize: 10 });
      ctx.y += 1;
      break;
    }
    case "table":
      ctx.y += 2;
      renderTable(ctx, el);
      ctx.y += 1;
      break;
    case "ul":
    case "ol": {
      const isOrdered = tag === "ol";
      let itemIdx = 0;
      for (const child of Array.from(el.childNodes)) {
        if ((child as Element).tagName?.toLowerCase() !== "li") continue;
        const liEl = child as Element;
        const text = collectText(liEl).replace(/\s+/g, " ").trim();
        const bullet = isOrdered ? `${++itemIdx}. ` : "• ";
        const indent = listDepth * 5 + 3;
        renderText(ctx, bullet + text, { fontSize: 10, indent });
      }
      ctx.y += 1;
      break;
    }
    case "br":
      ctx.y += (10 / 2.835) * 0.7;
      break;
    case "hr":
      ctx.y += 2;
      ctx.pdf.setDrawColor(180, 180, 180);
      ctx.pdf.setLineWidth(0.3);
      ctx.pdf.line(MARGIN_X, ctx.y, MARGIN_X + CONTENT_W, ctx.y);
      ctx.y += 2;
      break;
    case "strong":
    case "b":
    case "em":
    case "i":
    case "u":
    case "span": {
      const t = collectText(el).replace(/\s+/g, " ").trim();
      if (t) {
        renderText(ctx, t, {
          bold: ["strong", "b"].includes(tag),
          italic: ["em", "i"].includes(tag),
        });
      }
      break;
    }
    // Table internal elements handled by renderTable
    case "th":
    case "td":
    case "tr":
    case "thead":
    case "tbody":
    case "tfoot":
      break;
    default:
      for (const child of Array.from(el.childNodes)) {
        renderNode(ctx, child, listDepth);
      }
  }
}

export default function DocxToPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [htmlPreview, setHtmlPreview] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      setError(null);
      setHtmlPreview("");

      try {
        const mammoth = await import("mammoth");
        const buffer = await f.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setHtmlPreview(result.value || "<p>No content found</p>");
      } catch {
        setError(t.docxToPdfReadFailed);
      }
    },
    [t.docxToPdfReadFailed]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setHtmlPreview("");
  }, []);

  const convert = async () => {
    if (!file || !htmlPreview) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(15);
      const { jsPDF } = await import("jspdf");
      setProgress(30);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlPreview, "text/html");

      setProgress(50);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const ctx: RenderCtx = { pdf, y: MARGIN_Y };

      const bodyChildren = Array.from(doc.body.childNodes);
      const total = bodyChildren.length || 1;

      for (let i = 0; i < bodyChildren.length; i++) {
        renderNode(ctx, bodyChildren[i]);
        setProgress(50 + Math.round((i / total) * 45));
      }

      setProgress(97);

      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.docx$/i, "") + ".pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setProgress(100);
    } catch {
      setError(t.docxToPdfFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout title={t.docxToPdfTitle} description={t.docxToPdfDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".docx"
            label={t.docxToPdfDrop}
            description={t.docxToPdfDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {htmlPreview && (
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
              <div className="border-b border-border px-4 py-2">
                <h3 className="text-sm font-semibold text-foreground">{t.docxToPdfPreview}</h3>
              </div>
              <div className="overflow-auto p-6">
                <div
                  ref={previewRef}
                  className="mx-auto w-[794px] min-w-0 bg-white p-12 text-black [font-family:'Helvetica',Arial,sans-serif] [font-size:10pt] [line-height:1.4]
                    [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-[8pt]
                    [&_th]:border [&_th]:border-gray-400 [&_th]:bg-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-bold [&_th]:text-left [&_th]:align-top
                    [&_td]:border [&_td]:border-gray-400 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2.5
                    [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-2
                    [&_h4]:font-bold [&_h4]:my-1.5
                    [&_p]:my-1 [&_p]:leading-relaxed
                    [&_ul]:ml-6 [&_ol]:ml-6 [&_li]:mb-1
                    [&_strong]:font-bold [&_em]:italic
                    [&_img]:max-w-full [&_img]:h-auto"
                  dangerouslySetInnerHTML={{ __html: htmlPreview }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.docxToPdfNote}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.convertingToPdf} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!file || !htmlPreview || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileDown className="h-4 w-4" />
              {processing ? t.converting : t.convertToPdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
