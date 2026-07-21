"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
const EXTENSION_LEVELS = [1.272, 1.618, 2.0, 2.618];

export default function FibonacciCalculatorPage() {
  const { t } = useLang();
  const [swingHigh, setSwingHigh] = useState("");
  const [swingLow, setSwingLow] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [copied, setCopied] = useState(false);

  const high = parseFloat(swingHigh) || 0;
  const low = parseFloat(swingLow) || 0;
  const diff = Math.abs(high - low);

  const getFibLevel = (level: number) => {
    if (direction === "up") {
      return low + diff * level;
    }
    return high - diff * level;
  };

  const format = (n: number) => {
    if (n === 0) return "0";
    if (n < 0.01) return n.toFixed(6);
    if (n < 1) return n.toFixed(4);
    return n.toFixed(2);
  };

  const copyResult = async () => {
    const lines = [...FIB_LEVELS, ...EXTENSION_LEVELS].map((l) => {
      const val = getFibLevel(l);
      return `${(l * 100).toFixed(1)}%: ${format(val)}`;
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo
        title={t.fibCalcTitle}
        description={t.fibCalcDesc}
        path="/tools/fibonacci-calculator"
      />
      <ToolPageLayout title={t.fibCalcTitle} description={t.fibCalcDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex gap-2">
                {(["up", "down"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      direction === d
                        ? "border border-accent/30 bg-accent/10 text-accent"
                        : "border border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {d === "up" ? t.fibUptrend : t.fibDowntrend}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.fibSwingHigh}</label>
                  <input
                    type="number"
                    value={swingHigh}
                    onChange={(e) => setSwingHigh(e.target.value)}
                    placeholder="1.1200"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.fibSwingLow}</label>
                  <input
                    type="number"
                    value={swingLow}
                    onChange={(e) => setSwingLow(e.target.value)}
                    placeholder="1.1000"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {high > 0 && low > 0 && high !== low && (
                <div className="mt-6">
                  <p className="mb-3 text-xs text-text-secondary">{t.fibRetracementLevels}</p>
                  <div className="space-y-1">
                    {FIB_LEVELS.map((level) => {
                      const price = getFibLevel(level);
                      return (
                        <div key={level} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                          <span className="text-xs text-text-secondary">{(level * 100).toFixed(1)}%</span>
                          <span className="font-mono text-sm font-medium text-foreground">{format(price)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mb-3 mt-4 text-xs text-text-secondary">{t.fibExtensions}</p>
                  <div className="space-y-1">
                    {EXTENSION_LEVELS.map((level) => {
                      const price = getFibLevel(level);
                      return (
                        <div key={level} className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                          <span className="text-xs text-accent">{(level * 100).toFixed(1)}%</span>
                          <span className="font-mono text-sm font-medium text-accent">{format(price)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={copyResult}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? t.copied : t.fibCopyLevels}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.fibAboutTitle}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.fibAboutDesc1}</p>
                <p>{t.fibAboutDesc2}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.fibKeyLevels}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p><span className="font-medium text-foreground">38.2%</span> — {t.fibLevel38}</p>
                <p><span className="font-medium text-foreground">50.0%</span> — {t.fibLevel50}</p>
                <p><span className="font-medium text-foreground">61.8%</span> — {t.fibLevel61}</p>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
