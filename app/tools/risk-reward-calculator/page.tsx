"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

export default function RiskRewardCalculatorPage() {
  const { t } = useLang();
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [copied, setCopied] = useState(false);

  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;

  const riskDistance = Math.abs(entry - sl);
  const rewardDistance = Math.abs(tp - entry);
  const rrRatio = riskDistance > 0 ? rewardDistance / riskDistance : 0;
  const rrPercent = rrRatio > 0 ? (1 / (1 + rrRatio)) * 100 : 0;

  const format = (n: number) => {
    if (n === 0) return "0";
    if (n < 0.01) return n.toFixed(6);
    if (n < 1) return n.toFixed(4);
    return n.toFixed(2);
  };

  const copyResult = async () => {
    const text = `Entry: ${entry}\nStop Loss: ${sl}\nTake Profit: ${tp}\nRisk Distance: ${format(riskDistance)}\nReward Distance: ${format(rewardDistance)}\nR:R Ratio: 1:${format(rrRatio)}\nWin Rate Needed: ${format(rrPercent)}%`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo
        title={t.rrCalcTitle}
        description={t.rrCalcDesc}
        path="/tools/risk-reward-calculator"
      />
      <ToolPageLayout title={t.rrCalcTitle} description={t.rrCalcDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.rrEntryPrice}</label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="1.1050"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.rrStopLoss}</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="1.1000"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.rrTakeProfit}</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="1.1150"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {entry > 0 && sl > 0 && tp > 0 && (
                <div className="mt-6">
                  <div className="mb-4 rounded-lg border border-border bg-background p-4 text-center">
                    <p className="text-xs text-text-secondary">{t.rrRatio}</p>
                    <p className="mt-1 font-mono text-3xl font-bold text-accent">
                      1:{format(rrRatio)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-text-secondary">
                      <span>{t.rrRisk}</span>
                      <span>{t.rrReward}</span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-error to-success transition-all"
                        style={{ width: `${Math.min(rrPercent, 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-text-secondary">
                      <span>{t.rrRiskDist} {format(riskDistance)}</span>
                      <span>{t.rrRewardDist} {format(rewardDistance)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-background p-3 text-center">
                      <p className="text-xs text-text-secondary">{t.rrWinRateNeeded}</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{format(rrPercent)}%</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3 text-center">
                      <p className="text-xs text-text-secondary">{t.rrExpectancy}</p>
                      <p className={`mt-1 font-mono text-lg font-semibold ${rrRatio >= 1 ? "text-success" : "text-error"}`}>
                        {rrRatio >= 1 ? "+" : ""}{format(((100 - rrPercent) / 100) * rewardDistance - (rrPercent / 100) * riskDistance)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={copyResult}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? t.copied : t.rrCopyResult}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.rrGuideTitle}</h3>
              <div className="space-y-3 text-xs text-text-secondary">
                <div>
                  <p className="font-medium text-foreground">1:1 — {t.rrGuide1to1}</p>
                  <p>{t.rrGuide1to1Desc}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">1:2 — {t.rrGuide1to2}</p>
                  <p>{t.rrGuide1to2Desc}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">1:3 — {t.rrGuide1to3}</p>
                  <p>{t.rrGuide1to3Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
