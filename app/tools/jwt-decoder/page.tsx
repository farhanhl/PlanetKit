"use client";

import { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

function decodeJwt(token: string): { header: object; payload: object; isValid: boolean; error?: string } {
  try {
    const parts = token.trim().split(".");
    if (parts.length < 2) return { header: {}, payload: {}, isValid: false, error: "Invalid JWT format" };

    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { header, payload, isValid: true };
  } catch (e) {
    return { header: {}, payload: {}, isValid: false, error: e instanceof Error ? e.message : "Invalid JWT" };
  }
}

function formatPayload(payload: Record<string, unknown>): string[] {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(payload)) {
    if (key === "exp" && typeof val === "number") {
      const date = new Date(val * 1000);
      lines.push(`${key}: ${val} (${date.toLocaleString()})`);
    } else if (key === "iat" && typeof val === "number") {
      const date = new Date(val * 1000);
      lines.push(`${key}: ${val} (${date.toLocaleString()})`);
    } else if (key === "nbf" && typeof val === "number") {
      const date = new Date(val * 1000);
      lines.push(`${key}: ${val} (${date.toLocaleString()})`);
    } else {
      lines.push(`${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`);
    }
  }
  return lines;
}

export default function JwtDecoderPage() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = input.trim() ? decodeJwt(input) : null;

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify({ header: result.header, payload: result.payload }, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.jwtTitle} description={t.jwtDesc} path="/tools/jwt-decoder" />
      <ToolPageLayout title={t.jwtTitle} description={t.jwtDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.jwtPlaceholder}
              className="h-32 w-full rounded-xl border border-border bg-surface p-4 font-mono text-xs text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
            {result && !result.isValid && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{result.error}</div>
            )}
            {result && result.isValid && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.jwtDecoded}</p>
                  <button onClick={copyResult} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{t.jwtHeader}</h4>
                  <pre className="overflow-x-auto font-mono text-xs text-foreground">{JSON.stringify(result.header, null, 2)}</pre>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{t.jwtPayload}</h4>
                  <div className="space-y-1">
                    {formatPayload(result.payload as Record<string, unknown>).map((line, i) => {
                      const [key, ...rest] = line.split(":");
                      return (
                        <div key={i} className="flex gap-2 font-mono text-xs">
                          <span className="shrink-0 font-semibold text-accent">{key}:</span>
                          <span className="text-foreground">{rest.join(":").trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.jwtInfo}</h3>
              <p className="mb-3 text-xs text-text-secondary">{t.jwtDesc2}</p>
              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex items-start gap-2">
                  <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                  <span>{t.jwtNoteHeader}</span>
                </div>
                <div className="flex items-start gap-2">
                  <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                  <span>{t.jwtNotePayload}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
