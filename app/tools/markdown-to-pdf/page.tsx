"use client";

import { useState } from "react";
import { FileCode } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function MarkdownToPdfPage() {
  const { t } = useLang();
  const [markdown, setMarkdown] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    if (!markdown.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      const MarkdownIt = (await import("markdown-it")).default;
      const mdi = new MarkdownIt({ html: true, linkify: true, typographer: true });
      const htmlBody = mdi.render(markdown);

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.65;
    margin: 0;
    padding: 32px;
    background: #ffffff;
    font-size: 14px;
  }
  h1, h2, h3, h4, h5, h6 { margin-top: 1.4em; margin-bottom: 0.5em; color: #0f172a; font-weight: 700; }
  h1 { font-size: 2.1em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
  h2 { font-size: 1.6em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25em; }
  h3 { font-size: 1.3em; }
  p { margin: 0.75em 0; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: monospace; }
  pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #D4A853; margin: 1em 0; padding: 0.5em 1em; background: #fefce8; color: #4b5563; }
  table { border-collapse: collapse; width: 100%; margin: 1.2em 0; font-size: 13px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  a { color: #2563eb; text-decoration: underline; }
  ul, ol { padding-left: 1.8em; margin: 0.8em 0; }
  li { margin: 0.25em 0; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
</style>
</head>
<body>${htmlBody}</body>
</html>`;

      const { default: html2canvas } = await import("html2canvas-pro");
      const { default: jsPDF } = await import("jspdf");

      // Gunakan isolated iframe agar style (seperti CSS body) tidak bocor ke halaman web
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-99999px;left:-99999px;width:800px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        throw new Error("Failed to create isolated document");
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Tunggu sebentar agar render DOM dan font selesai
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Ambil posisi elemen blok untuk smart pagination dan selectable text layer
      const targetEl = iframeDoc.body;
      const bodyRect = targetEl.getBoundingClientRect();
      const blockElements = Array.from(
        targetEl.querySelectorAll("h1, h2, h3, h4, h5, h6, p, pre, blockquote, table, tr, li, hr, img")
      ).map((el) => {
        const rect = el.getBoundingClientRect();
        const htmlEl = el as HTMLElement;
        const isLeaf =
          el.children.length === 0 ||
          el.tagName === "P" ||
          el.tagName === "LI" ||
          el.tagName === "PRE" ||
          el.tagName === "BLOCKQUOTE" ||
          el.tagName.startsWith("H");

        return {
          tagName: el.tagName.toUpperCase(),
          top: rect.top - bodyRect.top,
          bottom: rect.bottom - bodyRect.top,
          left: rect.left - bodyRect.left,
          width: rect.width,
          height: rect.height,
          text: isLeaf ? (htmlEl.innerText || el.textContent || "").trim() : "",
        };
      });

      const canvas = await html2canvas(targetEl, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(iframe);

      // Konfigurasi Margin & Ukuran A4 (210 x 297 mm)
      const marginX = 15; // margin kiri & kanan 15mm
      const marginY = 15; // margin atas & bawah 15mm
      const contentWidthMm = 210 - marginX * 2; // 180mm
      const pageHeightMm = 297 - marginY * 2; // 267mm

      const pxPerMm = canvas.width / contentWidthMm;
      const maxSliceHeightPx = Math.floor(pageHeightMm * pxPerMm);

      const pdf = new jsPDF("p", "mm", "a4");

      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const remainingHeight = canvas.height - sourceY;
        let sliceHeightPx = Math.min(maxSliceHeightPx, remainingHeight);

        // Jika sisa konten masih lebih panjang dari 1 halaman, cari batas potong yang rapi
        if (remainingHeight > maxSliceHeightPx) {
          const targetCutY = sourceY + maxSliceHeightPx;
          let bestCutY = targetCutY;

          for (const el of blockElements) {
            const elTopPx = el.top * 1.5;
            const elBottomPx = el.bottom * 1.5;

            // Jika elemen ini terbelah oleh garis potong:
            if (elTopPx > sourceY + 40 && elTopPx < targetCutY && elBottomPx > targetCutY) {
              if (elBottomPx - elTopPx < maxSliceHeightPx * 0.85) {
                bestCutY = Math.min(bestCutY, elTopPx - 6);
              }
            }

            // Cegah orphan heading (judul tertinggal sendirian di bagian paling bawah halaman)
            if (el.tagName.startsWith("H")) {
              if (elTopPx > sourceY && elBottomPx >= targetCutY - 70 && elTopPx < targetCutY) {
                bestCutY = Math.min(bestCutY, elTopPx - 6);
              }
            }
          }

          // Pastikan halaman tetap maju minimal 25% dari tinggi maksimal untuk mencegah loop
          if (bestCutY > sourceY + maxSliceHeightPx * 0.25) {
            sliceHeightPx = bestCutY - sourceY;
          }
        }

        const currentSliceMm = sliceHeightPx / pxPerMm;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );

          // Gunakan JPEG kualitas 0.85 untuk kompresi file optimal (mengecilkan ukuran hingga >90%)
          const imgData = sliceCanvas.toDataURL("image/jpeg", 0.85);
          pdf.addImage(imgData, "JPEG", marginX, marginY, contentWidthMm, currentSliceMm, undefined, "FAST");

          // Tambahkan layer teks tak terlihat (Searchable & Selectable Text Layer)
          try {
            pdf.setFont("helvetica", "normal");

            for (const el of blockElements) {
              if (!el.text) continue;
              const elTopPx = el.top * 1.5;
              if (elTopPx >= sourceY - 4 && elTopPx < sourceY + sliceHeightPx) {
                const relTopMm = (elTopPx - sourceY) / pxPerMm;
                const xMm = marginX + Math.max(0, (el.left / bodyRect.width) * contentWidthMm);
                const yMm = marginY + relTopMm + 4;

                if (el.tagName.startsWith("H1")) {
                  pdf.setFontSize(16);
                } else if (el.tagName.startsWith("H2")) {
                  pdf.setFontSize(13);
                } else {
                  pdf.setFontSize(9.5);
                }

                const lines = pdf.splitTextToSize(el.text, contentWidthMm);
                pdf.text(lines, xMm, yMm, {
                  maxWidth: contentWidthMm,
                  renderingMode: "invisible",
                });
              }
            }
          } catch {
            // Abaikan jika browser tidak mendukung text stream injection
          }
        }

        sourceY += sliceHeightPx;
        pageIndex++;
      }

      pdf.save("markdown.pdf");
    } catch {
      setError(t.markdownToPdfFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.markdownToPdfTitle} description={t.markdownToPdfDesc} path="/tools/markdown-to-pdf" />
      <ToolPageLayout title={t.markdownToPdfTitle} description={t.markdownToPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={t.markdownPlaceholder}
              className="h-[500px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.markdownNote}</p>
              <button
                onClick={convert}
                disabled={!markdown.trim() || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileCode className="h-4 w-4" />
                {processing ? t.converting : t.convertToPdf}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
