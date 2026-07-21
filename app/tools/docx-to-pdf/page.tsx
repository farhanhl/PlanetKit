"use client";

import { useState, useCallback, useRef } from "react";
import { FileDown } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

export default function DocxToPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [htmlPreview, setHtmlPreview] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setHtmlPreview("");

    try {
      const mammoth = await import("mammoth");
      const buffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      setHtmlPreview(result.value || "<p>No content found</p>");
    } catch {
      setError(t.docxToPdfReadFailed);
    }
  }, [t.docxToPdfReadFailed]);

  const removeFile = useCallback(() => {
    setFile(null);
    setHtmlPreview("");
  }, []);

  const convert = async () => {
    if (!file || !htmlPreview) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(20);

      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      setProgress(40);

      const container = previewRef.current;
      if (!container) throw new Error("Preview not found");

      const clonedContainer = container.cloneNode(true) as HTMLDivElement;
      clonedContainer.style.position = "absolute";
      clonedContainer.style.left = "-9999px";
      clonedContainer.style.width = "794px";
      clonedContainer.style.background = "#ffffff";
      clonedContainer.style.color = "#000000";
      clonedContainer.style.padding = "40px";
      clonedContainer.style.fontFamily = "serif";
      document.body.appendChild(clonedContainer);

      setProgress(60);

      const canvas = await html2canvas(clonedContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(clonedContainer);

      setProgress(80);

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageHeight = 297;
      let yPosition = 0;

      while (yPosition < imgHeight) {
        if (yPosition > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          -yPosition,
          imgWidth,
          imgHeight
        );

        yPosition += pageHeight;
      }

      setProgress(100);

      pdf.save(file.name.replace(/\.docx$/i, "") + ".pdf");
    } catch {
      setError(t.docxToPdfFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout title={t.docxToPdfTitle} description={t.docxToPdfDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".docx"
            label={t.docxToPdfDrop}
            description={t.docxToPdfDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {htmlPreview && (
            <div className="mt-6 rounded-xl border border-border bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.docxToPdfPreview}</h3>
              <div
                ref={previewRef}
                className="prose prose-sm max-w-none text-black"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.docxToPdfNote}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.convertingToPdf} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!file || !htmlPreview || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileDown className="h-4 w-4" />
              {processing ? t.converting : t.convertToPdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
