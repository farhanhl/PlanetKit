"use client";

import { useState, useCallback } from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ProgressBar from "@/app/components/ProgressBar";
import ToolSeo from "@/app/components/ToolSeo";

export default function PdfToExcelPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ rows: number; sheets: number } | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
    setResult(null);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
    setResult(null);
  }, []);

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const XLSX = await import("xlsx");

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const allRows: string[][] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress((i / pdf.numPages) * 80);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const lines: Record<number, string[]> = {};
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item.str);
        }

        const sortedY = Object.keys(lines)
          .map(Number)
          .sort((a, b) => b - a);

        for (const y of sortedY) {
          allRows.push(lines[y]);
        }

        if (i < pdf.numPages) {
          allRows.push([]);
        }
      }

      setProgress(90);

      const ws = XLSX.utils.aoa_to_sheet(allRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
      XLSX.writeFile(wb, file.name.replace(/\.pdf$/i, ".xlsx"));

      setProgress(100);
      setResult({ rows: allRows.length, sheets: 1 });
    } catch {
      setError(t.pdfToExcelFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <>
    <ToolSeo title={t.pdfToExcelTitle} description={t.pdfToExcelDesc} path="/tools/pdf-to-excel" />
    <ToolPageLayout title={t.pdfToExcelTitle} description={t.pdfToExcelDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.pdfToExcelDrop}
            description={t.pdfToExcelDropDesc}
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Download className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.pdfToExcelSuccess}</p>
                  <p className="text-xs text-text-secondary">
                    {result.rows} rows · {result.sheets} {result.sheets === 1 ? "sheet" : "sheets"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">{t.pdfToExcelNote}</p>

            {processing && (
              <ProgressBar progress={progress} label={t.convertingToExcel} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {processing ? t.convertingToExcel : t.convertToExcel}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
    </>
  );
}
