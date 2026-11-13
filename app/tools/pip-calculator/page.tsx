"use client";

import { useState } from "react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

const PIP_VALUES: Record<string, number> = {
  "EUR/USD": 0.0001,
  "GBP/USD": 0.0001,
  "AUD/USD": 0.0001,
  "NZD/USD": 0.0001,
  "USD/CHF": 0.0001,
  "USD/CAD": 0.0001,
  "USD/JPY": 0.01,
  "EUR/GBP": 0.0001,
  "EUR/JPY": 0.01,
  "GBP/JPY": 0.01,
  "AUD/JPY": 0.01,
  "EUR/AUD": 0.0001,
  "GBP/AUD": 0.0001,
  "USD/SGD": 0.0001,
  "USD/HKD": 0.0001,
  "USD/MXN": 0.0001,
  "USD/ZAR": 0.0001,
  "USD/TRY": 0.0001,
  "USD/THB": 0.0001,
  "USD/INR": 0.0001,
  "XAU/USD": 0.01,
  "XAG/USD": 0.01,
};

const PAIR_LIST = Object.keys(PIP_VALUES);

const CONTRACT_SIZES: Record<string, number> = {
  "XAU/USD": 100,
  "XAG/USD": 5000,
};

export default function PipCalculatorPage() {
  const { t } = useLang();
  const [pair, setPair] = useState("EUR/USD");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lotSize, setLotSize] = useState("1");
  const [pipValue, setPipValue] = useState("");
  const [isCustomPip, setIsCustomPip] = useState(false);

  const pipSize = isCustomPip ? (parseFloat(pipValue) || 0.0001) : (PIP_VALUES[pair] || 0.0001);
  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const lots = parseFloat(lotSize) || 0;

  const contractSize = CONTRACT_SIZES[pair] || 100000;
  const pips = pipSize > 0 ? Math.abs(exit - entry) / pipSize : 0;
  const profit = pips * pipSize * lots * contractSize;

  const format = (n: number) => {
    if (n === 0) return "0";
    if (n < 0.01) return n.toFixed(6);
    if (n < 1) return n.toFixed(4);
    if (n < 100) return n.toFixed(2);
    return n.toFixed(0);
  };

  return (
    <>
      <ToolSeo
        title={t.pipCalcTitle}
        description={t.pipCalcDesc}
        path="/tools/pip-calculator"
      />
      <ToolPageLayout title={t.pipCalcTitle} description={t.pipCalcDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pcPair}</label>
                  <select
                    value={pair}
                    onChange={(e) => { setPair(e.target.value); setIsCustomPip(false); }}
                    disabled={isCustomPip}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                  >
                    {PAIR_LIST.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pcCustomPipSize}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pipValue}
                      onChange={(e) => { setPipValue(e.target.value); setIsCustomPip(true); }}
                      placeholder={pipSize.toString()}
                      step="any"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={() => { setIsCustomPip(false); setPipValue(""); }}
                      className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:border-accent/40"
                    >
                      {t.pcDefault}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pcEntryPrice}</label>
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
                  <label className="mb-1 block text-xs text-text-secondary">{t.pcExitPrice}</label>
                  <input
                    type="number"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="1.1100"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.pcLotSize}</label>
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
                  <label className="mb-1 block text-xs text-text-secondary">{t.pcPipSize}</label>
                  <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground">
                    {pipSize}
                  </div>
                </div>
              </div>

              {entry > 0 && exit > 0 && lots > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.pcPips}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">{format(pips)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.pcProfit}</p>
                    <p className={`mt-1 font-mono text-lg font-semibold ${profit >= 0 ? "text-success" : "text-error"}`}>
                      ${format(Math.abs(profit))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.pcDirection}</p>
                    <p className={`mt-1 font-mono text-lg font-semibold ${exit > entry ? "text-success" : exit < entry ? "text-error" : "text-foreground"}`}>
                      {exit > entry ? t.pcLong : exit < entry ? t.pcShort : "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.pcAboutPip}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.pcAboutPipDesc1}</p>
                <p>{t.pcAboutPipDesc2}</p>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
