"use client";

import { useState } from "react";
import { Palette, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

type Mode = "hex-rgb" | "rgb-hsl" | "hsl-rgb";
export default function ColorConverterPage() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>("hex-rgb");
  const [input, setInput] = useState("#D4A853");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const convert = () => {
    setError(null);
    try {
      if (mode === "hex-rgb") {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(input);
        if (!m) throw new Error("Invalid hex");
        setResult(`rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})`);
      } else if (mode === "rgb-hsl") {
        const nums = input.replace(/[rgb()\s]/g, "").split(",").map(Number);
        if (nums.length !== 3 || nums.some(isNaN)) throw new Error("Invalid RGB");
        const [r, g, b] = nums.map((v) => v / 255);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        setResult(`hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`);
      } else {
        const m = input.match(/(\d+)\D+(\d+)\D+(\d+)/);
        if (!m) throw new Error("Invalid HSL");
        const h = Number(m[1]) / 360, s = Number(m[2]) / 100, l = Number(m[3]) / 100;
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        setResult(`rgb(${Math.round(hue2rgb(p, q, h + 1/3) * 255)}, ${Math.round(hue2rgb(p, q, h) * 255)}, ${Math.round(hue2rgb(p, q, h - 1/3) * 255)})`);
      }
    } catch {
      setError(t.colorConvertFailed);
    }
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.colorConvTitle} description={t.colorConvDesc} path="/tools/color-converter" />
      <ToolPageLayout title={t.colorConvTitle} description={t.colorConvDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "hex-rgb" ? "#D4A853" : mode === "rgb-hsl" ? "rgb(212, 168, 83)" : "hsl(38, 65%, 58%)"} className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {result && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.result}</p>
                  <button onClick={copyResult} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground">{result}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <div className="mb-4 space-y-2">
                {([["hex-rgb", "HEX → RGB"], ["rgb-hsl", "RGB → HSL"], ["hsl-rgb", "HSL → RGB"]] as const).map(([m, label]) => (
                  <button key={m} onClick={() => { setMode(m); setResult(""); setError(null); }} className={`flex w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={convert} disabled={!input.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Palette className="h-4 w-4" />
                {t.convert}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
