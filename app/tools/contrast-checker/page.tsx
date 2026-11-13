"use client";

import { useState } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.trim().replace(/^#/, "");
  if (cleaned.length === 3) {
    cleaned = cleaned.split("").map((c) => c + c).join("");
  }
  if (cleaned.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return [0, 0, 0];
  }
  return [parseInt(cleaned.slice(0, 2), 16), parseInt(cleaned.slice(2, 4), 16), parseInt(cleaned.slice(4, 6), 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRating(ratio: number): { level: string; color: string } {
  if (ratio >= 7) return { level: "AAA", color: "text-success" };
  if (ratio >= 4.5) return { level: "AA", color: "text-success" };
  if (ratio >= 3) return { level: "AA Large", color: "text-yellow-500" };
  return { level: "Fail", color: "text-error" };
}

export default function ContrastCheckerPage() {
  const { t } = useLang();
  const [fg, setFg] = useState("#FFFFFF");
  const [bg, setBg] = useState("#667EEA");

  const ratio = contrastRatio(fg, bg);
  const rating = getRating(ratio);

  const swap = () => { setFg(bg); setBg(fg); };

  return (
    <>
      <ToolSeo title={t.contrastTitle} description={t.contrastDesc} path="/tools/contrast-checker" />
      <ToolPageLayout title={t.contrastTitle} description={t.contrastDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-8 text-center" style={{ background: bg }}>
                <p style={{ color: fg, fontSize: 24, fontWeight: 700 }}>{t.contrastHeading}</p>
                <p style={{ color: fg, fontSize: 14, marginTop: 8 }}>{t.contrastBody}</p>
                <p style={{ color: fg, fontSize: 12, marginTop: 4 }}>{t.contrastSmall}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-2 text-xs font-medium text-text-secondary">{t.contrastForeground}</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent" />
                  <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-2 text-xs font-medium text-text-secondary">{t.contrastBackground}</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent" />
                  <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={swap} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">{t.contrastSwap}</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5 text-center">
              <p className="mb-1 text-xs text-text-secondary">{t.contrastRatio}</p>
              <p className="text-4xl font-bold text-foreground">{ratio.toFixed(2)}</p>
              <p className="mt-2 text-lg font-semibold">{ratio.toFixed(2)} : 1</p>
              <div className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${rating.color}`}>{rating.level}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.contrastResults}</h3>
              <div className="space-y-2">
                {[
                  { label: "Normal Text (AA)", min: 4.5 },
                  { label: "Normal Text (AAA)", min: 7 },
                  { label: "Large Text (AA)", min: 3 },
                  { label: "Large Text (AAA)", min: 4.5 },
                  { label: "UI Components", min: 3 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className={ratio >= item.min ? "font-medium text-success" : "font-medium text-error"}>
                      {ratio >= item.min ? "✓" : "✗"} {ratio >= item.min ? t.contrastPass : t.contrastFail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
