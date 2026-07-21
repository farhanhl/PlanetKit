"use client";

import { useState, useCallback } from "react";
import { FileText, Copy, Download } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

export default function PdfToTextPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setExtractedText("");
    setError(null);
    setCopied(false);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setExtractedText("");
    setError(null);
  }, []);

  const extract = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setCopied(false);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const texts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress((i / pdf.numPages) * 100);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item): item is { str: string } & typeof item => "str" in item)
          .map((item) => item.str)
          .join(" ");
        if (pageText.trim()) {
          texts.push(`${t.pageHeader(i)}\n${pageText}`);
        }
      }

      if (texts.length === 0) {
        setError(t.noTextFound);
      } else {
        setExtractedText(texts.join("\n\n"));
      }
    } catch {
      setError(t.extractFailed);
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
    a.download = "extracted_text.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <ToolPageLayout
      title={t.pdfToTextTitle}
      description={t.pdfToTextDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.pdfToTextDrop}
            description={t.pdfToTextDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
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
                className="h-96 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.extractSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.extractDesc}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.extractingText} className="mb-4" />
            )}

            <button
              onClick={extract}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />
              {processing ? t.extracting : t.extractText}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
