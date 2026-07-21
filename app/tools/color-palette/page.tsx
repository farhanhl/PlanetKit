"use client";

import { useState, useCallback, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

type Harmony = "analogous" | "complementary" | "triadic" | "split" | "monochromatic";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generatePalette(hex: string, harmony: Harmony): string[] {
  const [h, s, l] = hexToHsl(hex);
  switch (harmony) {
    case "analogous":
      return [hslToHex(h - 30, s, l), hslToHex(h - 15, s, l), hex, hslToHex(h + 15, s, l), hslToHex(h + 30, s, l)];
    case "complementary":
      return [hslToHex(h, s, l), hslToHex(h, s, l - 15), hslToHex(h, s, l + 15), hslToHex(h + 180, s, l - 15), hslToHex(h + 180, s, l)];
    case "triadic":
      return [hex, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l), hslToHex(h + 120, s, l - 15), hslToHex(h + 240, s, l + 15)];
    case "split":
      return [hex, hslToHex(h + 150, s, l), hslToHex(h + 210, s, l), hslToHex(h + 150, s, l + 15), hslToHex(h + 210, s, l + 15)];
    case "monochromatic":
      return [hslToHex(h, s, 90), hslToHex(h, s, 70), hex, hslToHex(h, s, 30), hslToHex(h, s, 15)];
  }
}

export default function ColorPalettePage() {
  const { t } = useLang();
  const [seed, setSeed] = useState("#667eea");
  const [harmony, setHarmony] = useState<Harmony>("analogous");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const palette = useMemo(() => generatePalette(seed, harmony), [seed, harmony]);

  const randomize = () => {
    setSeed(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`);
  };

  const copyColor = useCallback(async (color: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }, []);

  const harmonies: { key: Harmony; label: string }[] = [
    { key: "analogous", label: "Analogous" },
    { key: "complementary", label: "Complementary" },
    { key: "triadic", label: "Triadic" },
    { key: "split", label: "Split" },
    { key: "monochromatic", label: "Monochromatic" },
  ];

  return (
    <>
      <ToolSeo title={t.paletteTitle} description={t.paletteDesc} path="/tools/color-palette" />
      <ToolPageLayout title={t.paletteTitle} description={t.paletteDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {palette.map((color, i) => {
                const [h, s, l] = hexToHsl(color);
                return (
                  <button
                    key={i}
                    onClick={() => copyColor(color, i)}
                    className="group rounded-xl border border-border transition-transform hover:scale-105"
                  >
                    <div className="h-28 rounded-t-xl" style={{ background: color }} />
                    <div className="rounded-b-xl bg-surface p-2 text-center">
                      <p className="font-mono text-xs font-medium text-foreground">{color.toUpperCase()}</p>
                      <p className="text-[10px] text-text-secondary">HSL({h}, {s}%, {l}%)</p>
                      <p className="mt-1 text-[10px] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        {copiedIdx === i ? t.copied : t.paletteClick}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">{t.paletteCSS}</label>
              <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground">
                {`:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`}
              </pre>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.paletteSettings}</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.paletteSeed}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={seed} onChange={(e) => setSeed(e.target.value)} className="h-10 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent" />
                  <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none" />
                  <button onClick={randomize} className="rounded-lg border border-border p-2 text-text-secondary hover:border-accent/40 hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.paletteHarmony}</label>
                <div className="space-y-1.5">
                  {harmonies.map((h) => (
                    <button
                      key={h.key}
                      onClick={() => setHarmony(h.key)}
                      className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors ${harmony === h.key ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
