"use client";

import { useState, useCallback } from "react";
import { FileDown } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface TextToken {
  str: string;
  x: number;
  y: number;
  width: number;
}

interface GridRow {
  y: number;
  tokens: TextToken[];
}

// ────────────────────────────────────────────────────────────
// Pure helpers (exported for testing)
// ────────────────────────────────────────────────────────────

/**
 * Group raw text tokens by rounded Y coordinate (same visual row).
 * PDF Y-axis is bottom-up, so we sort descending (top of page first).
 */
export function groupByRow(tokens: TextToken[], yTolerance = 4): GridRow[] {
  const rows: GridRow[] = [];
  for (const token of tokens) {
    if (!token.str.trim()) continue;
    const existing = rows.find((r) => Math.abs(r.y - token.y) <= yTolerance);
    if (existing) {
      existing.tokens.push(token);
    } else {
      rows.push({ y: token.y, tokens: [token] });
    }
  }
  rows.sort((a, b) => b.y - a.y); // top → bottom
  for (const row of rows) {
    row.tokens.sort((a, b) => a.x - b.x); // left → right
  }
  return rows;
}

/**
 * Detect distinct column X-bands using gap clustering.
 * Returns column left-edge positions if ≥2 columns found, otherwise null.
 */
export function detectTableColumns(rows: GridRow[], pageWidth: number): number[] | null {
  if (rows.length < 2) return null;

  const xPositions = rows.flatMap((r) => r.tokens.map((t) => t.x));
  if (xPositions.length < 4) return null;

  const sorted = [...new Set(xPositions.map((x) => Math.round(x / 8) * 8))].sort(
    (a, b) => a - b
  );
  if (sorted.length < 2) return null;

  const gapThreshold = pageWidth * 0.06;
  const columns: number[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] >= gapThreshold) {
      columns.push(sorted[i]);
    }
  }
  if (columns.length < 2) return null;

  // Validate: ≥50% of rows must use ≥2 different columns
  const multiColRows = rows.filter((row) => {
    const usedCols = new Set(
      row.tokens.map((t) => {
        let ci = 0;
        for (let c = 0; c < columns.length; c++) {
          if (t.x >= columns[c] - 5) ci = c;
        }
        return ci;
      })
    );
    return usedCols.size >= 2;
  });

  if (multiColRows.length < Math.max(2, Math.ceil(rows.length * 0.5))) return null;
  return columns;
}

/** Assign each token to its nearest column band and return cell strings. */
export function assignToColumns(tokens: TextToken[], columns: number[]): string[] {
  const cells: string[] = Array(columns.length).fill("");
  for (const token of tokens) {
    let ci = 0;
    for (let c = 0; c < columns.length; c++) {
      if (token.x >= columns[c] - 5) ci = c;
    }
    cells[ci] = cells[ci] ? cells[ci] + " " + token.str : token.str;
  }
  return cells;
}

/**
 * Reconstruct a single row into a text string, inserting a space wherever
 * the visual gap between adjacent tokens is large enough.
 */
export function rowToText(row: GridRow): string {
  if (row.tokens.length === 0) return "";
  let line = row.tokens[0].str;
  for (let i = 1; i < row.tokens.length; i++) {
    const prev = row.tokens[i - 1];
    const curr = row.tokens[i];
    const gap = curr.x - (prev.x + prev.width);
    const charW = prev.width / Math.max(prev.str.length, 1);
    const sep = gap > charW * 0.4 ? " " : "";
    line += sep + curr.str;
  }
  return line;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function PdfToDocxPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      setError(null);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const buffer = await f.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        setPageCount(pdf.numPages);
      } catch {
        setError(t.readPdfFailed);
      }
    },
    [t.readPdfFailed]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
  }, []);

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        WidthType,
        BorderStyle,
      } = await import("docx");

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress((i / pdf.numPages) * 85);

        // Page separator header
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t.pageHeader(i),
                bold: true,
                size: 20,
                color: "888888",
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        // Extract text items with positional data
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();

        const tokens: TextToken[] = [];
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          // item.transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
          tokens.push({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width ?? 0,
          });
        }

        if (tokens.length === 0) {
          children.push(
            new Paragraph({ children: [new TextRun({ text: "", size: 24 })], spacing: { after: 80 } })
          );
          continue;
        }

        const rows = groupByRow(tokens);
        const pageWidth = viewport.width;

        // Walk through rows, detecting table vs paragraph segments
        let idx = 0;
        while (idx < rows.length) {
          // Look ahead into a window to detect a table block
          const window = rows.slice(idx, idx + 30);
          const columns = detectTableColumns(window, pageWidth);

          if (columns) {
            // Extend the table block as far as rows continue to have tokens
            let tableEnd = idx;
            for (let r = idx; r < rows.length; r++) {
              if (rows[r].tokens.length > 0) {
                tableEnd = r;
              } else {
                break;
              }
            }

            const tableRows = rows.slice(idx, tableEnd + 1);
            const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
            const borders = { top: border, bottom: border, left: border, right: border };

            children.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows.map(
                  (row) =>
                    new TableRow({
                      children: assignToColumns(row.tokens, columns).map(
                        (cellText) =>
                          new TableCell({
                            borders,
                            margins: { top: 60, bottom: 60, left: 100, right: 100 },
                            children: [
                              new Paragraph({
                                children: [new TextRun({ text: cellText, size: 22 })],
                                spacing: { before: 40, after: 40 },
                              }),
                            ],
                          })
                      ),
                    })
                ),
              })
            );

            // Spacer paragraph after table
            children.push(new Paragraph({ children: [], spacing: { after: 160 } }));
            idx = tableEnd + 1;
          } else {
            // Plain paragraph
            const line = rowToText(rows[idx]);
            if (line) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: line, size: 24 })],
                  spacing: { after: 80 },
                })
              );
            }
            idx++;
          }
        }
      }

      setProgress(92);

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      setProgress(100);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + ".docx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.pdfToDocxFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout title={t.pdfToDocxTitle} description={t.pdfToDocxDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.pdfToDocxDrop}
            description={t.pdfToDocxDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {file && pageCount > 0 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <PdfPreview file={file} pageIndex={0} width={200} />
              <p className="text-xs text-text-secondary">
                {t.pagesCount(pageCount)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.pdfToDocxNote}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.converting} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileDown className="h-4 w-4" />
              {processing ? t.converting : t.convertToDocx}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
