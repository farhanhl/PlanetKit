"use client";

import { useState, useCallback } from "react";
import { FileUp } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function PptToPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
  }, []);

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const { jsPDF } = await import("jspdf");
      const zip = await JSZip.loadAsync(file);

      const slideFiles = Object.keys(zip.files)
        .filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
          return numA - numB;
        });

      if (slideFiles.length === 0) throw new Error("No slides found");

      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });

      for (let i = 0; i < slideFiles.length; i++) {
        if (i > 0) pdf.addPage([960, 540], "landscape");
        const slideEntry = zip.file(slideFiles[i]);
        if (!slideEntry) continue;
        const slideXml = await slideEntry.async("string");
        const parser = new DOMParser();
        const doc = parser.parseFromString(slideXml, "application/xml");
        const texts: string[] = [];
        doc.querySelectorAll("a:t").forEach((t) => texts.push(t.textContent || ""));
        if (texts.length > 0) {
          pdf.setFontSize(12);
          let y = 50;
          for (const text of texts) {
            const lines = pdf.splitTextToSize(text, 860);
            for (const line of lines) {
              if (y > 500) {
                pdf.addPage([960, 540], "landscape");
                y = 50;
              }
              pdf.text(line, 50, y);
              y += 18;
            }
          }
        }
      }

      pdf.save(file.name.replace(/\.(pptx?|ppt)$/i, ".pdf"));
    } catch {
      setError(t.pptToPdfFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.pptToPdfTitle} description={t.pptToPdfDesc} path="/tools/ppt-to-pdf" />
      <ToolPageLayout title={t.pptToPdfTitle} description={t.pptToPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".pptx,.ppt" label={t.pptToPdfDrop} description={t.pptToPdfDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => setFile(null)} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.pptToPdfNote}</p>
              <button onClick={convert} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <FileUp className="h-4 w-4" />
                {processing ? t.converting : t.convertToPdf}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
