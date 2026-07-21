"use client";

import { useState, useCallback } from "react";
import { Maximize2 } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";

const presetSizes: Record<string, [number, number]> = {
  a3: [841.89, 1190.55],
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};

export default function ResizePdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [targetSize, setTargetSize] = useState<
    "a4" | "letter" | "legal" | "a3" | "custom"
  >("a4");
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [scaleContent, setScaleContent] = useState(true);
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

  const resize = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      setProgress(20);

      const pdf = await PDFDocument.load(buffer);
      setProgress(40);

      let newW = customWidth;
      let newH = customHeight;
      if (targetSize !== "custom") {
        [newW, newH] = presetSizes[targetSize];
      }

      for (let i = 0; i < pdf.getPageCount(); i++) {
        const page = pdf.getPage(i);
        if (scaleContent) {
          const oldW = page.getWidth();
          const oldH = page.getHeight();
          const scale = Math.min(newW / oldW, newH / oldH);
          page.scale(scale, scale);
        }
        page.setSize(newW, newH);
        setProgress(40 + ((i + 1) / pdf.getPageCount()) * 40);
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
      a.download = "resized.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.resizeFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout
      title={t.resizePdfTitle}
      description={t.resizePdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.resizePdfDrop}
            description={t.resizePdfDropDesc}
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
                  <div key={pageIndex} className="flex flex-col items-center gap-1.5">
                    <PdfPreview file={file} pageIndex={pageIndex} width={120} />
                    <span className="text-[10px] text-text-secondary">
                      {pageIndex + 1}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.resizeSettings}
            </h3>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.targetSize}
            </label>
            <select
              value={targetSize}
              onChange={(e) =>
                setTargetSize(
                  e.target.value as "a4" | "letter" | "legal" | "a3" | "custom"
                )
              }
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="a4">{t.sizeA4} (595 × 842 pt)</option>
              <option value="letter">{t.sizeLetter} (612 × 792 pt)</option>
              <option value="legal">{t.sizeLegal} (612 × 1008 pt)</option>
              <option value="a3">A3 (842 × 1191 pt)</option>
              <option value="custom">{t.customSize}</option>
            </select>

            {targetSize === "custom" && (
              <>
                <div className="mb-3 flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-text-secondary">
                      {t.width}
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-text-secondary">
                      {t.height}
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                </div>
              </>
            )}

            <label className="mb-4 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={scaleContent}
                onChange={(e) => setScaleContent(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              {t.scaleContent}
            </label>

            {processing && (
              <ProgressBar
                progress={progress}
                label={t.resizing}
                className="mb-4"
              />
            )}

            <button
              onClick={resize}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Maximize2 className="h-4 w-4" />
              {processing ? t.resizing : t.resizePdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
