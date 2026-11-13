"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

export default function ProfitCalculatorPage() {
  const { t } = useLang();
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [pipSize, setPipSize] = useState("0.0001");
  const [contractSize, setContractSize] = useState("100000");
  const [accountCurrency, setAccountCurrency] = useState("USD");
  const [copied, setCopied] = useState(false);

  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const lots = parseFloat(lotSize) || 0;
  const pip = parseFloat(pipSize) || 0.0001;
  const contract = parseFloat(contractSize) || 100000;

  const pips = pip > 0 ? Math.abs(exit - entry) / pip : 0;
  const directionMultiplier = exit > entry ? 1 : exit < entry ? -1 : 0;
  const profitUSD = pips * pip * contract * lots * directionMultiplier;

  const format = (n: number) => {
    if (n === 0) return "0";
    if (n < 0.01) return n.toFixed(6);
    if (n < 1) return n.toFixed(4);
    if (n < 100) return n.toFixed(2);
    return n.toFixed(0);
  };

  const copyResult = async () => {
    const text = `Entry: ${entry}\nExit: ${exit}\nLots: ${lots}\nPips: ${format(pips)}\nProfit/Loss: ${accountCurrency} ${format(profitUSD)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo
        title={t.profitCalcTitle}
        description={t.profitCalcDesc}
        path="/tools/profit-calculator"
      />
      <ToolPageLayout title={t.profitCalcTitle} description={t.profitCalcDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.prEntryPrice}</label>
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
                  <label className="mb-1 block text-xs text-text-secondary">{t.prExitPrice}</label>
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
                  <label className="mb-1 block text-xs text-text-secondary">{t.prLotSize}</label>
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
                  <label className="mb-1 block text-xs text-text-secondary">{t.prPipSize}</label>
                  <input
                    type="number"
                    value={pipSize}
                    onChange={(e) => setPipSize(e.target.value)}
                    placeholder="0.0001"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.prContractSize}</label>
                  <input
                    type="number"
                    value={contractSize}
                    onChange={(e) => setContractSize(e.target.value)}
                    placeholder="100000"
                    step="any"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.prAccountCurrency}</label>
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

              {entry > 0 && exit > 0 && lots > 0 && (
                <div className="mt-6">
                  <div className={`mb-4 rounded-lg border p-4 text-center ${
                    profitUSD >= 0
                      ? "border-success/30 bg-success/5"
                      : "border-error/30 bg-error/5"
                  }`}>
                    <p className="text-xs text-text-secondary">{t.prProfitLoss}</p>
                    <p className={`mt-1 font-mono text-3xl font-bold ${
                      profitUSD >= 0 ? "text-success" : "text-error"
                    }`}>
                      {profitUSD >= 0 ? "+" : ""}{accountCurrency} {format(Math.abs(profitUSD))}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {t.prPipsLabel}: {format(pips)} {t.prPips}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-background p-3 text-center">
                      <p className="text-xs text-text-secondary">{t.prDirection}</p>
                      <p className={`mt-1 font-mono text-lg font-semibold ${
                        exit > entry ? "text-success" : exit < entry ? "text-error" : "text-foreground"
                      }`}>
                        {exit > entry ? t.prLong : exit < entry ? t.prShort : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3 text-center">
                      <p className="text-xs text-text-secondary">{t.prPipsLabel}</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{format(pips)}</p>
                    </div>
                  </div>

                  <button
                    onClick={copyResult}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? t.copied : t.prCopyResult}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.prAboutTitle}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.prAboutDesc1}</p>
                <p>{t.prAboutDesc2}</p>
                <p>{t.prAboutDesc3}</p>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
