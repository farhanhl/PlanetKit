"use client";

import { useState, useCallback } from "react";
import { Code } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

export default function HtmlToPdfPage() {
  const { t } = useLang();
  const [htmlContent, setHtmlContent] = useState("");
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "legal">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const convertToPdf = useCallback(async () => {
    if (!htmlContent.trim()) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(10);
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

      const pageSizes: Record<string, [number, number]> = {
        a4: [595.28, 841.89],
        letter: [612, 792],
        legal: [612, 1008],
      };

      let [w, h] = pageSizes[pageSize];
      if (orientation === "landscape") [w, h] = [h, w];

      setProgress(30);
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const lines = htmlContent.split("\n");

      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      const margin = 50;

      let currentPage = pdf.addPage([w, h]);
      let y = h - margin;

      setProgress(50);

      for (const line of lines) {
        if (y < margin) {
          currentPage = pdf.addPage([w, h]);
          y = h - margin;
        }
        const maxChars = Math.floor((w - 2 * margin) / (fontSize * 0.5));
        const wrapped =
          line.length > maxChars
            ? [line.slice(0, maxChars), line.slice(maxChars)]
            : [line];
        for (const wl of wrapped) {
          if (y < margin) {
            currentPage = pdf.addPage([w, h]);
            y = h - margin;
          }
          currentPage.drawText(wl || " ", {
            x: margin,
            y,
            font,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        }
      }

      setProgress(80);
      const bytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.htmlToPdfFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [htmlContent, pageSize, orientation, t]);

  return (
    <ToolPageLayout title={t.htmlToPdfTitle} description={t.htmlToPdfDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <textarea
            value={htmlContent}
            onChange={(e) => {
              setHtmlContent(e.target.value);
              setError(null);
            }}
            placeholder={t.htmlPlaceholder}
            className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.htmlToPdfSettings || t.qrSettings}
            </h3>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.pageSize}
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as "a4" | "letter" | "legal")}
              className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none"
            >
              <option value="a4">{t.sizeA4}</option>
              <option value="letter">{t.sizeLetter}</option>
              <option value="legal">{t.sizeLegal}</option>
            </select>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.orientation}
            </label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
              className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none"
            >
              <option value="portrait">{t.portrait}</option>
              <option value="landscape">{t.landscape}</option>
            </select>

            {processing && (
              <ProgressBar progress={progress} label={t.converting} className="mb-4" />
            )}

            <button
              onClick={convertToPdf}
              disabled={!htmlContent.trim() || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Code className="h-4 w-4" />
              {processing ? t.converting : t.convertToPdf}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
