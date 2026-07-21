"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Copy, Check, Download } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const ASCII_CHARS = " .,:;+*?%S#@";
const REVERSE = ASCII_CHARS.split("").reverse().join("");

function imageToAscii(img: HTMLImageElement, width: number): string {
  const ratio = img.height / img.width;
  const height = Math.floor(width * ratio * 0.55);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  let ascii = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      ascii += REVERSE[Math.floor(brightness * (REVERSE.length - 1))];
    }
    ascii += "\n";
  }
  return ascii;
}

export default function AsciiArtPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState("");
  const [width, setWidth] = useState(100);
  const [invert, setInvert] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setAsciiArt("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const process = () => {
    if (!preview) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      let art = imageToAscii(img, width);
      if (invert) {
        const chars = REVERSE;
        art = art.split("").map((c) => {
          const idx = chars.indexOf(c);
          return idx >= 0 ? ASCII_CHARS[ASCII_CHARS.length - 1 - idx] : c;
        }).join("");
      }
      setAsciiArt(art);
      setProcessing(false);
    };
    img.src = preview;
  };

  const copyAscii = async () => {
    try {
      await navigator.clipboard.writeText(asciiArt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const downloadAscii = () => {
    const blob = new Blob([asciiArt], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = "ascii-art.txt";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <ToolSeo title={t.asciiTitle} description={t.asciiDesc} path="/tools/ascii-art" />
      <ToolPageLayout title={t.asciiTitle} description={t.asciiDesc}>
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
                <p className="text-sm font-medium text-foreground">{t.asciiDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.asciiDropDesc}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{file?.name}</p>
                  <button onClick={() => { setFile(null); setPreview(null); setAsciiArt(""); }} className="text-xs text-text-secondary hover:text-foreground">{t.change}</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs text-text-secondary">{t.asciiOriginal}</p>
                    <img src={preview} alt="Original" className="w-full rounded-lg border border-border" />
                  </div>
                  {asciiArt && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs text-text-secondary">{t.asciiResult}</p>
                        <div className="flex gap-1">
                          <button onClick={copyAscii} className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-text-secondary hover:border-accent/40">
                            {copied ? <Check className="h-2.5 w-2.5 text-success" /> : <Copy className="h-2.5 w-2.5" />}
                            {copied ? t.copied : t.copy}
                          </button>
                          <button onClick={downloadAscii} className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-text-secondary hover:border-accent/40">
                            <Download className="h-2.5 w-2.5" />{t.download}
                          </button>
                        </div>
                      </div>
                      <pre className="max-h-[400px] overflow-auto rounded-lg border border-border bg-background p-2 font-mono text-[6px] leading-tight text-foreground">{asciiArt}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.asciiSettings}</h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{t.asciiWidth}</span><span>{width}</span>
                  </div>
                  <input type="range" min={20} max={200} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full accent-accent" />
                </div>
                <label className="flex items-center justify-between text-sm text-foreground">
                  <span>{t.asciiInvert}</span>
                  <button onClick={() => setInvert(!invert)} className={`relative h-5 w-9 rounded-full transition-colors ${invert ? "bg-accent" : "bg-border"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${invert ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </label>
                <button onClick={process} disabled={!preview || processing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                  {processing ? t.processing : t.asciiConvert}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
