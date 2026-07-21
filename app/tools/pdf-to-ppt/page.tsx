"use client";

import { useState, useCallback } from "react";
import { Presentation } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ToolSeo from "@/app/components/ToolSeo";

export default function PdfToPptPage() {
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
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const PptxGenJS = (await import("pptxgenjs")).default;

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "A4", width: 8.27, height: 11.69 });
      pptx.layout = "A4";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const imgData = canvas.toDataURL("image/png");
        const slide = pptx.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
      }

      const blob = await pptx.write({ outputType: "blob" }) as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, ".pptx");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.pdfToPptFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.pdfToPptTitle} description={t.pdfToPptDesc} path="/tools/pdf-to-ppt" />
      <ToolPageLayout title={t.pdfToPptTitle} description={t.pdfToPptDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".pdf" label={t.pdfToPptDrop} description={t.pdfToPptDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => setFile(null)} />
            {file && <div className="mt-4"><PdfPreview file={file} pageIndex={0} /></div>}
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.pdfToPptNote}</p>
              <button onClick={convert} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Presentation className="h-4 w-4" />
                {processing ? t.converting : t.convertToPpt}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
