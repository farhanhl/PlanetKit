"use client";

import { useState } from "react";
import { Fingerprint, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const ALGORITHMS = ["SHA-256", "SHA-1", "SHA-384", "SHA-512"] as const;

export default function HashGeneratorPage() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<string>("SHA-256");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!input.trim()) return;
    setError(null);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest(algorithm, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      setResult(hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""));
    } catch {
      setError(t.hashFailed);
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
      <ToolSeo title={t.hashTitle} description={t.hashDesc} path="/tools/hash-generator" />
      <ToolPageLayout title={t.hashTitle} description={t.hashDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.hashPlaceholder}
              className="h-48 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
            )}
            {result && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.result}</p>
                  <button
                    onClick={copyResult}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground break-all">
                  {result}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.hashSettings}</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.algorithm}</label>
                <div className="flex flex-wrap gap-2">
                  {ALGORITHMS.map((alg) => (
                    <button
                      key={alg}
                      onClick={() => setAlgorithm(alg)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        algorithm === alg
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "border border-border text-text-secondary hover:border-accent/40"
                      }`}
                    >
                      {alg}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={generate}
                disabled={!input.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Fingerprint className="h-4 w-4" />
                {t.generateHash}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
