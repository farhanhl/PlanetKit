"use client";

import { useState, useCallback } from "react";
import { Wrench } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function RepairPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ original: number; repaired: number } | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
    setResult(null);
  }, []);

  const repair = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

      pdf.setTitle("");
      pdf.setSubject("");
      pdf.setKeywords([]);

      const bytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({ original: file.size, repaired: blob.size });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "repaired.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.repairPdfFailed);
    } finally {
      setProcessing(false);
    }
  };

  const reduction = result ? Math.round(((result.original - result.repaired) / result.original) * 100) : 0;

  return (
    <>
      <ToolSeo title={t.repairPdfTitle} description={t.repairPdfDesc} path="/tools/repair-pdf" />
      <ToolPageLayout title={t.repairPdfTitle} description={t.repairPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".pdf" label={t.repairPdfDrop} description={t.repairPdfDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => { setFile(null); setResult(null); }} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {result && (
              <div className="mt-6 rounded-xl border border-border bg-surface p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.result}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-text-secondary">{t.original}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{formatSize(result.original)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{t.repaired}</p>
                    <p className="mt-1 text-lg font-bold text-accent">{formatSize(result.repaired)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{t.change}</p>
                    <p className={`mt-1 text-lg font-bold ${reduction >= 0 ? "text-success" : "text-error"}`}>{reduction > 0 ? `${reduction}%` : "—"}</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-text-secondary">{t.repairPdfNote}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.repairPdfSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.repairPdfDesc2}</p>
              <button onClick={repair} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Wrench className="h-4 w-4" />
                {processing ? t.repairing : t.repairPdfBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
