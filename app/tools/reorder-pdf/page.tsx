"use client";

import { useState, useCallback } from "react";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";

export default function ReorderPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
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
      setOrder(Array.from({ length: pdf.numPages }, (_, i) => i));
    } catch {
      setError(t.readPdfFailed);
    }
  }, [t.readPdfFailed]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setOrder([]);
  }, []);

  const movePage = useCallback((from: number, to: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(Array.from({ length: pageCount }, (_, i) => i));
  }, [pageCount]);

  const apply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const newPdf = await PDFDocument.create();

      setProgress(50);
      const copiedPages = await newPdf.copyPages(pdf, order);
      copiedPages.forEach((p) => newPdf.addPage(p));

      setProgress(90);
      const bytes = await newPdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reordered.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.reorderFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const isDefaultOrder = order.every((v, i) => v === i);

  return (
    <ToolPageLayout
      title={t.reorderPdfTitle}
      description={t.reorderPdfDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.reorderPdfDrop}
            description={t.reorderPdfDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {file && order.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              {order.map((pageIndex, position) => (
                <div
                  key={`${pageIndex}-${position}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/30"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs font-bold text-accent">
                    {position + 1}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <PdfPreview file={file} pageIndex={pageIndex} width={56} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t.page(pageIndex + 1)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => position > 0 && movePage(position, position - 1)}
                      disabled={position === 0}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4 -rotate-90" />
                    </button>
                    <button
                      onClick={() =>
                        position < order.length - 1 && movePage(position, position + 1)
                      }
                      disabled={position === order.length - 1}
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
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.reorderSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.reorderDesc}
            </p>

            {!isDefaultOrder && (
              <button
                onClick={resetOrder}
                className="mb-4 flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground"
              >
                <ArrowUpDown className="h-3 w-3" />
                {t.resetOrder}
              </button>
            )}

            {processing && (
              <ProgressBar progress={progress} label={t.reordering} className="mb-4" />
            )}

            <button
              onClick={apply}
              disabled={!file || isDefaultOrder || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUpDown className="h-4 w-4" />
              {processing ? t.reordering : t.applyOrder}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
