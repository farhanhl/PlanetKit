"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Download, EyeOff } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function RedactPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<{ num: number; width: number; height: number }[]>([]);
  const [redactions, setRedactions] = useState<Record<number, { x: number; y: number; w: number; h: number }[]>>({});
  const [selectedPage, setSelectedPage] = useState(0);
  const [redactAll, setRedactAll] = useState(false);
  const [redactText, setRedactText] = useState("");
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") return;
    setFile(f);
    const bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    setPdfDoc(doc);
    const pageCount = doc.getPageCount();
    const pageInfo = Array.from({ length: pageCount }, (_, i) => {
      const p = doc.getPage(i);
      const { width, height } = p.getSize();
      return { num: i + 1, width, height };
    });
    setPages(pageInfo);
    setSelectedPage(0);
    setRedactions({});
  }, []);

  const processPdf = async () => {
    if (!pdfDoc || !file) return;
    setProcessing(true);
    try {
      const newDoc = await PDFDocument.create();
      // Selalu sertakan semua halaman agar halaman lain tidak terhapus
      for (const pageInfo of pages) {
        const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageInfo.num - 1]);
        const page = newDoc.addPage(copiedPage);

        const shouldRedact = redactAll || pageInfo.num === selectedPage + 1;
        const rects = shouldRedact ? redactions[pageInfo.num] || [] : [];
        for (const rect of rects) {
          page.drawRectangle({
            x: rect.x,
            y: rect.y,
            width: rect.w,
            height: rect.h,
            color: rgb(0, 0, 0),
            opacity: 1,
          });
        }
      }

      const pdfBytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redacted-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t.redactPdfFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.redactPdfTitle} description={t.redactPdfDesc} path="/tools/redact-pdf" />
      <ToolPageLayout title={t.redactPdfTitle} description={t.redactPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!file ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/40"
              >
                <Upload className="mb-3 h-10 w-10 text-text-secondary/40" />
                <p className="text-sm font-medium text-foreground">{t.redactPdfDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.redactPdfDropDesc}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <button
                    onClick={() => { setFile(null); setPdfDoc(null); setPages([]); setRedactions({}); }}
                    className="text-xs text-text-secondary hover:text-foreground"
                  >
                    {t.change}
                  </button>
                </div>
                <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                  {pages.map((p, i) => (
                    <button
                      key={p.num}
                      onClick={() => { setSelectedPage(i); setRedactAll(false); }}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        !redactAll && selectedPage === i
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:border-accent/40"
                      }`}
                    >
                      {t.page} {p.num}
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <EyeOff className="mx-auto mb-2 h-8 w-8 text-text-secondary/40" />
                  <p className="text-xs text-text-secondary">
                    {redactions[pages[selectedPage]?.num]?.length || 0} {t.redactPdfAreas}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary/60">{t.redactPdfHint}</p>
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.redactPdfSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.redactPdfNote}</p>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-text-secondary">{t.redactPdfSearchText}</label>
                <input
                  type="text"
                  value={redactText}
                  onChange={(e) => setRedactText(e.target.value)}
                  placeholder={t.redactPdfSearchPlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                />
              </div>
              <label className="mb-4 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={redactAll}
                  onChange={(e) => setRedactAll(e.target.checked)}
                  className="accent-accent"
                />
                {t.redactPdfAllPages}
              </label>
              <button
                onClick={processPdf}
                disabled={!file || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                {processing ? t.converting : t.redactPdfBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
