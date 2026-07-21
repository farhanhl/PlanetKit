"use client";

import { useState, useCallback, useRef } from "react";
import { Download, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const presets = [
  { name: "Default", bg1: "#1a1a2e", bg2: "#16213e", accent: "#e94560" },
  { name: "Sunset", bg1: "#ff6b6b", bg2: "#ee5a24", accent: "#feca57" },
  { name: "Ocean", bg1: "#0c2461", bg2: "#0a3d62", accent: "#48dbfb" },
  { name: "Forest", bg1: "#1e3c2b", bg2: "#2d6a4f", accent: "#95d5b2" },
  { name: "Purple", bg1: "#2d1b69", bg2: "#5b2c6f", accent: "#a569bd" },
  { name: "Minimal", bg1: "#ffffff", bg2: "#f8f9fa", accent: "#212529" },
];

export default function OgImagePage() {
  const { t } = useLang();
  const [title, setTitle] = useState("Hello World");
  const [subtitle, setSubtitle] = useState("planetkit.vercel.app");
  const [presetIdx, setPresetIdx] = useState(0);
  const [fontSize, setFontSize] = useState(48);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const preset = presets[presetIdx];

  const handleExport = useCallback(async (fmt: "png" | "copy") => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: null });
      if (fmt === "copy") {
        canvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        });
      } else {
        const link = document.createElement("a");
        link.download = "og-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch {} finally {
      setExporting(false);
    }
  }, []);

  return (
    <>
      <ToolSeo title={t.ogTitle} description={t.ogDesc} path="/tools/og-image" />
      <ToolPageLayout title={t.ogTitle} description={t.ogDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div
              ref={previewRef}
              className="flex aspect-[1200/630] w-full flex-col items-center justify-center rounded-xl p-8"
              style={{ background: `linear-gradient(135deg, ${preset.bg1}, ${preset.bg2})` }}
            >
              <p style={{ color: preset.accent, fontSize, fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>{title}</p>
              {subtitle && <p style={{ color: preset.accent, opacity: 0.7, fontSize: fontSize / 3, marginTop: 12, textAlign: "center" }}>{subtitle}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport("png")} disabled={exporting} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="h-4 w-4" />{exporting ? t.processing : t.ogExport}
              </button>
              <button onClick={() => handleExport("copy")} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? t.copied : t.ogCopy}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.ogSettings}</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.ogTitle2}</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.ogSubtitle}</label>
                  <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{t.ogFontSize}</span><span>{fontSize}px</span>
                  </div>
                  <input type="range" min={24} max={80} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <label className="mb-2 block text-xs font-medium text-text-secondary">{t.ogPreset}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map((p, i) => (
                  <button key={p.name} onClick={() => setPresetIdx(i)} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${presetIdx === i ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-accent/40"}`}>
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${p.bg1}, ${p.bg2})` }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
