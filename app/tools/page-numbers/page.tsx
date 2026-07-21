"use client";

import { useState, useCallback } from "react";
import { Hash } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";

const POSITIONS = [
  "bottom-center",
  "bottom-right",
  "bottom-left",
  "top-center",
  "top-right",
  "top-left",
] as const;

export default function PageNumbersPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<string>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState<"single" | "fraction">("single");
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

  const addNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pdf.getPageCount(); i++) {
        setProgress(((i + 1) / pdf.getPageCount()) * 80);
        const page = pdf.getPage(i);
        const { width, height } = page.getSize();
        const pageNum = startNumber + i;
        const text =
          format === "fraction"
            ? `${pageNum}/${pdf.getPageCount()}`
            : `${pageNum}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x = width / 2 - textWidth / 2;
        let y = 30;
        if (position.includes("top")) y = height - 30 - fontSize;
        if (position.includes("right")) x = width - textWidth - 30;
        if (position.includes("left")) x = 30;

        page.drawText(text, {
          x,
          y,
          font,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }

      setProgress(90);
      const bytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "numbered.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.pageNumbersFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const posLabel = (p: string) => {
    const map: Record<string, string> = {
      "bottom-center": t.posBottomCenter,
      "bottom-right": t.posBottomRight,
      "bottom-left": t.posBottomLeft,
      "top-center": t.posTopCenter,
      "top-right": t.posTopRight,
      "top-left": t.posTopLeft,
    };
    return map[p] || p;
  };

  return (
    <ToolPageLayout
      title={t.pageNumbersTitle}
      description={t.pageNumbersDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.pageNumbersDrop}
            description={t.pageNumbersDropDesc}
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
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: pageCount }, (_, i) => i).map(
                (pageIndex) => (
                  <div key={pageIndex}>
                    <PdfPreview
                      file={file}
                      pageIndex={pageIndex}
                      width={120}
                    />
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.pageNumbersSettings}
            </h3>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.position}
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {posLabel(p)}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.fontSizeLabel}: {fontSize}
            </label>
            <input
              type="range"
              min={8}
              max={24}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="mb-4 w-full"
            />

            <label className="mb-1 block text-xs text-text-secondary">
              {t.startNumber}
            </label>
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(e) => setStartNumber(Number(e.target.value))}
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />

            <label className="mb-1 block text-xs text-text-secondary">
              {t.numberFormat}
            </label>
            <select
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as "single" | "fraction")
              }
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="single">{t.fmtSingle}</option>
              <option value="fraction">{t.fmtFraction}</option>
            </select>

            {processing && (
              <ProgressBar
                progress={progress}
                label={t.addingNumbers}
                className="mb-4"
              />
            )}

            <button
              onClick={addNumbers}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Hash className="h-4 w-4" />
              {processing ? t.addingNumbers : t.addPageNumbers}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
