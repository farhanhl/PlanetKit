"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const PAGE_SIZES: Record<string, { w: number; h: number }> = {
  A4: { w: 595, h: 842 },
  Letter: { w: 612, h: 792 },
  Legal: { w: 612, h: 1008 },
};

export default function TextToPdfPage() {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [pageSize, setPageSize] = useState("A4");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      const { jsPDF } = await import("jspdf");
      const size = PAGE_SIZES[pageSize];
      const pdf = new jsPDF({ unit: "pt", format: [size.w, size.h] });

      const margin = 40;
      const lineHeight = fontSize * 1.5;
      const maxWidth = size.w - margin * 2;
      const maxLines = Math.floor((size.h - margin * 2) / lineHeight);

      const lines = text.split("\n");
      let y = margin;
      let lineCount = 0;

      for (const line of lines) {
        if (line === "") {
          if (lineCount >= maxLines) {
            pdf.addPage();
            y = margin;
            lineCount = 0;
          }
          y += lineHeight;
          lineCount++;
        } else {
          const wrapped = pdf.splitTextToSize(line, maxWidth);
          for (const wLine of wrapped) {
            if (lineCount >= maxLines) {
              pdf.addPage();
              y = margin;
              lineCount = 0;
            }
            pdf.setFontSize(fontSize);
            pdf.text(wLine, margin, y);
            y += lineHeight;
            lineCount++;
          }
        }
      }

      pdf.save("text.pdf");
    } catch {
      setError(t.textToPdfFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.textToPdfTitle} description={t.textToPdfDesc} path="/tools/text-to-pdf" />
      <ToolPageLayout title={t.textToPdfTitle} description={t.textToPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.textToPdfPlaceholder}
              className="h-[500px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.pageSize}</label>
                <div className="flex gap-2">
                  {Object.keys(PAGE_SIZES).map((size) => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size)}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pageSize === size
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "border border-border text-text-secondary hover:border-accent/40"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {t.fontSizeLabel}: {fontSize}pt
                </label>
                <input
                  type="range"
                  min={8}
                  max={24}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <button
                onClick={convert}
                disabled={!text.trim() || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileText className="h-4 w-4" />
                {processing ? t.converting : t.convertToPdf}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
