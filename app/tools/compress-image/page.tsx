"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageMinus } from "lucide-react";
import imageCompression from "browser-image-compression";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ImagePreview from "@/app/components/ImagePreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

/** Convert quality 10-100 to initialQuality 0.1-1.0 used by the library */
function toLibQuality(q: number) {
  return q / 100;
}

export default function CompressImagePage() {
  const { t } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [estimatedSizes, setEstimatedSizes] = useState<Record<number, number>>({});

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Re-estimate whenever files or quality changes
  useEffect(() => {
    if (!files.length) {
      setEstimatedSizes({});
      return;
    }

    let cancelled = false;

    const estimate = async () => {
      const sizes: Record<number, number> = {};

      for (let i = 0; i < files.length; i++) {
        if (cancelled) return;
        const file = files[i];

        // At 100% quality output = original
        if (quality === 100) {
          sizes[i] = file.size;
          continue;
        }

        try {
          const compressed = await imageCompression(file, {
            initialQuality: toLibQuality(quality),
            // No resize — format & dimensions preserved
            useWebWorker: true,
          });
          if (cancelled) return;
          // Take the smaller of compressed vs original (library may produce larger for some PNGs)
          sizes[i] = Math.min(compressed.size, file.size);
        } catch {
          sizes[i] = file.size;
        }
      }

      if (!cancelled) setEstimatedSizes(sizes);
    };

    estimate();
    return () => { cancelled = true; };
  }, [files, quality]);

  const compress = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const blobs: Blob[] = [];
      const names: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        setProgress(((i + 0.1) / files.length) * 80);

        const compressed = await imageCompression(file, {
          initialQuality: toLibQuality(quality),
          useWebWorker: true,
          onProgress: (p) => {
            setProgress(((i + p / 100) / files.length) * 80);
          },
        });

        // Use original if compressed is somehow larger
        const result = compressed.size < file.size ? compressed : file;

        // Keep original filename and extension
        blobs.push(result);
        names.push(file.name);
      }

      setProgress(90);

      if (blobs.length === 1) {
        const url = URL.createObjectURL(blobs[0]);
        const a = document.createElement("a");
        a.href = url;
        a.download = names[0];
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        blobs.forEach((b, i) => zip.file(names[i], b));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "compressed_images.zip";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }

      setProgress(100);
    } catch {
      setError(t.compressImageFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout
      title={t.compressImageTitle}
      description={t.compressImageDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".png,.jpg,.jpeg"
            multiple
            label={t.compressImageDrop}
            description={t.compressImageDropDesc}
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
                    <div className="mb-1 flex items-center justify-between text-[10px] text-text-secondary">
                      <span>{t.originalSize}: {formatSize(file.size)}</span>
                      {estimatedSizes[i] !== undefined && (
                        <span className={estimatedSizes[i] < file.size ? "text-green-500" : ""}>
                          {t.estimatedSize}: {formatSize(estimatedSizes[i])}
                        </span>
                      )}
                    </div>
                    <ImagePreview file={file} width={160} />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 rounded bg-surface/80 p-1.5 text-error opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface"
                      title={t.remove}
                    >
                      <ImageMinus className="h-3.5 w-3.5" />
                    </button>
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
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.compressImageSettings}
            </h3>

            <div className="mb-4">
              <label className="mb-1 block text-xs text-text-secondary">
                {t.qualityLabel}: {quality}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {processing && (
              <ProgressBar
                progress={progress}
                label={t.compressingImage}
                className="mb-4"
              />
            )}

            <button
              onClick={compress}
              disabled={!files.length || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ImageMinus className="h-4 w-4" />
              {processing ? t.compressingImage : t.compressImages}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
