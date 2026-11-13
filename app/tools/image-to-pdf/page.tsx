"use client";

import { useState, useCallback } from "react";
import { FileDown, GripVertical, Trash2 } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ImagePreview from "@/app/components/ImagePreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

export default function ImageToPdfPage() {
  const { t } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const convert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgress(((i + 1) / files.length) * 90);
        const file = files[i];

        let image;
        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
        const isJpg = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);

        if (isPng) {
          const bytes = await file.arrayBuffer();
          image = await pdf.embedPng(bytes);
        } else if (isJpg) {
          const bytes = await file.arrayBuffer();
          image = await pdf.embedJpg(bytes);
        } else {
          // Format WebP, BMP, GIF: render ke canvas dan convert ke JPEG agar tidak melempar error Invalid JPEG
          const objUrl = URL.createObjectURL(file);
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = objUrl;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
          );
          URL.revokeObjectURL(objUrl);
          const bytes = await blob.arrayBuffer();
          image = await pdf.embedJpg(bytes);
        }

        // Ukuran standar A4 dalam points (595.28 x 841.89) dengan margin
        const a4W = 595.28;
        const a4H = 841.89;
        const isLandscape = image.width > image.height;
        const pageW = isLandscape ? a4H : a4W;
        const pageH = isLandscape ? a4W : a4H;

        const margin = 28;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const drawW = image.width * scale;
        const drawH = image.height * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        const page = pdf.addPage([pageW, pageH]);
        page.drawImage(image, {
          x,
          y,
          width: drawW,
          height: drawH,
        });
      }

      setProgress(95);
      const pdfBytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "combined_images.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.imageToPdfFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout
      title={t.imageToPdfTitle}
      description={t.imageToPdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".png,.jpg,.jpeg"
            multiple
            label={t.imageToPdfDrop}
            description={t.imageToPdfDropDesc}
            onFiles={handleFiles}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="group relative flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <ImagePreview file={file} width={160} />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => i > 0 && moveFile(i, i - 1)}
                        disabled={i === 0}
                        className="rounded bg-surface/80 p-1.5 text-foreground transition-colors hover:bg-surface disabled:opacity-30"
                        title={t.moveLeft}
                      >
                        <GripVertical className="h-3.5 w-3.5 -rotate-90" />
                      </button>
                      <button
                        onClick={() => removeFile(i)}
                        className="rounded bg-surface/80 p-1.5 text-error transition-colors hover:bg-surface"
                        title={t.remove}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => i < files.length - 1 && moveFile(i, i + 1)}
                        disabled={i === files.length - 1}
                        className="rounded bg-surface/80 p-1.5 text-foreground transition-colors hover:bg-surface disabled:opacity-30"
                        title={t.moveRight}
                      >
                        <GripVertical className="h-3.5 w-3.5 rotate-90" />
                      </button>
                    </div>
                  </div>
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
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {t.imagesSelected(files.length)}
            </h3>
            <p className="mb-4 text-xs text-text-secondary">
              {t.imagesDesc}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.generatingPdf} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!files.length || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileDown className="h-4 w-4" />
              {processing ? t.generating : t.generatePdf}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
