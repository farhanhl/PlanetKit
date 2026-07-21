"use client";

import { useState } from "react";
import { Braces, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function JsonFormatterPage() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const format = () => {
    setError(null);
    try {
      const parsed = JSON.parse(input);
      setResult(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setError(`${t.jsonInvalid} ${e instanceof Error ? e.message : ""}`);
    }
  };

  const minify = () => {
    setError(null);
    try {
      const parsed = JSON.parse(input);
      setResult(JSON.stringify(parsed));
    } catch (e) {
      setError(`${t.jsonInvalid} ${e instanceof Error ? e.message : ""}`);
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
      <ToolSeo title={t.jsonTitle} description={t.jsonDesc} path="/tools/json-formatter" />
      <ToolPageLayout title={t.jsonTitle} description={t.jsonDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.jsonPlaceholder} className="h-64 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
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
                <textarea readOnly value={result} className="h-64 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.jsonActions}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.jsonNote}</p>
              <div className="space-y-2">
                <button onClick={format} disabled={!input.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                  <Braces className="h-4 w-4" />
                  {t.jsonFormat}
                </button>
                <button onClick={minify} disabled={!input.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
                  {t.jsonMinify}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
