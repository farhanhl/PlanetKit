"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function PasswordGeneratorPage() {
  const { t } = useLang();
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let chars = "";
    if (useUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) chars += "0123456789";
    if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!chars) return;
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr, (v) => chars[v % chars.length]).join(""));
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.passwordGenTitle} description={t.passwordGenDesc} path="/tools/password-generator" />
      <ToolPageLayout title={t.passwordGenTitle} description={t.passwordGenDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {password ? (
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.generatedPassword}</p>
                  <div className="flex gap-2">
                    <button onClick={copyResult} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      {copied ? t.copied : t.copy}
                    </button>
                  </div>
                </div>
                <p className="rounded-lg bg-background p-4 font-mono text-lg text-accent break-all">{password}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
                  <span>{t.length}: {password.length}</span>
                  <span>{t.strength}: {getStrengthLabel(password, t)}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-text-secondary">
                {t.passwordEmpty}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.passwordSettings}</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.length}: {length}</label>
                <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-accent" />
              </div>
              <div className="mb-4 space-y-2">
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} className="accent-accent" /> ABC
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} className="accent-accent" /> abc
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} className="accent-accent" /> 123
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} className="accent-accent" /> !@#
                </label>
              </div>
              <button
                onClick={generate}
                disabled={!useUpper && !useLower && !useNumbers && !useSymbols}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" />
                {t.generatePassword}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function getStrengthLabel(pw: string, t: Record<string, string>): string {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 20) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return t.weak;
  if (score <= 3) return t.medium;
  return t.strong;
}
