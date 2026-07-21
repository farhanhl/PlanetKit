"use client";

import { useState } from "react";
import { Clock, Copy, Check, ArrowLeftRight } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function TimestampConverterPage() {
  const { t } = useLang();
  const [mode, setMode] = useState<"toDate" | "toTimestamp">("toDate");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const now = () => {
    setInput(Math.floor(Date.now() / 1000).toString());
    setMode("toDate");
    setError(null);
    setResult(new Date().toISOString());
  };

  const convert = () => {
    setError(null);
    try {
      if (mode === "toDate") {
        const ts = Number(input);
        const date = isNaN(ts)
          ? new Date(input)
          : ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
        if (isNaN(date.getTime())) throw new Error("Invalid");
        setResult(date.toISOString());
      } else {
        const date = new Date(input);
        if (isNaN(date.getTime())) throw new Error("Invalid");
        setResult(Math.floor(date.getTime() / 1000).toString());
      }
    } catch {
      setError(t.timestampInvalid);
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
      <ToolSeo title={t.timestampTitle} description={t.timestampDesc} path="/tools/timestamp-converter" />
      <ToolPageLayout title={t.timestampTitle} description={t.timestampDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex gap-2">
              <button onClick={() => { setMode("toDate"); setResult(""); setError(null); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "toDate" ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}>
                {t.timestampToDate}
              </button>
              <button onClick={() => { setMode("toTimestamp"); setResult(""); setError(null); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "toTimestamp" ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}>
                {t.dateToTimestamp}
              </button>
            </div>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "toDate" ? t.timestampPlaceholder : t.datePlaceholder} className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
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
                <div className="rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground break-all">{result}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.timestampActions}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.timestampNote}</p>
              <div className="space-y-2">
                <button onClick={now} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                  <Clock className="h-4 w-4" />
                  {t.timestampNow}
                </button>
                <button onClick={convert} disabled={!input.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                  <ArrowLeftRight className="h-4 w-4" />
                  {t.convert}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
