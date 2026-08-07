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

/**
 * Sanitizes OCR output line to remove logo fragments, random noise,
 * and normalize form field dotted lines (e.g. Nama : .......).
 *
 * Strategy:
 *  1. Strip known garbage patterns (logo artifacts, page separators, pure symbols)
 *  2. Exempt known-good patterns from ratio filter (Jakarta date lines, etc.)
 *  3. Apply alpha-ratio noise filter
 *  4. Match known form field labels → normalize to "Label : ........"
 *  5. Normalize remaining Jakarta date lines
 *  6. Drop residual junk (1-2 char noise)
 */
export function cleanOcrTextLine(rawLine: string): string {
  if (!rawLine) return "";
  let line = rawLine.trim();
  if (!line) return "";

  // ── Step 1: Hard-coded garbage patterns ──────────────────────────────────
  // Logo artifacts: "um, | Aam", "ica | am", "ia, | Aam", "Aa, Palang KOTA"
  if (/^[a-z]{1,5}[,.\s]*[|/]\s*[A-Z][a-z]{1,5}$/i.test(line)) return "";
  if (/Palang\s*KOTA/i.test(line)) return "";
  // PMI Palang Merah logo text fragments ("Pp) Merah | | JAKARTA", etc.)
  if (/Merah\s*[|/]\s*[|/]?\s*JAKARTA/i.test(line)) return "";
  if (/^(PMI|Palang|Merah|Indonesia)\s*(KOTA|UTARA|SELATAN|BARAT|TIMUR|DKI)?/i.test(line) &&
    line.length < 30 && !/[.,]/.test(line)) return "";
  // Page separator injected by tesseract reading scanned page headers
  if (/^---\s*Halaman\s*\d+\s*---$/i.test(line)) return "";
  // Lone separator characters
  if (/^[|\-/\\.]{1,5}$/.test(line)) return "";

  // ── Step 2: Exempt known-good line patterns from noise filter ─────────────
  // Jakarta date lines (contain "Jakarta," + year) — exempt before ratio check
  const isJakartaLine = /Jakarta[,.]?\s*/i.test(line) && /\d{4}/.test(line);
  // Lines starting with a number+period (numbered list items like "1. Bersedia...")
  const isNumberedList = /^\d+\.\s+[A-Z]/.test(line);
  // Parenthesized notes: "(tanda tangan)", "(Nama Jelas)"
  const isParenNote = /^\([^)]{3,30}\)$/.test(line);
  // Short all-caps section headers like "A.", "B.", "G."
  const isSectionHeader = /^[A-Z]\.\s*[A-Z\s]{3,}$/.test(line);

  // ── Step 3: Alpha-ratio noise filter (skip for exempted patterns) ─────────
  if (!isJakartaLine && !isNumberedList && !isParenNote && !isSectionHeader) {
    const alphaNum = line.replace(/[^a-zA-Z0-9]/g, "").length;
    const ratio = line.length > 0 ? alphaNum / line.length : 1;
    if (line.length > 5 && ratio < 0.3) return "";
    // Very short garbage lines (≤3 chars with non-alphanumeric)
    if (line.length <= 3 && !/^[A-Z0-9]{1,3}$/i.test(line)) return "";
  }

  // ── Step 4: Known form field label matching ───────────────────────────────
  const formLabels = [
    // SURAT PERNYATAAN fields
    { regex: /^Nama\s*Lengkap/i, label: "Nama Lengkap" },
    { regex: /^Nama\s*Panggilan/i, label: "Nama Panggilan" },
    { regex: /^Nama\s*Ayah/i, label: "Nama Ayah" },
    { regex: /^Nama\s*Ibu/i, label: "Nama Ibu" },
    { regex: /^Nama\s*Peserta/i, label: "Nama Peserta" },
    { regex: /^Nama\s*Pembina/i, label: "Nama Pembina" },
    { regex: /^Nama/i, label: "Nama" },
    { regex: /^Tempat\s*[,/]\s*Tgl\s*Lahir/i, label: "Tempat, Tgl Lahir" },
    { regex: /^Tanggal\s*Lahir/i, label: "Tanggal Lahir" },
    { regex: /^Jenis\s*Kelamin/i, label: "Jenis Kelamin" },
    { regex: /^Agama/i, label: "Agama" },
    { regex: /^Alamat\s*Lengkap/i, label: "Alamat Lengkap" },
    { regex: /^Alamat\s*Sekolah/i, label: "Alamat Sekolah" },
    { regex: /^Alamat/i, label: "Alamat" },
    { regex: /^No[.\s]*[HW][PA][/\s]*(WA|HP)?/i, label: "No. HP/WA" },
    { regex: /^NIP\s*[/\s]*NIS/i, label: "NIP / NIS" },
    { regex: /^Email/i, label: "Email" },
    // Sekolah variants (order matters: more specific first)
    { regex: /^Nama\s*Sekolah/i, label: "Nama Sekolah" },
    { regex: /^Sekolah\s*\/\s*PMR/i, label: "Sekolah/PMR" },
    { regex: /^Asal\s*Sekolah/i, label: "Asal Sekolah" },
    { regex: /^Sekolah/i, label: "Sekolah" },
    { regex: /^Kelas/i, label: "Kelas" },
    { regex: /^Jurusan/i, label: "Jurusan (jika ada)" },
    // PMR fields
    { regex: /^Tingkat\s*PMR/i, label: "Tingkat PMR" },
    { regex: /^Tahun\s*Bergabung/i, label: "Tahun Bergabung" },
    { regex: /^Jabatan\s*di\s*PMR/i, label: "Jabatan di PMR" },
    { regex: /^Jabatan/i, label: "Jabatan" },
    { regex: /^Pengalaman\s*Kegiatan/i, label: "Pengalaman Kegiatan PMR" },
    { regex: /^Prestasi/i, label: "Prestasi (jika ada)" },
    // Kemampuan / Keterampilan
    { regex: /^Kemampuan\s*Bahasa/i, label: "Kemampuan Bahasa Asing" },
    { regex: /^Kemampuan\s*Komunikasi/i, label: "Kemampuan Komunikasi" },
    { regex: /^Keterampilan\s*Seni/i, label: "Keterampilan Seni Budaya" },
    { regex: /^Pemahaman\s*tentang/i, label: "Pemahaman tentang PMI" },
    // Paspor
    { regex: /^Nomor\s*Paspor/i, label: "Nomor Paspor" },
    { regex: /^Tanggal\s*Terbit/i, label: "Tanggal Terbit" },
    { regex: /^Tanggal\s*Berlaku/i, label: "Tanggal Berlaku" },
    // Orang Tua / REKOMENDASI
    { regex: /^Pekerjaan/i, label: "Pekerjaan" },
    // standalone No. HP fallback
    { regex: /^No\.\s*HP/i, label: "No. HP" },
  ];

  for (const item of formLabels) {
    if (item.regex.test(line)) {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const val = line.substring(colonIdx + 1).trim();
        // Keep value if it's meaningful (e.g. "Madya / Wira" for Tingkat PMR)
        const valueIsSignificant =
          val.length >= 3 &&
          val.length <= 60 &&
          /[a-zA-Z]/.test(val) &&
          !/^[.\s,_\-]+$/.test(val);
        if (valueIsSignificant) {
          return `${item.label} : ${val}`;
        }
      }
      return `${item.label} : ............................................................................................`;
    }
  }

  line = line.replace(/Jakarta,\s*[\.\s\w\:\;]+(\d{4})/gi, "Jakarta, .................................... $1");

  if (/^[^\w\s]{1,3}$/.test(line) || /^[a-z]{1,2}$/i.test(line)) {
    return "";
  }

  return line;
}

