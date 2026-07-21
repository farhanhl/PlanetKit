"use client";

import { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function DeletePagesPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0] || null;
    setFile(f);
    setSelected(new Set());
    setError(null);
    if (f) {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const buffer = await f.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        setPageCount(pdf.numPages);
      } catch {
        setPageCount(0);
      }
    }
  }, []);

  const togglePage = (n: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const deletePages = async () => {
    if (!file || selected.size === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const indices = Array.from(selected).sort((a, b) => b - a);
      for (const idx of indices) {
        pdf.removePage(idx - 1);
      }
      const bytes = await pdf.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "deleted_pages.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.deletePagesFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.deletePagesTitle} description={t.deletePagesDesc} path="/tools/delete-pages" />
      <ToolPageLayout title={t.deletePagesTitle} description={t.deletePagesDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".pdf" label={t.deletePagesDrop} description={t.deletePagesDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => { setFile(null); setPageCount(0); setSelected(new Set()); }} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {file && pageCount > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.deletePagesSelect}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent/40">{t.selectAll}</button>
                    <button onClick={() => setSelected(new Set())} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent/40">{t.clear}</button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => togglePage(n)} className={`flex h-14 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${selected.has(n) ? "border-error bg-error/10 text-error" : "border-border bg-surface text-text-secondary hover:border-accent/40"}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  {selected.size > 0 ? t.deletePagesCount(selected.size, pageCount) : t.deletePagesHint}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.deletePagesSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.deletePagesNote}</p>
              <button onClick={deletePages} disabled={!file || selected.size === 0 || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 className="h-4 w-4" />
                {processing ? t.deleting : t.deletePagesBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
