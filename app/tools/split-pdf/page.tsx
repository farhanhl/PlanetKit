"use client";

import { useState, useCallback } from "react";
import { Scissors } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

export default function SplitPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeInput, setRangeInput] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"keep" | "remove">("keep");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setSelectedPages(new Set());
    setRangeInput("");

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      setPageCount(pdf.numPages);
    } catch {
      setError(t.readPdfFailed);
    }
  }, [t.readPdfFailed]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setSelectedPages(new Set());
    setRangeInput("");
  }, []);

  const parseRange = useCallback(
    (input: string): Set<number> => {
      const pages = new Set<number>();
      const parts = input.split(",").map((s) => s.trim());
      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          if (start >= 1 && end <= pageCount && start <= end) {
            for (let i = start; i <= end; i++) pages.add(i);
          }
        } else {
          const num = Number(part);
          if (num >= 1 && num <= pageCount) pages.add(num);
        }
      }
      return pages;
    },
    [pageCount]
  );

  const handleRangeChange = useCallback(
    (value: string) => {
      setRangeInput(value);
      setSelectedPages(parseRange(value));
    },
    [parseRange]
  );

  const togglePage = useCallback(
    (pageNum: number) => {
      setSelectedPages((prev) => {
        const next = new Set(prev);
        if (next.has(pageNum)) next.delete(pageNum);
        else next.add(pageNum);
        return next;
      });
    },
    []
  );

  const selectAll = useCallback(() => {
    const all = new Set(Array.from({ length: pageCount }, (_, i) => i + 1));
    setSelectedPages(all);
    setRangeInput(`1-${pageCount}`);
  }, [pageCount]);

  const selectNone = useCallback(() => {
    setSelectedPages(new Set());
    setRangeInput("");
  }, []);

  const split = async () => {
    if (!file || selectedPages.size === 0) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const newPdf = await PDFDocument.create();

      const pagesToCopy =
        mode === "keep"
          ? Array.from(selectedPages).sort((a, b) => a - b)
          : Array.from({ length: pageCount }, (_, i) => i + 1).filter(
              (p) => !selectedPages.has(p)
            );

      if (pagesToCopy.length === 0) {
        setError(t.splitFailed);
        setProcessing(false);
        return;
      }

      setProgress(50);
      const copiedPages = await newPdf.copyPages(pdf, pagesToCopy.map((p) => p - 1));
      copiedPages.forEach((p) => newPdf.addPage(p));

      setProgress(90);
      const bytes = await newPdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "split.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.splitFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const effectiveCount =
    mode === "keep"
      ? selectedPages.size
      : pageCount - selectedPages.size;

  return (
    <ToolPageLayout
      title={t.splitPdfTitle}
      description={t.splitPdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.splitPdfDrop}
            description={t.splitPdfDropDesc}
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
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {t.splitHint}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-accent hover:text-accent-hover"
                  >
                    {t.selectAll}
                  </button>
                  <button
                    onClick={selectNone}
                    className="text-xs text-text-secondary hover:text-foreground"
                  >
                    {t.clear}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => togglePage(pageNum)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all ${
                      selectedPages.has(pageNum)
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <PdfPreview file={file} pageIndex={pageNum - 1} width={100} />
                    <span className="text-xs font-medium text-foreground">
                      {pageNum}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.splitSettings}</h3>

            <label className="mb-1 block text-xs text-text-secondary">{t.mode}</label>
            <div className="mb-4 flex gap-2">
              {(["keep", "remove"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    mode === m
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-secondary hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {m === "keep" ? t.keepSelected : t.removeSelected}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.pageRange}
            </label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeChange(e.target.value)}
              placeholder={t.rangePlaceholder}
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
            />

            <p className="mb-4 text-xs text-text-secondary">
              {t.pagesWillBe(effectiveCount, mode)}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.splitting} className="mb-4" />
            )}

            <button
              onClick={split}
              disabled={!file || selectedPages.size === 0 || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Scissors className="h-4 w-4" />
              {processing ? t.splitting : t.splitPdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