/**
 * Determine if a native PDF row is centered on the page.
 * pageWidth is the viewport width in PDF units.
 */
export function isRowCentered(
  row: { tokens: { x: number; width: number }[] },
  pageWidth: number
): boolean {
  if (row.tokens.length === 0) return false;
  const leftX = row.tokens[0].x;
  const last = row.tokens[row.tokens.length - 1];
  const rightX = last.x + last.width;
  const centerX = (leftX + rightX) / 2;
  const pageCenterX = pageWidth / 2;
  return Math.abs(centerX - pageCenterX) < pageWidth * 0.12;
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
        AlignmentType,
        Table,
        TableRow,
        TableCell,
        WidthType,
        BorderStyle,
        ImageRun,
      } = await import("docx");

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress((i / pdf.numPages) * 85);

        // Insert a page break before each page (except the first)
        if (i > 1) {
          children.push(
            new Paragraph({
              pageBreakBefore: true,
              children: [],
              spacing: { before: 0, after: 0 },
            })
          );
        }

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
          // Scanned page — render to canvas and OCR
          try {
            const renderScale = 2;
            const renderViewport = page.getViewport({ scale: renderScale });
            const canvas = document.createElement("canvas");
            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (page.render as any)({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

              // Single Tesseract recognize call — use result.data for text + line bboxes
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let ocrData: any = null;
              try {
                const Tesseract = await import("tesseract.js");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tObj: any = Tesseract.default || Tesseract;
                const blob = await new Promise<Blob>((resolve) =>
                  canvas.toBlob((b) => resolve(b!), "image/png")
                );
                const result = await tObj.recognize(blob, "ind+eng", {
                  logger: (m: { status: string; progress: number }) => {
                    if (m.status === "recognizing text") {
                      const pageProgress = ((i - 1) / pdf.numPages) * 85;
                      setProgress(pageProgress + (m.progress * 85) / pdf.numPages);
                    }
                  },
                });
                ocrData = result.data;
              } catch (ocrErr) {
                console.warn("Tesseract OCR failed, falling back to image embedding:", ocrErr);
              }

              // Build per-line data from Tesseract — prefer line bboxes if available
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              type OcrLineEntry = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };
              const ocrLineData: OcrLineEntry[] =
                (ocrData?.lines ?? []).length > 0
                  ? ocrData.lines
                  : (ocrData?.text ?? "")
                    .split("\n")
                    .map((t: string, idx: number) => ({
                      text: t,
                      bbox: { x0: 72, y0: idx * 30, x1: renderViewport.width - 72, y1: idx * 30 + 28 },
                    }));

              const ocrPageWidth = renderViewport.width;
              const validOcrLines = ocrLineData.filter((l) => cleanOcrTextLine(l.text));

              if (validOcrLines.length > 0) {
                // Reconstruct layout using bounding boxes from Tesseract
                for (const ocrLine of validOcrLines) {
                  const cleaned = cleanOcrTextLine(ocrLine.text);
                  if (!cleaned) continue;
                  const lineWidth = ocrLine.bbox.x1 - ocrLine.bbox.x0;
                  const fakeRow = {
                    y: ocrLine.bbox.y0,
                    tokens: [{ str: cleaned, x: ocrLine.bbox.x0, y: ocrLine.bbox.y0, width: lineWidth }],
                  };
                  const centered = isRowCentered(fakeRow, ocrPageWidth);
                  const isAllCaps = /^[A-Z][A-Z\s\-\/]{7,}$/.test(cleaned);
                  children.push(
                    new Paragraph({
                      alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: cleaned,
                          size: 22,
                          bold: isAllCaps && centered,
                        }),
                      ],
                      spacing: { after: 80 },
                    })
                  );
                }
              } else {
                // Fallback to ImageRun if no text recognized
                const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                const base64Data = dataUrl.split(",")[1];
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let b = 0; b < binaryString.length; b++) {
                  bytes[b] = binaryString.charCodeAt(b);
                }
                const targetWidth = 550;
                const targetHeight = Math.round(targetWidth * (viewport.height / viewport.width));
                children.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: bytes,
                        transformation: { width: targetWidth, height: targetHeight },
                        type: "jpg",
                      }),
                    ],
                    spacing: { after: 160 },
                  })
                );
              }
            } else {
              children.push(new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 80 } }));
            }
          } catch (renderError) {
            console.error("Failed to render PDF page canvas:", renderError);
            children.push(new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 80 } }));
          }
          continue;
        }

        // Native text PDF path
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
            // Plain paragraph — detect alignment from row X position
            const line = rowToText(rows[idx]);
            if (line) {
              const centered = isRowCentered(rows[idx], pageWidth);
              const isAllCaps = /^[A-Z][A-Z\s\-\/]{7,}$/.test(line);
              children.push(
                new Paragraph({
                  alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: line,
                      size: 22,
                      bold: isAllCaps && centered,
                    }),
                  ],
                  spacing: { after: 80 },
                })
              );
            }
            idx++;
          }
        } // end while rows
      } // end for pages

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
