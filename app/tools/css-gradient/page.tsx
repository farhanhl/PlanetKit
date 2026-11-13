"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface GradientStop {
  color: string;
  position: number;
}

type GradientType = "linear" | "radial";

export default function CssGradientPage() {
  const { t } = useLang();
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#667eea", position: 0 },
    { color: "#764ba2", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const gradientCSS = (() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
    return type === "linear"
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : `radial-gradient(circle, ${stopsStr})`;
  })();

  const cssCode = `background: ${gradientCSS};`;

  const addStop = () => {
    if (stops.length >= 8) return;
    setStops((prev) => [...prev, { color: "#ffffff", position: 50 }]);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStop = (idx: number, field: "color" | "position", value: string | number) => {
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const copyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [cssCode]);

  return (
    <>
      <ToolSeo title={t.gradientTitle} description={t.gradientDesc} path="/tools/css-gradient" />
      <ToolPageLayout title={t.gradientTitle} description={t.gradientDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div
              className="h-48 w-full rounded-xl border border-border"
              style={{ background: gradientCSS }}
            />
            {stops.length > 1 && (() => {
              const sorted = [...stops].sort((a, b) => a.position - b.position);
              const stopsStr = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
              return (
                <div className="relative h-8 w-full rounded-lg border border-border" style={{ background: `linear-gradient(90deg, ${stopsStr})` }} />
              );
            })()}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">{t.gradientOutput}</label>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground">{cssCode}</pre>
                <button onClick={copyCSS} className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.gradientSettings}</h3>
              <div className="mb-4 flex gap-2">
                <button onClick={() => setType("linear")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${type === "linear" ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary"}`}>{t.gradientLinear}</button>
                <button onClick={() => setType("radial")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${type === "radial" ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary"}`}>{t.gradientRadial}</button>
              </div>
              {type === "linear" && (
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{t.gradientAngle}</span><span>{angle}deg</span>
                  </div>
                  <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-accent" />
                </div>
              )}
              <div className="space-y-3">
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" value={stop.color} onChange={(e) => updateStop(i, "color", e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent" />
                    <input type="text" value={stop.color} onChange={(e) => updateStop(i, "color", e.target.value)} className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none" />
                    <input type="range" min={0} max={100} value={stop.position} onChange={(e) => updateStop(i, "position", Number(e.target.value))} className="flex-1 accent-accent" />
                    <span className="w-8 text-right text-xs text-text-secondary">{stop.position}%</span>
                    {stops.length > 2 && (
                      <button onClick={() => removeStop(i)} className="shrink-0 text-text-secondary hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                ))}
              </div>
              {stops.length < 8 && (
                <button onClick={addStop} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"><Plus className="h-3 w-3" />{t.gradientAddStop}</button>
              )}
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
