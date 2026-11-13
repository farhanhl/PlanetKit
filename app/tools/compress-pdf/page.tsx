"use client";

import { useState, useCallback } from "react";
import { Minimize2 } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ProgressBar from "@/app/components/ProgressBar";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
    setResult(null);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setResult(null);
  }, []);

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(buffer);
      setProgress(60);

      pdf.setTitle("");
      pdf.setAuthor("");
      pdf.setSubject("");
      pdf.setKeywords([]);
      pdf.setProducer("");
      pdf.setCreator("");

      setProgress(80);
      const bytes = await pdf.save({ useObjectStreams: true });
      setProgress(100);

      const compressedBlob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });

      // Jika proses kompresi justru menghasilkan ukuran lebih besar (misal file aslinya sudah teroptimasi),
      // pertahankan file asli agar pengguna tidak dirugikan
      const finalBlob = compressedBlob.size < file.size ? compressedBlob : file;

      setResult({
        originalSize: file.size,
        compressedSize: finalBlob.size,
      });

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${file.name.replace(/\.pdf$/i, "")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.compressFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const reduction = result
    ? Math.max(0, Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100))
    : 0;

  return (
    <ToolPageLayout
      title={t.compressPdfTitle}
      description={t.compressPdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.compressPdfDrop}
            description={t.compressPdfDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.result}</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-text-secondary">{t.original}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {formatSize(result.originalSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t.compressed}</p>
                  <p className="mt-1 text-lg font-bold text-accent">
                    {formatSize(result.compressedSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t.reduction}</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      reduction > 0 ? "text-success" : "text-text-secondary"
                    }`}
                  >
                    {reduction > 0 ? `${reduction}%` : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-secondary text-center">
                {reduction > 0
                  ? t.compressSuccess
                  : t.compressNoReduction}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.compressSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.compressDesc}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.compressing} className="mb-4" />
            )}

            <button
              onClick={compress}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minimize2 className="h-4 w-4" />
              {processing ? t.compressing : t.compressPdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
