"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download } from "lucide-react";
import JSZip from "jszip";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const SIZES = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 64, name: "favicon-64x64.png" },
  { size: 128, name: "favicon-128x128.png" },
  { size: 150, name: "mstile-150x150.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 256, name: "favicon-256x256.png" },
  { size: 512, name: "android-chrome-512x512.png" },
];

function generateIcon(img: HTMLImageElement, size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

function generateICO(img: HTMLImageElement): Promise<Blob> {
  const sizes = [16, 32, 48];
  return new Promise(async (resolve) => {
    const images: Blob[] = [];
    for (const size of sizes) {
      images.push(await generateIcon(img, size));
    }
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, 48, 48);
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

const manifest = (name: string) => JSON.stringify({
  name,
  short_name: name,
  icons: [
    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
  ],
  theme_color: "#ffffff",
  background_color: "#ffffff",
  display: "standalone",
}, null, 2);

export default function FaviconGeneratorPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [appName, setAppName] = useState("My App");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const generate = async () => {
    if (!preview) return;
    setGenerating(true);
    try {
      const img = new Image();
      img.src = preview;
      await new Promise((r) => { img.onload = r; });

      const zip = new JSZip();
      for (const { size, name } of SIZES) {
        const blob = await generateIcon(img, size);
        zip.file(name, blob);
      }
      zip.file("favicon.ico", await generateICO(img));
      zip.file("site.webmanifest", manifest(appName));

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = "favicons.zip";
      link.href = URL.createObjectURL(content);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {} finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.faviconTitle} description={t.faviconDesc} path="/tools/favicon-generator" />
      <ToolPageLayout title={t.faviconTitle} description={t.faviconDesc}>
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
                <p className="text-sm font-medium text-foreground">{t.faviconDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.faviconDropDesc}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{file?.name}</p>
                  <button onClick={() => { setFile(null); setPreview(null); }} className="text-xs text-text-secondary hover:text-foreground">{t.change}</button>
                </div>
                <div className="flex items-end gap-3">
                  {[16, 32, 48, 64, 128].map((size) => (
                    <div key={size} className="text-center">
                      <img src={preview} alt={`${size}px`} style={{ width: size, height: size }} className="rounded border border-border" />
                      <p className="mt-1 text-[10px] text-text-secondary">{size}px</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.faviconSettings}</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.faviconAppName}</label>
                <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
              </div>
              <p className="mb-4 text-xs text-text-secondary">{t.faviconNote}</p>
              <button onClick={generate} disabled={!preview || generating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="h-4 w-4" />
                {generating ? t.processing : t.faviconGenerate}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
