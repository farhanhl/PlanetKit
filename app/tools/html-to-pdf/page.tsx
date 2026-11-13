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
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas-pro"),
      ]);

      const pageSizes: Record<string, [number, number]> = {
        a4: [210, 297],
        letter: [215.9, 279.4],
        legal: [215.9, 355.6],
      };

      const [pw, ph] = pageSizes[pageSize];
      const isLandscape = orientation === "landscape";
      const pdfW = isLandscape ? ph : pw;
      const pdfH = isLandscape ? pw : ph;

      setProgress(20);
      // Gunakan isolated iframe agar style dan tag CSS tidak bocor ke website
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-99999px;left:-99999px;width:800px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        throw new Error("Failed to create isolated document");
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      await new Promise((resolve) => setTimeout(resolve, 80));

      setProgress(40);
      const targetEl = iframeDoc.body;
      const canvas = await html2canvas.default(targetEl, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      document.body.removeChild(iframe);

      setProgress(60);
      // Konfigurasi Margin & Ukuran Halaman
      const marginX = 12; // 12mm margin
      const marginY = 12;
      const contentWidthMm = pdfW - marginX * 2;
      const pageHeightMm = pdfH - marginY * 2;

      const pxPerMm = canvas.width / contentWidthMm;
      const sliceHeightPx = Math.floor(pageHeightMm * pxPerMm);

      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: pageSize,
      });

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        if (pageIndex > 0) pdf.addPage();

        const currentSlicePx = Math.min(sliceHeightPx, canvas.height - sourceY);
        const currentSliceMm = currentSlicePx / pxPerMm;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = currentSlicePx;
        const ctx = sliceCanvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            currentSlicePx,
            0,
            0,
            canvas.width,
            currentSlicePx
          );

          // Gunakan JPEG kualitas 0.85 untuk kompresi file optimal (< 1 MB)
          const imgData = sliceCanvas.toDataURL("image/jpeg", 0.85);
          pdf.addImage(imgData, "JPEG", marginX, marginY, contentWidthMm, currentSliceMm, undefined, "FAST");
        }

        sourceY += currentSlicePx;
        pageIndex++;
        setProgress(60 + Math.min(35, (pageIndex / Math.ceil(canvas.height / sliceHeightPx)) * 35));
      }

      setProgress(100);
      pdf.save("output.pdf");
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
