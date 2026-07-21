"use client";

import { useState, useCallback } from "react";
import { Droplets } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";

export default function WatermarkPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(60);
  const [opacity, setOpacity] = useState(0.15);
  const [rotation, setRotation] = useState(-45);
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

  const addWatermark = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      setProgress(20);

      const pdf = await PDFDocument.load(buffer);
      setProgress(40);

      const font = await pdf.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pdf.getPageCount(); i++) {
        const page = pdf.getPage(i);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          font,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(rotation),
        });

        setProgress(40 + ((i + 1) / pdf.getPageCount()) * 40);
      }

      setProgress(90);
      const bytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "watermarked.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.watermarkFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout
      title={t.watermarkTitle}
      description={t.watermarkDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.watermarkDrop}
            description={t.watermarkDropDesc}
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
                <PdfPreview
                  key={pageIndex}
                  file={file}
                  pageIndex={pageIndex}
                  width={120}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.watermarkSettings}</h3>

            <label className="mb-1 block text-xs text-text-secondary">{t.watermarkText}</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder={t.watermarkPlaceholder}
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />

            <label className="mb-1 block text-xs text-text-secondary">
              {t.fontSizeLabel}: {fontSize}
            </label>
            <input
              type="range"
              min={12}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="mb-4 w-full accent-accent"
            />

            <label className="mb-1 block text-xs text-text-secondary">
              {t.opacity}: {opacity.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.05}
              max={0.5}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="mb-4 w-full accent-accent"
            />

            <label className="mb-1 block text-xs text-text-secondary">
              {t.rotation}: {rotation}°
            </label>
            <input
              type="range"
              min={-90}
              max={90}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="mb-4 w-full accent-accent"
            />

            {processing && (
              <ProgressBar progress={progress} label={t.addingWatermark} className="mb-4" />
            )}

            <button
              onClick={addWatermark}
              disabled={!file || processing || !watermarkText}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Droplets className="h-4 w-4" />
              {processing ? t.addingWatermark : t.addWatermark}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
