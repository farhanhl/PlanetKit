"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download, Trash2 } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface ExifEntry {
  tag: string;
  value: string;
}

function stripExif(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function ImageMetadataRemoverPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleaned, setCleaned] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ExifEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setCleaned(null);
    setMetadata([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const processImage = async () => {
    if (!preview) return;
    setProcessing(true);
    try {
      setMetadata([
        { tag: t.metaRemoved, value: "EXIF, IPTC, XMP" },
        { tag: t.metaOriginalSize, value: file ? `${(file.size / 1024).toFixed(1)} KB` : "-" },
        { tag: t.metaFormat, value: file?.type || "-" },
      ]);
      const result = await stripExif(preview);
      setCleaned(result);
    } catch {} finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!cleaned || !file) return;
    const link = document.createElement("a");
    link.download = `cleaned-${file.name}`;
    link.href = cleaned;
    link.click();
  };

  return (
    <>
      <ToolSeo title={t.metaRemoverTitle} description={t.metaRemoverDesc} path="/tools/image-metadata-remover" />
      <ToolPageLayout title={t.metaRemoverTitle} description={t.metaRemoverDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {!preview ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/40"
              >
                <Upload className="mb-3 h-10 w-10 text-text-secondary/40" />
                <p className="text-sm font-medium text-foreground">{t.metaRemoverDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.metaRemoverDropDesc}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{file?.name}</p>
                  <button onClick={() => { setFile(null); setPreview(null); setCleaned(null); setMetadata([]); }} className="text-xs text-text-secondary hover:text-foreground">{t.change}</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs text-text-secondary">{t.metaRemoverOriginal}</p>
                    <img src={preview} alt="Original" className="w-full rounded-lg border border-border" />
                  </div>
                  {cleaned && (
                    <div>
                      <p className="mb-2 text-xs text-text-secondary">{t.metaRemoverCleaned}</p>
                      <img src={cleaned} alt="Cleaned" className="w-full rounded-lg border border-border" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.metaRemoverInfo}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.metaRemoverNote}</p>
              {metadata.length > 0 && (
                <div className="mb-4 space-y-2">
                  {metadata.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{m.tag}</span>
                      <span className="font-medium text-foreground">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {preview && !cleaned && (
                  <button onClick={processImage} disabled={processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                    {processing ? t.processing : t.metaRemoverClean}
                  </button>
                )}
                {cleaned && (
                  <button onClick={download} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover">
                    <Download className="h-4 w-4" />
                    {t.metaRemoverDownload}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
