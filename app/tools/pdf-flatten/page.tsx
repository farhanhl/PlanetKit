"use client";

import { useState, useCallback } from "react";
import { Layers } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function PdfFlattenPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
  }, []);

  const flatten = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const form = pdf.getForm();
      try { form.flatten(); } catch {}

      const bytes = await pdf.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flattened.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.pdfFlattenFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.pdfFlattenTitle} description={t.pdfFlattenDesc} path="/tools/pdf-flatten" />
      <ToolPageLayout title={t.pdfFlattenTitle} description={t.pdfFlattenDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".pdf" label={t.pdfFlattenDrop} description={t.pdfFlattenDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => setFile(null)} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.pdfFlattenSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.pdfFlattenNote}</p>
              <button onClick={flatten} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Layers className="h-4 w-4" />
                {processing ? t.flattening : t.pdfFlattenBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
