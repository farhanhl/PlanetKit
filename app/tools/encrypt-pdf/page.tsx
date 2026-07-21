"use client";

import { useState, useCallback } from "react";
import { Unlock } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function DecryptPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  const decrypt = async () => {
    if (!file || !password) return;
    setProcessing(true);
    setError(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: buffer, password });
      const pdf = await loadingTask.promise;

      const pages: { width: number; height: number }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        pages.push({ width: vp.width, height: vp.height });
      }

      const { jsPDF } = await import("jspdf");
      const firstPage = pages[0];
      const pdfOut = new jsPDF({
        unit: "pt",
        format: [firstPage.width, firstPage.height],
      });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          const p = pages[i];
          pdfOut.addPage([p.width, p.height]);
        }
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const imgData = canvas.toDataURL("image/png");
        const p = pages[i];
        pdfOut.addImage(imgData, "PNG", 0, 0, p.width, p.height);
      }

      const blob = pdfOut.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "decrypted.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.decryptFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.decryptPdfTitle} description={t.decryptPdfDesc} path="/tools/encrypt-pdf" />
      <ToolPageLayout title={t.decryptPdfTitle} description={t.decryptPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader
              accept=".pdf"
              label={t.decryptPdfDrop}
              description={t.decryptPdfDropDesc}
              onFiles={handleFile}
              files={file ? [file] : []}
              onRemove={() => removeFile()}
            />
            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                {error}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.decryptSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.decryptNote}</p>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {t.enterPassword}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                />
              </div>
              <button
                onClick={decrypt}
                disabled={!file || !password || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Unlock className="h-4 w-4" />
                {processing ? t.decrypting : t.decryptPdfBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
