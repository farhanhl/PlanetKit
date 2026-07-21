"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function CssShadowPage() {
  const { t } = useLang();
  const [h, setH] = useState(4);
  const [v, setV] = useState(4);
  const [blur, setBlur] = useState(8);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(25);
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [v2, setV2] = useState(8);
  const [blur2, setBlur2] = useState(24);
  const [spread2, setSpread2] = useState(0);
  const [color2, setColor2] = useState("#000000");
  const [opacity2, setOpacity2] = useState(15);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  };

  const shadow1 = `${inset ? "inset " : ""}${h}px ${v}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const shadow2 = `0px ${v2}px ${blur2}px ${spread2}px ${hexToRgba(color2, opacity2)}`;
  const cssCode = multiple
    ? `box-shadow: ${shadow1},\n       ${shadow2};`
    : `box-shadow: ${shadow1};`;

  const copyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [cssCode]);

  return (
    <>
      <ToolSeo title={t.shadowTitle} description={t.shadowDesc} path="/tools/css-shadow" />
      <ToolPageLayout title={t.shadowTitle} description={t.shadowDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-12">
              <div
                className="h-40 w-64 rounded-xl bg-background"
                style={{ boxShadow: multiple ? `${shadow1}, ${shadow2}` : shadow1 }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">{t.shadowOutput}</label>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground whitespace-pre-wrap">{cssCode}</pre>
                <button onClick={copyCSS} className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.shadowSettings}</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm text-foreground">
                  <span>{t.shadowInset}</span>
                  <button onClick={() => setInset(!inset)} className={`relative h-5 w-9 rounded-full transition-colors ${inset ? "bg-accent" : "bg-border"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${inset ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </label>
                {[
                  { label: t.shadowHorizontal, value: h, set: setH, min: -50, max: 50 },
                  { label: t.shadowVertical, value: v, set: setV, min: -50, max: 50 },
                  { label: t.shadowBlur, value: blur, set: setBlur, min: 0, max: 100 },
                  { label: t.shadowSpread, value: spread, set: setSpread, min: -50, max: 50 },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-xs text-text-secondary">
                      <span>{s.label}</span><span>{s.value}px</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} value={s.value} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-accent" />
                  </div>
                ))}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{t.shadowColor}</span><span>{hexToRgba(color, opacity)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent" />
                    <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1 accent-accent" />
                    <span className="w-8 text-right text-xs text-text-secondary">{opacity}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <label className="flex items-center justify-between text-sm text-foreground">
                <span>{t.shadowMultiple}</span>
                <button onClick={() => setMultiple(!multiple)} className={`relative h-5 w-9 rounded-full transition-colors ${multiple ? "bg-accent" : "bg-border"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${multiple ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </label>
              {multiple && (
                <div className="mt-3 space-y-3">
                  {[
                    { label: t.shadowVertical, value: v2, set: setV2, min: -50, max: 50 },
                    { label: t.shadowBlur, value: blur2, set: setBlur2, min: 0, max: 100 },
                    { label: t.shadowSpread, value: spread2, set: setSpread2, min: -50, max: 50 },
                  ].map((s) => (
                    <div key={s.label + "2"}>
                      <div className="mb-1 flex justify-between text-xs text-text-secondary">
                        <span>{s.label}</span><span>{s.value}px</span>
                      </div>
                      <input type="range" min={s.min} max={s.max} value={s.value} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-accent" />
                    </div>
                  ))}
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-text-secondary">
                      <span>{t.shadowColor}</span><span>{hexToRgba(color2, opacity2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent" />
                      <input type="range" min={0} max={100} value={opacity2} onChange={(e) => setOpacity2(Number(e.target.value))} className="flex-1 accent-accent" />
                      <span className="w-8 text-right text-xs text-text-secondary">{opacity2}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
