"use client";

import { useState, useCallback } from "react";
import { Crop } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";

export default function CropPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [marginTop, setMarginTop] = useState(0);
  const [marginRight, setMarginRight] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
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

  const crop = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);

      for (let i = 0; i < pdf.getPageCount(); i++) {
        setProgress(((i + 1) / pdf.getPageCount()) * 80);
        const page = pdf.getPage(i);
        const { x, y, width, height } = page.getMediaBox();

        const totalH = marginLeft + marginRight;
        const totalV = marginTop + marginBottom;
        const newW = Math.max(1, width - totalH);
        const newH = Math.max(1, height - totalV);
        const offsetX = Math.min(marginLeft, width - 1);
        const offsetY = Math.min(marginBottom, height - 1);

        page.setMediaBox(x + offsetX, y + offsetY, newW, newH);
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
      a.download = "cropped.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.cropFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout title={t.cropPdfTitle} description={t.cropPdfDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.cropPdfDrop}
            description={t.cropPdfDropDesc}
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
              {Array.from({ length: pageCount }, (_, i) => i).map((pageIndex) => (
                <div key={pageIndex} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <PdfPreview file={file} pageIndex={pageIndex} width={120} />
                    <div className="absolute right-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-background">
                      {pageIndex + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.cropSettings}
            </h3>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  {t.marginTop}
                </label>
                <input
                  type="number"
                  min={0}
                  value={marginTop}
                  onChange={(e) => setMarginTop(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  {t.marginRight}
                </label>
                <input
                  type="number"
                  min={0}
                  value={marginRight}
                  onChange={(e) => setMarginRight(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  {t.marginBottom}
                </label>
                <input
                  type="number"
                  min={0}
                  value={marginBottom}
                  onChange={(e) => setMarginBottom(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  {t.marginLeft}
                </label>
                <input
                  type="number"
                  min={0}
                  value={marginLeft}
                  onChange={(e) => setMarginLeft(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>

            {processing && (
              <ProgressBar
                progress={progress}
                label={t.cropping}
                className="mb-4"
              />
            )}

            <button
              onClick={crop}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Crop className="h-4 w-4" />
              {processing ? t.cropping : t.cropPdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
