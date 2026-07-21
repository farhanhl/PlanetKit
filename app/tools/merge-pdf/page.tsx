"use client";

import { useState, useCallback } from "react";
import { Merge, GripVertical, Trash2 } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

interface PdfFile {
  file: File;
  pageCount: number;
}

export default function MergePdfPage() {
  const { t } = useLang();
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const results: PdfFile[] = [];
      for (const file of newFiles) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        results.push({ file, pageCount: pdf.numPages });
      }
      setPdfFiles((prev) => [...prev, ...results]);
    } catch {
      setError(t.mergeReadFailed);
    }
  }, [t.mergeReadFailed]);

  const removeFile = useCallback((index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    setPdfFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const merge = async () => {
    if (!pdfFiles.length) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();

      for (let i = 0; i < pdfFiles.length; i++) {
        setProgress(((i + 1) / pdfFiles.length) * 90);
        const buffer = await pdfFiles[i].file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer);
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }

      setProgress(95);
      const bytes = await merged.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.mergeFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const totalPages = pdfFiles.reduce((sum, f) => sum + f.pageCount, 0);

  return (
    <ToolPageLayout
      title={t.mergePdfTitle}
      description={t.mergePdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            multiple
            label={t.mergePdfDrop}
            description={t.mergePdfDropDesc}
            onFiles={handleFiles}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {pdfFiles.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              {pdfFiles.map((pdf, i) => (
                <div
                  key={`${pdf.file.name}-${i}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/30"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <PdfPreview file={pdf.file} pageIndex={0} width={56} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pdf.file.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t.pageLabel(pdf.pageCount)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => i > 0 && moveFile(i, i - 1)}
                      disabled={i === 0}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4 -rotate-90" />
                    </button>
                    <button
                      onClick={() => removeFile(i)}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => i < pdfFiles.length - 1 && moveFile(i, i + 1)}
                      disabled={i === pdfFiles.length - 1}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              {t.filesTotal(pdfFiles.length, totalPages)}
            </h3>
            <p className="mb-4 text-xs text-text-secondary">
              {t.mergeDesc}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.mergingPdfs} className="mb-4" />
            )}

            <button
              onClick={merge}
              disabled={!pdfFiles.length || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Merge className="h-4 w-4" />
              {processing ? t.merging : t.mergePdfs}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
