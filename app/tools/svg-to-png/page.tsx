"use client";

import { useState, useCallback } from "react";
import { Image } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function SvgToPngPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(2);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0] || null;
    setFile(f);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (f) setPreview(URL.createObjectURL(f));
  }, [preview]);

  const convert = async () => {
    if (!file || !preview) return;
    setProcessing(true);
    setError(null);
    try {
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = preview;
      });
      let baseWidth = img.naturalWidth;
      let baseHeight = img.naturalHeight;

      if (!baseWidth || !baseHeight) {
        try {
          const svgText = await file.text();
          const viewBoxMatch = svgText.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
          if (viewBoxMatch) {
            baseWidth = parseFloat(viewBoxMatch[1]);
            baseHeight = parseFloat(viewBoxMatch[2]);
          }
        } catch {}
      }

      baseWidth = baseWidth || 800;
      baseHeight = baseHeight || 600;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(baseWidth * scale);
      canvas.height = Math.round(baseHeight * scale);
      const ctx = canvas.getContext("2d")!;
      // Pertahankan transparansi asli SVG (tanpa dipaksa putih)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.svg$/i, ".png");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.svgToPngFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.svgToPngTitle} description={t.svgToPngDesc} path="/tools/svg-to-png" />
      <ToolPageLayout title={t.svgToPngTitle} description={t.svgToPngDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".svg" label={t.svgToPngDrop} description={t.svgToPngDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => { setFile(null); setPreview(null); }} />
            {preview && (
              <div className="mt-4 rounded-xl border border-border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="SVG Preview" className="max-h-64 mx-auto" />
              </div>
            )}
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.scale}: {scale}x</label>
                <input type="range" min={1} max={4} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-accent" />
              </div>
              <button onClick={convert} disabled={!file || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-4 w-4" />
                {processing ? t.converting : t.svgToPngBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Failed")), "image/png");
  });
}
