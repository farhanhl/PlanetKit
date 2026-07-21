"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function UrlEncoderPage() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const process = () => {
    setError(null);
    try {
      if (mode === "encode") {
        setResult(encodeURIComponent(input));
      } else {
        setResult(decodeURIComponent(input));
      }
    } catch {
      setError(t.urlDecodeFailed);
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
      <ToolSeo title={t.urlEncoderTitle} description={t.urlEncoderDesc} path="/tools/url-encoder" />
      <ToolPageLayout title={t.urlEncoderTitle} description={t.urlEncoderDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? t.urlEncodePlaceholder : t.urlDecodePlaceholder} className="h-48 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
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
                <textarea readOnly value={result} className="h-48 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>
              <div className="mb-4 flex gap-2">
                <button onClick={() => { setMode("encode"); setResult(""); setError(null); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "encode" ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}>
                  {t.encode}
                </button>
                <button onClick={() => { setMode("decode"); setResult(""); setError(null); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "decode" ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}>
                  {t.decode}
                </button>
              </div>
              <button onClick={process} disabled={!input.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Link2 className="h-4 w-4" />
                {mode === "encode" ? t.urlEncodeBtn : t.urlDecodeBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
