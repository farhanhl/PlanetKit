"use client";

import { useState, useCallback } from "react";
import { AlignJustify } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

type Align = "left" | "center" | "right";

export default function HeaderFooterPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [headerAlign, setHeaderAlign] = useState<Align>("left");
  const [footerAlign, setFooterAlign] = useState<Align>("left");
  const [headerSize, setHeaderSize] = useState(10);
  const [footerSize, setFooterSize] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      setPageCount(pdf.numPages);
    } catch {
      setError(t.readPdfFailed);
    }
  }, [t.readPdfFailed]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
  }, []);

  const apply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument, StandardFonts } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pdf.getPageCount(); i++) {
        setProgress(((i + 1) / pdf.getPageCount()) * 80);
        const page = pdf.getPage(i);
        const { width, height } = page.getSize();

        if (headerText.trim()) {
          const text = headerText
            .replace("{page}", `${i + 1}`)
            .replace("{total}", `${pdf.getPageCount()}`)
            .replace("{date}", new Date().toLocaleDateString());
          const textWidth = font.widthOfTextAtSize(text, headerSize);
          let x = 30;
          if (headerAlign === "center") x = width / 2 - textWidth / 2;
          if (headerAlign === "right") x = width - textWidth - 30;
          page.drawText(text, { x, y: height - 30, font, size: headerSize });
        }

        if (footerText.trim()) {
          const text = footerText
            .replace("{page}", `${i + 1}`)
            .replace("{total}", `${pdf.getPageCount()}`)
            .replace("{date}", new Date().toLocaleDateString());
          const textWidth = font.widthOfTextAtSize(text, footerSize);
          let x = 30;
          if (footerAlign === "center") x = width / 2 - textWidth / 2;
          if (footerAlign === "right") x = width - textWidth - 30;
          page.drawText(text, { x, y: 20, font, size: footerSize });
        }
      }

      setProgress(90);
      const bytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "header_footer.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.headerFooterFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const canApply = file && (headerText.trim() || footerText.trim());

  return (
    <ToolPageLayout title={t.headerFooterTitle} description={t.headerFooterDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.headerFooterDrop}
            description={t.headerFooterDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={removeFile}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {file && pageCount > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: pageCount }, (_, i) => i).map((pageIndex) => (
                <div key={pageIndex} className="flex flex-col items-center gap-1.5">
                  <PdfPreview file={file} pageIndex={pageIndex} width={120} />
                  <span className="text-[10px] text-text-secondary">
                    {pageIndex + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.headerFooterSettings}</h3>

            <label className="mb-1 block text-xs text-text-secondary">{t.headerText}</label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder={t.headerPlaceholder}
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />

            <label className="mb-1 block text-xs text-text-secondary">{t.alignment}</label>
            <div className="mb-3 flex gap-2">
              {(["left", "center", "right"] as Align[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setHeaderAlign(a)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    headerAlign === a
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-secondary hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {a === "left" ? t.alignLeft : a === "center" ? t.alignCenter : t.alignRight}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.headerSize}: {headerSize}
            </label>
            <input
              type="range"
              min={6}
              max={24}
              value={headerSize}
              onChange={(e) => setHeaderSize(parseInt(e.target.value))}
              className="mb-4 w-full accent-[var(--accent)]"
            />

            <label className="mb-1 block text-xs text-text-secondary">{t.footerText}</label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder={t.footerPlaceholder}
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />

            <label className="mb-1 block text-xs text-text-secondary">{t.alignment}</label>
            <div className="mb-3 flex gap-2">
              {(["left", "center", "right"] as Align[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setFooterAlign(a)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    footerAlign === a
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-secondary hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {a === "left" ? t.alignLeft : a === "center" ? t.alignCenter : t.alignRight}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs text-text-secondary">
              {t.footerSize}: {footerSize}
            </label>
            <input
              type="range"
              min={6}
              max={24}
              value={footerSize}
              onChange={(e) => setFooterSize(parseInt(e.target.value))}
              className="mb-3 w-full accent-[var(--accent)]"
            />

            <p className="mb-4 text-xs text-text-secondary">{t.variables}</p>

            {processing && (
              <ProgressBar progress={progress} label={t.applyingHeaderFooter} className="mb-4" />
            )}

            <button
              onClick={apply}
              disabled={!canApply || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AlignJustify className="h-4 w-4" />
              {processing ? t.applyingHeaderFooter : t.applyHeaderFooter}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
