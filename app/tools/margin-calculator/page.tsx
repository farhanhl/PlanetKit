"use client";

import { useState } from "react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

const LEVERAGE_OPTIONS = [10, 20, 50, 100, 200, 300, 400, 500];

const PAIR_DATA: Record<string, { pipValue: number; pipSize: number }> = {
  "EUR/USD": { pipValue: 10, pipSize: 0.0001 },
  "GBP/USD": { pipValue: 10, pipSize: 0.0001 },
  "AUD/USD": { pipValue: 10, pipSize: 0.0001 },
  "NZD/USD": { pipValue: 10, pipSize: 0.0001 },
  "USD/CHF": { pipValue: 10, pipSize: 0.0001 },
  "USD/CAD": { pipValue: 7.5, pipSize: 0.0001 },
  "USD/JPY": { pipValue: 6.67, pipSize: 0.01 },
  "EUR/GBP": { pipValue: 12.5, pipSize: 0.0001 },
  "EUR/JPY": { pipValue: 6.67, pipSize: 0.01 },
  "GBP/JPY": { pipValue: 6.67, pipSize: 0.01 },
};

const PAIR_LIST = Object.keys(PAIR_DATA);

export default function MarginCalculatorPage() {
  const { t } = useLang();
  const [pair, setPair] = useState("EUR/USD");
  const [lotSize, setLotSize] = useState("1");
  const [leverage, setLeverage] = useState("100");
  const [accountCurrency, setAccountCurrency] = useState("USD");

  const lots = Math.max(0, parseFloat(lotSize) || 0);
  const parsedLev = parseInt(leverage);
  const lev = parsedLev > 0 ? parsedLev : 100;
  const contractSize = lots * 100000;
  const marginRequired = contractSize / lev;

  const format = (n: number) => {
    if (n === 0) return "0";
    if (n < 0.01) return n.toFixed(4);
    return n.toFixed(2);
  };

  return (
    <>
      <ToolSeo
        title={t.marginCalcTitle}
        description={t.marginCalcDesc}
        path="/tools/margin-calculator"
      />
      <ToolPageLayout title={t.marginCalcTitle} description={t.marginCalcDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.mcPair}</label>
                  <select
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                  >
                    {PAIR_LIST.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.mcLotSize}</label>
                  <input
                    type="number"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    placeholder="1"
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.mcLeverage}</label>
                  <div className="flex flex-wrap gap-2">
                    {LEVERAGE_OPTIONS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLeverage(String(l))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          lev === l
                            ? "border-accent/30 bg-accent/10 text-accent"
                            : "border-border text-text-secondary hover:border-accent/40"
                        }`}
                      >
                        1:{l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.mcAccountCurrency}</label>
                  <select
                    value={accountCurrency}
                    onChange={(e) => setAccountCurrency(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                  >
                    {["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {lots > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.mcContractSize}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {format(contractSize)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.mcMarginRequired}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-accent">
                      {accountCurrency} {format(marginRequired)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.mcFreeMargin}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {t.mcBasedOnBalance}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.mcAboutMargin}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.mcAboutMarginDesc1}</p>
                <p>{t.mcAboutMarginDesc2}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.mcFormulaTitle}</h3>
              <p className="font-mono text-xs text-text-secondary">{t.mcFormula}</p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
