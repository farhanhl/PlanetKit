"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}

function InputField({ label, value, onChange, placeholder, suffix }: InputFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-secondary">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min="0"
          step="any"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  label: string;
  value: string;
  unit?: string;
}

function ResultCard({ label, value, unit }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">{label}</p>
        <button
          onClick={copy}
          className="rounded p-1 text-text-secondary transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">
        {value}
        {unit && <span className="ml-1 text-xs text-text-secondary">{unit}</span>}
      </p>
    </div>
  );
}

export default function PositionSizeCalculatorPage() {
  const { t } = useLang();
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [pairType, setPairType] = useState<"forex" | "stock">("forex");

  const accountVal = parseFloat(accountBalance) || 0;
  const riskVal = parseFloat(riskPercent) || 0;
  const entryVal = parseFloat(entryPrice) || 0;
  const slVal = parseFloat(stopLoss) || 0;

  const riskAmount = accountVal * (riskVal / 100);
  const slDistance = Math.abs(entryVal - slVal);

  const positionSize = slDistance > 0
    ? pairType === "forex"
      ? riskAmount / slDistance / 100000
      : riskAmount / slDistance
    : 0;

  const positionValue = positionSize * entryVal;
  const slPips = pairType === "forex" && entryVal > 0
    ? slDistance / 0.0001
    : 0;

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
        title={t.positionSizeTitle}
        description={t.positionSizeDesc}
        path="/tools/position-size-calculator"
      />
      <ToolPageLayout title={t.positionSizeTitle} description={t.positionSizeDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex gap-2">
                {(["forex", "stock"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPairType(type)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pairType === type
                        ? "border border-accent/30 bg-accent/10 text-accent"
                        : "border border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {type === "forex" ? "Forex" : "Stock"}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t.psAccountBalance}
                  value={accountBalance}
                  onChange={setAccountBalance}
                  placeholder="10000"
                  suffix="USD"
                />
                <InputField
                  label={t.psRiskPercent}
                  value={riskPercent}
                  onChange={setRiskPercent}
                  placeholder="1"
                  suffix="%"
                />
                <InputField
                  label={t.psEntryPrice}
                  value={entryPrice}
                  onChange={setEntryPrice}
                  placeholder="1.1050"
                />
                <InputField
                  label={t.psStopLoss}
                  value={stopLoss}
                  onChange={setStopLoss}
                  placeholder="1.1000"
                />
              </div>

              {entryVal > 0 && slVal > 0 && riskAmount > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ResultCard
                    label={t.psRiskAmount}
                    value={`$${format(riskAmount)}`}
                  />
                  <ResultCard
                    label={t.psPositionSize}
                    value={format(positionSize)}
                    unit={pairType === "forex" ? "lots" : "shares"}
                  />
                  <ResultCard
                    label={t.psPositionValue}
                    value={`$${format(positionValue)}`}
                  />
                  {pairType === "forex" && (
                    <ResultCard
                      label={t.psSLPips}
                      value={format(slPips)}
                      unit="pips"
                    />
                  )}
                  <ResultCard
                    label={t.psSLDistance}
                    value={format(slDistance)}
                  />
                  <ResultCard
                    label={t.psRiskReward}
                    value={slDistance > 0 ? format(riskAmount / slDistance) : "0"}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.psHowItWorks}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.psFormula1}</p>
                <p>{t.psFormula2}</p>
                <p>{t.psFormula3}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.psTip}</h3>
              <p className="text-xs text-text-secondary">{t.psTipDesc}</p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
