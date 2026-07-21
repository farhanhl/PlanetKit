"use client";

import { useState, useCallback } from "react";
import { Images } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

type OutputFormat = "png" | "jpg";

export default function PdfToImagePage() {
  const { t } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const convert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      let totalPages = 0;

      const pdfDocs = [];
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        pdfDocs.push({ file, pdf });
        totalPages += pdf.numPages;
      }

      let processedPages = 0;

      for (const { file, pdf } of pdfDocs) {
        const baseName = file.name.replace(/\.pdf$/i, "");

        for (let i = 1; i <= pdf.numPages; i++) {
          setProgressLabel(t.convertingPage(baseName, i, pdf.numPages));
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          const mimeType = format === "png" ? "image/png" : "image/jpeg";
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), mimeType, quality)
          );

          if (blob) {
            zip.file(`${baseName}_page_${i}.${format}`, blob);
          }
          processedPages++;
          setProgress((processedPages / totalPages) * 100);
        }
      }

      setProgressLabel(t.packagingDownload);
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted_images.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("PDF to image conversion error:", err);
      setError(t.conversionFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  return (
    <ToolPageLayout
      title={t.pdfToImageTitle}
      description={t.pdfToImageDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            multiple
            label={t.pdfToImageDrop}
            description={t.pdfToImageDropDesc}
            onFiles={handleFiles}
            files={files}
            onRemove={removeFile}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {files.map((file, fi) => (
                <div key={`${file.name}-${fi}`} className="flex flex-col items-center gap-1.5">
                  <PdfPreview file={file} pageIndex={0} width={140} />
                  <span className="w-full truncate text-center text-[10px] text-text-secondary">
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.outputSettings}</h3>

            <label className="mb-1 block text-xs text-text-secondary">{t.format}</label>
            <div className="mb-4 flex gap-2">
              {(["png", "jpg"] as OutputFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    format === f
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-secondary hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {format === "jpg" && (
              <>
                <label className="mb-1 block text-xs text-text-secondary">
                  {t.quality}: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="mb-4 w-full accent-[var(--accent)]"
                />
              </>
            )}

            {processing && (
              <ProgressBar progress={progress} label={progressLabel} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!files.length || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Images className="h-4 w-4" />
              {processing ? t.converting : t.convertToImages}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
