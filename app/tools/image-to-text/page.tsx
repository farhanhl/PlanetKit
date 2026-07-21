"use client";

import { useState, useCallback } from "react";
import { ScanText, Copy, Download } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ImagePreview from "@/app/components/ImagePreview";
import ProgressBar from "@/app/components/ProgressBar";
import ToolSeo from "@/app/components/ToolSeo";

export default function ImageToTextPage() {
  const { t } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setExtractedText("");
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setExtractedText("");
  }, []);

  const recognize = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setCopied(false);

    try {
      const Tesseract = await import("tesseract.js");
      const texts: string[] = [];

      for (let i = 0; i < files.length; i++) {
        setProgress(((i + 1) / files.length) * 100);
        const result = await Tesseract.recognize(files[i], "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const pageProgress = (i / files.length) * 100;
              setProgress(pageProgress + (m.progress * 100) / files.length);
            }
          },
        });
        if (result.data.text.trim()) {
          texts.push(`--- ${files[i].name} ---\n${result.data.text}`);
        }
      }

      setProgress(100);
      if (texts.length === 0) {
        setError(t.ocrNoTextFound);
      } else {
        setExtractedText(texts.join("\n\n"));
      }
    } catch {
      setError(t.imgOcrFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.copyFailed);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr_text.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <>
      <ToolSeo title={t.imgOcrTitle} description={t.imgOcrDesc} path="/tools/image-to-text" />
      <ToolPageLayout title={t.imgOcrTitle} description={t.imgOcrDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader
              accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff"
              multiple
              label={t.imgOcrDrop}
              description={t.imgOcrDropDesc}
              onFiles={handleFiles}
              files={files}
              onRemove={removeFile}
            />

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {files.map((file, i) => (
                  <ImagePreview key={`${file.name}-${i}`} file={file} />
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
            )}

            {extractedText && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.extractedText}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? t.copied : t.copy}
                    </button>
                    <button
                      onClick={downloadTxt}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      <Download className="h-3 w-3" />
                      {t.txt}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={extractedText}
                  className="h-80 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.imgOcrSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.imgOcrNote}</p>
              {processing && (
                <ProgressBar progress={progress} label={t.ocrProcessing} className="mb-4" />
              )}
              <button
                onClick={recognize}
                disabled={files.length === 0 || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ScanText className="h-4 w-4" />
                {processing ? t.ocrProcessing : t.imgOcrBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
