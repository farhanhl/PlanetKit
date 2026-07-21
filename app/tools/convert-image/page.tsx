"use client";

import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ImagePreview from "@/app/components/ImagePreview";
import ProgressBar from "@/app/components/ProgressBar";
import ToolSeo from "@/app/components/ToolSeo";
import JSZip from "jszip";

type OutputFormat = "png" | "jpeg" | "webp";

export default function ConvertImagePage() {
  const { t } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const convert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const zip = new JSZip();
      const mimeTypes: Record<OutputFormat, string> = {
        png: "image/png",
        jpeg: "image/jpeg",
        webp: "image/webp",
      };

      for (let i = 0; i < files.length; i++) {
        setProgress(((i + 1) / files.length) * 100);
        const file = files[i];

        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const blob = await canvasToBlob(canvas, mimeTypes[outputFormat], quality / 100);
        const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
        const baseName = file.name.replace(/\.[^.]+$/, "");
        zip.file(`${baseName}.${ext}`, blob);
      }

      setProgress(95);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted_images.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      setProgress(100);
    } catch {
      setError(t.imageConvertFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <>
    <ToolSeo title={t.imageConvertTitle} description={t.imageConvertDesc} path="/tools/convert-image" />
    <ToolPageLayout title={t.imageConvertTitle} description={t.imageConvertDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
            multiple
            label={t.imageConvertDrop}
            description={t.imageConvertDropDesc}
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
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {files.map((file, i) => (
                <ImagePreview key={`${file.name}-${i}`} file={file} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.outputFormat}</h3>

            <div className="mb-4 flex gap-2">
              {(["png", "jpeg", "webp"] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    outputFormat === fmt
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "border border-border text-text-secondary hover:border-accent/40"
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>

            {outputFormat !== "png" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {t.qualityLabel}: {quality}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            )}

            {processing && (
              <ProgressBar progress={progress} label={t.convertingImages} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={files.length === 0 || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {processing ? t.convertingImages : t.convertImages}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
    </>
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      type,
      quality
    );
  });
}
