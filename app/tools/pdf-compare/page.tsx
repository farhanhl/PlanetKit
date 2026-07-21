"use client";

import { useState, useCallback } from "react";
import { GitCompare, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function PdfComparePage() {
  const { t } = useLang();
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ pagesA: number; pagesB: number; sizeA: number; sizeB: number; textDiff: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileA = useCallback((files: File[]) => { setFileA(files[0] || null); setError(null); setResult(null); }, []);
  const handleFileB = useCallback((files: File[]) => { setFileB(files[0] || null); setError(null); setResult(null); }, []);

  const compare = async () => {
    if (!fileA || !fileB) return;
    setProcessing(true);
    setError(null);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      const [pdfA, pdfB] = await Promise.all([
        pdfjs.getDocument({ data: bufA }).promise,
        pdfjs.getDocument({ data: bufB }).promise,
      ]);

      const extractText = async (pdf: { numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: (Record<string, unknown> & { str?: string })[] }> }> }) => {
        const texts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          texts.push(content.items.filter((item): item is { str: string } & typeof item => "str" in item).map((item) => item.str).join(" "));
        }
        return texts;
      };

      const [textA, textB] = await Promise.all([extractText(pdfA), extractText(pdfB)]);
      const maxPages = Math.max(textA.length, textB.length);
      const diffs: string[] = [];
      for (let i = 0; i < maxPages; i++) {
        const a = textA[i] || "(empty)";
        const b = textB[i] || "(empty)";
        if (a !== b) diffs.push(`Page ${i + 1}: DIFFERENT`);
        else diffs.push(`Page ${i + 1}: identical`);
      }

      setResult({
        pagesA: pdfA.numPages,
        pagesB: pdfB.numPages,
        sizeA: fileA.size,
        sizeB: fileB.size,
        textDiff: diffs.join("\n"),
      });
    } catch {
      setError(t.pdfCompareFailed);
    } finally {
      setProcessing(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.textDiff);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.pdfCompareTitle} description={t.pdfCompareDesc} path="/tools/pdf-compare" />
      <ToolPageLayout title={t.pdfCompareTitle} description={t.pdfCompareDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">{t.pdfCompareFileA}</p>
                <FileUploader accept=".pdf" label={t.pdfCompareDrop} description={t.pdfCompareDropDesc} onFiles={handleFileA} files={fileA ? [fileA] : []} onRemove={() => setFileA(null)} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">{t.pdfCompareFileB}</p>
                <FileUploader accept=".pdf" label={t.pdfCompareDrop} description={t.pdfCompareDropDesc} onFiles={handleFileB} files={fileB ? [fileB] : []} onRemove={() => setFileB(null)} />
              </div>
            </div>
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {result && (
              <div className="mt-6 rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{t.pdfCompareResult}</h3>
                  <button onClick={copyResult} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.pdfCompareFileA}</p>
                    <p className="text-lg font-bold text-foreground">{result.pagesA} pages</p>
                    <p className="text-xs text-text-secondary">{formatSize(result.sizeA)}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.pdfCompareFileB}</p>
                    <p className="text-lg font-bold text-foreground">{result.pagesB} pages</p>
                    <p className="text-xs text-text-secondary">{formatSize(result.sizeB)}</p>
                  </div>
                </div>
                <pre className="max-h-48 overflow-y-auto rounded-lg bg-background p-3 text-xs text-foreground whitespace-pre-wrap">{result.textDiff}</pre>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.pdfCompareNote}</p>
              <button onClick={compare} disabled={!fileA || !fileB || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <GitCompare className="h-4 w-4" />
                {processing ? t.comparing : t.pdfCompareBtn}
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
