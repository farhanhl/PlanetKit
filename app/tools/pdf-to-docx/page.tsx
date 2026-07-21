"use client";

import { useState, useCallback } from "react";
import { FileDown } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import { useLang } from "@/app/lib/i18n/context";

export default function PdfToDocxPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
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

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const { Document, Packer, Paragraph, TextRun } = await import("docx");

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paragraphs: any[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress((i / pdf.numPages) * 80);

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `--- Page ${i} ---`,
                bold: true,
                size: 20,
                color: "888888",
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        let currentLine = "";
        for (const item of content.items) {
          if ("str" in item) {
            if (item.str === "" && currentLine) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: currentLine, size: 24 })],
                  spacing: { after: 80 },
                })
              );
              currentLine = "";
            } else {
              currentLine += item.str;
            }
          }
        }
        if (currentLine) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: currentLine, size: 24 })],
              spacing: { after: 80 },
            })
          );
        }
      }

      setProgress(90);

      const doc = new Document({
        sections: [{ children: paragraphs }],
      });

      const blob = await Packer.toBlob(doc);
      setProgress(100);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + ".docx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.pdfToDocxFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolPageLayout title={t.pdfToDocxTitle} description={t.pdfToDocxDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.pdfToDocxDrop}
            description={t.pdfToDocxDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {file && pageCount > 0 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <PdfPreview file={file} pageIndex={0} width={200} />
              <p className="text-xs text-text-secondary">
                {t.pagesCount(pageCount)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

            <p className="mb-4 text-xs text-text-secondary">
              {t.pdfToDocxNote}
            </p>

            {processing && (
              <ProgressBar progress={progress} label={t.converting} className="mb-4" />
            )}

            <button
              onClick={convert}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileDown className="h-4 w-4" />
              {processing ? t.converting : t.convertToDocx}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
