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
  body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
  h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
  h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
  p { margin: 0.8em 0; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #D4A853; margin: 1em 0; padding: 0.5em 1em; background: #fafafa; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f4f4f4; }
  img { max-width: 100%; }
  a { color: #D4A853; }
  ul, ol { padding-left: 2em; }
  li { margin: 0.3em 0; }
</style>
</head>
<body>${htmlBody}</body>
</html>`;

      const { default: html2canvas } = await import("html2canvas-pro");
      const { default: jsPDF } = await import("jspdf");

      const container = document.createElement("div");
      container.style.cssText = "position:absolute;left:-9999px;width:800px;background:white;color:#1a1a1a;";
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      const pageHeight = 297;
      let y = 0;
      let remaining = imgHeight;

      while (remaining > 0) {
        if (y > 0) pdf.addPage();
        const sliceHeight = Math.min(pageHeight, remaining);
        const sliceRatio = sliceHeight / imgHeight;
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = canvas.height * sliceRatio;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, -y * (canvas.height / imgHeight), canvas.width, canvas.height);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, sliceHeight);
        y += pageHeight;
        remaining -= sliceHeight;
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
