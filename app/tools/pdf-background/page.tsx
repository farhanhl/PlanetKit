"use client";

import { useState, useCallback } from "react";
import { Paintbrush } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

const COLORS = ["#FFFFFF", "#F8F9FC", "#0B1120", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF6600"];

export default function PdfBackgroundPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState("#FFFFFF");
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
  }, []);

  const addBackground = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const pages = pdf.getPages();
      const hex = hexToRgb(color);
      const bgColor = rgb(hex.r / 255, hex.g / 255, hex.b / 255);

      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: bgColor,
          opacity: 1,
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "background_added.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.pdfBgFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.pdfBgTitle} description={t.pdfBgDesc} path="/tools/pdf-background" />
      <ToolPageLayout title={t.pdfBgTitle} description={t.pdfBgDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".pdf" label={t.pdfBgDrop} description={t.pdfBgDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => setFile(null)} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.pdfBgSettings}</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.bgColor}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => { setColor(c); setCustomColor(c); }} className={`h-8 w-8 rounded-lg border-2 transition-colors ${color === c ? "border-accent" : "border-border"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }} className="h-8 w-8 cursor-pointer rounded border-0" />
                  <span className="font-mono text-xs text-text-secondary">{color}</span>
                </div>
              </div>
              <button onClick={addBackground} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Paintbrush className="h-4 w-4" />
                {processing ? t.adding : t.pdfBgBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 255, b: 255 };
}
