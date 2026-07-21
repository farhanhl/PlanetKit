"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

type PivotMethod = "classic" | "woodie" | "camarilla" | "demark";

export default function PivotPointCalculatorPage() {
  const { t } = useLang();
  const [method, setMethod] = useState<PivotMethod>("classic");
  const [high, setHigh] = useState("");
  const [low, setLow] = useState("");
  const [close, setClose] = useState("");
  const [open, setOpen] = useState("");
  const [copied, setCopied] = useState(false);

  const h = parseFloat(high) || 0;
  const l = parseFloat(low) || 0;
  const c = parseFloat(close) || 0;
  const o = parseFloat(open) || 0;

  const calcPivots = () => {
    if (h === 0 || l === 0 || c === 0) return null;

    if (method === "classic") {
      const pp = (h + l + c) / 3;
      return {
        "PP": pp,
        "R1": 2 * pp - l,
        "R2": pp + (h - l),
        "R3": h + 2 * (pp - l),
        "S1": 2 * pp - h,
        "S2": pp - (h - l),
        "S3": l - 2 * (h - pp),
      };
    }

    if (method === "woodie") {
      const pp = (h + l + 2 * c) / 4;
      return {
        "PP": pp,
        "R1": 2 * pp - l,
        "R2": pp + (h - l),
        "S1": 2 * pp - h,
        "S2": pp - (h - l),
      };
    }

    if (method === "camarilla") {
      const range = h - l;
      return {
        "R4": c + range * (1.1 / 2),
        "R3": c + range * (1.1 / 4),
        "R2": c + range * (1.1 / 6),
        "R1": c + range * (1.1 / 12),
        "S1": c - range * (1.1 / 12),
        "S2": c - range * (1.1 / 6),
        "S3": c - range * (1.1 / 4),
        "S4": c - range * (1.1 / 2),
      };
    }

    if (method === "demark") {
      let x: number;
      if (c < o) x = h + 2 * l + c;
      else if (c > o) x = 2 * h + l + c;
      else x = h + l + 2 * c;
      const pp = x / 4;
      return {
        "PP": pp,
        "R1": x / 2 - l,
        "S1": x / 2 - h,
      };
    }

    return null;
  };

  const pivots = calcPivots();

  const format = (n: number) => {
    if (n === 0) return "0";
    if (n < 0.01) return n.toFixed(6);
    if (n < 1) return n.toFixed(4);
    return n.toFixed(2);
  };

  const copyResult = async () => {
    if (!pivots) return;
    const lines = Object.entries(pivots).map(([k, v]) => `${k}: ${format(v)}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo
        title={t.pivotCalcTitle}
        description={t.pivotCalcDesc}
        path="/tools/pivot-point-calculator"
      />
      <ToolPageLayout title={t.pivotCalcTitle} description={t.pivotCalcDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                {(["classic", "woodie", "camarilla", "demark"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      method === m
                        ? "border border-accent/30 bg-accent/10 text-accent"
                        : "border border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pivotHigh}</label>
                  <input
                    type="number"
                    value={high}
                    onChange={(e) => setHigh(e.target.value)}
                    placeholder="1.1200"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pivotLow}</label>
                  <input
                    type="number"
                    value={low}
                    onChange={(e) => setLow(e.target.value)}
                    placeholder="1.1000"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pivotClose}</label>
                  <input
                    type="number"
                    value={close}
                    onChange={(e) => setClose(e.target.value)}
                    placeholder="1.1150"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                {method === "woodie" || method === "demark" ? (
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">{t.pivotOpen}</label>
                    <input
                      type="number"
                      value={open}
                      onChange={(e) => setOpen(e.target.value)}
                      placeholder="1.1100"
                      step="any"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs text-text-secondary">{t.pivotRange}</label>
                    <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground">
                      {h > 0 && l > 0 ? format(h - l) : "-"}
                    </div>
                  </div>
                )}
              </div>

              {pivots && (
                <div className="mt-6">
                  <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
                    <p className="text-xs text-text-secondary">{t.pivotPoint}</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-accent">{format(pivots["PP"] || 0)}</p>
                  </div>

                  <div className="grid gap-2">
                    {Object.entries(pivots).filter(([k]) => k !== "PP").map(([key, value]) => {
                      const isResistance = key.startsWith("R");
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                            isResistance
                              ? "border-success/20 bg-success/5"
                              : "border-error/20 bg-error/5"
                          }`}
                        >
                          <span className={`text-xs font-medium ${isResistance ? "text-success" : "text-error"}`}>
                            {key}
                          </span>
                          <span className={`font-mono text-sm font-medium ${isResistance ? "text-success" : "text-error"}`}>
                            {format(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={copyResult}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? t.copied : t.pivotCopyLevels}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.pivotAboutTitle}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.pivotAboutDesc1}</p>
                <p>{t.pivotAboutDesc2}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.pivotMethodsTitle}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p><span className="font-medium text-foreground">Classic:</span> {t.pivotMethodClassic}</p>
                <p><span className="font-medium text-foreground">Woodie:</span> {t.pivotMethodWoodie}</p>
                <p><span className="font-medium text-foreground">Camarilla:</span> {t.pivotMethodCamarilla}</p>
                <p><span className="font-medium text-foreground">DeMark:</span> {t.pivotMethodDemark}</p>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
