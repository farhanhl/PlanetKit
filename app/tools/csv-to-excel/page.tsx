"use client";

import { useState, useCallback } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function CsvToExcelPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
  }, []);

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const XLSX = await import("xlsx");
      const text = await file.arrayBuffer();
      const workbook = XLSX.read(text, { type: "array" });
      XLSX.writeFile(workbook, file.name.replace(/\.csv$/i, ".xlsx"));
    } catch {
      setError(t.csvToExcelFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.csvToExcelTitle} description={t.csvToExcelDesc} path="/tools/csv-to-excel" />
      <ToolPageLayout title={t.csvToExcelTitle} description={t.csvToExcelDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".csv" label={t.csvToExcelDrop} description={t.csvToExcelDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => setFile(null)} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.csvToExcelNote}</p>
              <button onClick={convert} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <FileSpreadsheet className="h-4 w-4" />
                {processing ? t.converting : t.convertToExcel}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
