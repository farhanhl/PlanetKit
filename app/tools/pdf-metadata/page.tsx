"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import { Save, FileText } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ProgressBar from "@/app/components/ProgressBar";

interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  pageCount: number;
  fileSize: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfMetadataPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [edited, setEdited] = useState<Partial<Metadata>>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setMetadata(null);
    setEdited({});

    try {
      const buffer = await f.arrayBuffer();

      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdfDoc = await pdfjs.getDocument({ data: buffer }).promise;

      const meta: Metadata = {
        title: pdf.getTitle() || "",
        author: pdf.getAuthor() || "",
        subject: pdf.getSubject() || "",
        keywords: pdf.getKeywords() || "",
        creator: pdf.getCreator() || "",
        producer: pdf.getProducer() || "",
        pageCount: pdfDoc.numPages,
        fileSize: f.size,
      };

      setMetadata(meta);
      setEdited({});
    } catch {
      setError(t.metadataReadFailed);
    }
  }, [t]);

  const removeFile = useCallback(() => {
    setFile(null);
    setMetadata(null);
    setEdited({});
    setError(null);
  }, []);

  const updateField = useCallback(
    (field: keyof Metadata, value: string) => {
      setEdited((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const save = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setProgress(50);

      if (edited.title !== undefined) pdf.setTitle(edited.title);
      if (edited.author !== undefined) pdf.setAuthor(edited.author);
      if (edited.subject !== undefined) pdf.setSubject(edited.subject);
      if (edited.keywords !== undefined) pdf.setKeywords(edited.keywords.split(",").map((k) => k.trim()).filter(Boolean));

      setProgress(80);
      const bytes = await pdf.save();
      setProgress(100);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "metadata_updated.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setMetadata((prev) => prev ? { ...prev, ...edited } : prev);
      setEdited({});
    } catch {
      setError(t.metadataSaveFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const hasChanges = Object.keys(edited).length > 0;

  const getField = (field: keyof Metadata) =>
    edited[field] !== undefined ? (edited[field] as string) : (metadata?.[field] as string) || "";

  return (
    <ToolPageLayout
      title={t.pdfMetadataTitle}
      description={t.pdfMetadataDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.pdfMetadataDrop}
            description={t.pdfMetadataDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {metadata && (
            <div className="mt-6 rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.documentProperties}</h3>

              <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">{t.pages}</span>
                  <p className="font-medium text-foreground">{metadata.pageCount}</p>
                </div>
                <div>
                  <span className="text-text-secondary">{t.fileSize}</span>
                  <p className="font-medium text-foreground">{formatSize(metadata.fileSize)}</p>
                </div>
                <div>
                  <span className="text-text-secondary">{t.creator}</span>
                  <p className="font-medium text-foreground">{metadata.creator || "—"}</p>
                </div>
                <div>
                  <span className="text-text-secondary">{t.producer}</span>
                  <p className="font-medium text-foreground">{metadata.producer || "—"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.title}</label>
                  <input
                    type="text"
                    value={getField("title")}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder={t.docTitle}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.author}</label>
                  <input
                    type="text"
                    value={getField("author")}
                    onChange={(e) => updateField("author", e.target.value)}
                    placeholder={t.authorName}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.subject}</label>
                  <input
                    type="text"
                    value={getField("subject")}
                    onChange={(e) => updateField("subject", e.target.value)}
                    placeholder={t.docSubject}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    {t.keywordsLabel}
                  </label>
                  <input
                    type="text"
                    value={getField("keywords")}
                    onChange={(e) => updateField("keywords", e.target.value)}
                    placeholder={t.keywordsPlaceholder}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.actions}</h3>

            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {metadata ? metadata.title || t.untitled : t.noFile}
                </p>
                <p className="text-xs text-text-secondary">
                  {metadata ? t.pagesCount(metadata.pageCount) : t.uploadToBegin}
                </p>
              </div>
            </div>

            {processing && (
              <ProgressBar progress={progress} label={t.saving} className="mb-4" />
            )}

            <button
              onClick={save}
              disabled={!file || !hasChanges || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {processing ? t.saving : t.saveMetadata}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
