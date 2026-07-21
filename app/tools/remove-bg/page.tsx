"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Eraser, Download, Loader2, RotateCcw } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import { useLang } from "@/app/lib/i18n/context";

interface Credits {
  total: number;
  elapsed: number;
  remaining: number;
}

export default function RemoveBgPage() {
  const { t } = useLang();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"original" | "result">("original");
  const [credits, setCredits] = useState<Credits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCredits = useCallback(() => {
    setCreditsLoading(true);
    fetch("/api/credits")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setCredits(data);
      })
      .catch(() => {})
      .finally(() => setCreditsLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) setCredits(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCreditsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleFile = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setOriginalFile(file);
    setResultUrl("");
    setError(null);
    setActiveTab("original");
    const newUrl = URL.createObjectURL(file);
    setOriginalUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return newUrl; });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length) handleFile(files);
    },
    [handleFile]
  );

  const removeBackground = async () => {
    if (!originalFile) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image_file", originalFile);
      formData.append("size", "auto");

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t.removeBgFailed);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      setActiveTab("result");

      fetchCredits();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.removeBgFailed);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = originalFile
      ? `no-bg_${originalFile.name.replace(/\.[^.]+$/, "")}.png`
      : "no-bg.png";
    a.click();
  };

  const reset = () => {
    setOriginalFile(null);
    setOriginalUrl("");
    setResultUrl("");
    setError(null);
    setActiveTab("original");
  };

  return (
    <ToolPageLayout title={t.removeBgTitle} description={t.removeBgDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!originalFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 transition-all hover:border-accent/50 hover:bg-surface-hover/50 sm:p-12"
            >
              <Upload className="h-10 w-10 text-text-secondary" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{t.removeBgDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.removeBgDropDesc}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) handleFile(files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setActiveTab("original")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "original"
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:text-foreground"
                  }`}
                >
                  {t.removeBgTabOriginal}
                </button>
                {resultUrl && (
                  <button
                    onClick={() => setActiveTab("result")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "result"
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {t.removeBgTabResult}
                  </button>
                )}
                <button
                  onClick={reset}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-border">
                {activeTab === "original" && originalUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="w-full object-contain"
                    style={{ maxHeight: "500px" }}
                  />
                )}
                {activeTab === "result" && resultUrl && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                      minHeight: "300px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resultUrl}
                      alt="Result"
                      className="max-h-[500px] w-full object-contain"
                    />
                  </div>
                )}
                {processing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-accent" />
                    <p className="text-sm text-text-secondary">{t.removeBgProcessing}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.removeBgSettings}</h3>

            {creditsLoading ? (
              <p className="mb-4 text-xs text-text-secondary">{t.removeBgCreditsLoading}</p>
            ) : credits ? (
              <div className="mb-4">
                {credits.remaining > 0 ? (
                  <p className="text-xs text-text-secondary">
                    {t.removeBgCredits(credits.remaining, credits.total)}
                  </p>
                ) : (
                  <p className="text-xs text-error">{t.removeBgCreditsEmpty}</p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}

            <p className="mb-4 text-xs text-text-secondary">{t.removeBgNoteDesc}</p>

            {resultUrl && (
              <button
                onClick={downloadResult}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
              >
                <Download className="h-4 w-4" />
                {t.removeBgDownload}
              </button>
            )}

            {!resultUrl && (
              <button
                onClick={removeBackground}
                disabled={!originalFile || processing || (credits !== null && credits.remaining <= 0)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eraser className="h-4 w-4" />
                )}
                {processing ? t.removeBgProcessing : t.removeBgRemove}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">{t.removeBgNote}</h3>
            <p className="text-xs text-text-secondary">{t.removeBgNoteDesc}</p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
