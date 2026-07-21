"use client";

import { useState, useCallback } from "react";
import { Lock } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function PdfEncryptPage() {
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

  const encrypt = async () => {
    if (!file || !password) return;
    setProcessing(true);
    setError(null);

    try {
      const { encryptPdf } = await import("@/app/lib/pdf-encrypt");
      const buffer = await file.arrayBuffer();
      const bytes = await encryptPdf(new Uint8Array(buffer), password);

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "_encrypted.pdf");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.encryptFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.encryptPdfTitle} description={t.encryptPdfDesc} path="/tools/pdf-encrypt" />
      <ToolPageLayout title={t.encryptPdfTitle} description={t.encryptPdfDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader
              accept=".pdf"
              label={t.encryptPdfDrop}
              description={t.encryptPdfDropDesc}
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
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.encryptSettings}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.encryptNote}</p>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {t.setPassword}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.encryptPasswordPlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                />
              </div>
              <button
                onClick={encrypt}
                disabled={!file || !password || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock className="h-4 w-4" />
                {processing ? t.encrypting : t.encryptPdfBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
