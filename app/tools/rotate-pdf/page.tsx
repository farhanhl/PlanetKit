"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import { RotateCw } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";

export default function RotatePdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setRotations(new Map());

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      setPageCount(pdf.numPages);
    } catch {
      setError(t.readPdfFailed);
    }
  }, [t.readPdfFailed]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setRotations(new Map());
  }, []);

  const rotatePage = useCallback((pageIndex: number, delta: number) => {
    setRotations((prev) => {
      const next = new Map(prev);
      const current = next.get(pageIndex) || 0;
      next.set(pageIndex, (current + delta + 360) % 360);
      return next;
    });
  }, []);

  const rotateAll = useCallback(
    (delta: number) => {
      setRotations((prev) => {
        const next = new Map(prev);
        for (let i = 0; i < pageCount; i++) {
          const current = next.get(i) || 0;
          next.set(i, (current + delta + 360) % 360);
        }
        return next;
      });
    },
    [pageCount]
  );

  const resetAll = useCallback(() => {
    setRotations(new Map());
  }, []);

  const apply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);

      for (let i = 0; i < pdf.getPageCount(); i++) {
        setProgress(((i + 1) / pdf.getPageCount()) * 80);
        const page = pdf.getPage(i);
        const currentRotation = page.getRotation().angle;
        const additionalRotation = rotations.get(i) || 0;
        page.setRotation(degrees(currentRotation + additionalRotation));
      }

      setProgress(90);
      const bytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rotated.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.rotateFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const hasChanges = Array.from(rotations.values()).some((v) => v !== 0);

  return (
    <ToolPageLayout
      title={t.rotatePdfTitle}
      description={t.rotatePdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.rotatePdfDrop}
            description={t.rotatePdfDropDesc}
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
              {Array.from({ length: pageCount }, (_, i) => i).map((pageIndex) => {
                const angle = rotations.get(pageIndex) || 0;
                return (
                  <div
                    key={pageIndex}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="relative">
                      <PdfPreview file={file} pageIndex={pageIndex} width={120} />
                      {angle !== 0 && (
                        <div className="absolute right-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-background">
                          {angle}°
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => rotatePage(pageIndex, -90)}
                        className="rounded border border-border px-2 py-1 text-[10px] text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        -90°
                      </button>
                      <button
                        onClick={() => rotatePage(pageIndex, 90)}
                        className="rounded border border-border px-2 py-1 text-[10px] text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        +90°
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.rotateSettings}</h3>

            <label className="mb-1 block text-xs text-text-secondary">{t.rotateAllPages}</label>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => rotateAll(-90)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
              >
                -90°
              </button>
              <button
                onClick={() => rotateAll(180)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
              >
                180°
              </button>
              <button
                onClick={() => rotateAll(90)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
              >
                +90°
              </button>
            </div>

            {hasChanges && (
              <button
                onClick={resetAll}
                className="mb-4 text-xs text-text-secondary hover:text-foreground"
              >
                {t.resetRotations}
              </button>
            )}

            {processing && (
              <ProgressBar progress={progress} label={t.rotating} className="mb-4" />
            )}

            <button
              onClick={apply}
              disabled={!file || !hasChanges || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCw className="h-4 w-4" />
              {processing ? t.rotating : t.applyRotation}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
