"use client";

import { useState } from "react";
import { TestTube2, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function RegexTesterPage() {
  const { t } = useLang();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testStr, setTestStr] = useState("");
  const [matches, setMatches] = useState<{ match: string; index: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const test = () => {
    setError(null);
    setMatches([]);
    try {
      const regex = new RegExp(pattern, flags);
      const results: { match: string; index: number }[] = [];
      if (flags.includes("g")) {
        let m;
        while ((m = regex.exec(testStr)) !== null) {
          results.push({ match: m[0], index: m.index });
          if (m[0] === "") regex.lastIndex++;
        }
      } else {
        const m = regex.exec(testStr);
        if (m) results.push({ match: m[0], index: m.index });
      }
      setMatches(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.regexInvalid);
    }
  };

  const copyMatches = async () => {
    try {
      await navigator.clipboard.writeText(matches.map((m) => m.match).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const highlightText = () => {
    if (!pattern || matches.length === 0) return escapeHtml(testStr);
    try {
      const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      return testStr.replace(regex, (m) => `<mark class="bg-accent/30 text-foreground rounded px-0.5">${escapeHtml(m)}</mark>`);
    } catch {
      return escapeHtml(testStr);
    }
  };

  return (
    <>
      <ToolSeo title={t.regexTitle} description={t.regexDesc} path="/tools/regex-tester" />
      <ToolPageLayout title={t.regexTitle} description={t.regexDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-text-secondary">{t.regexPattern}</label>
                <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder={t.regexPlaceholder} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-medium text-text-secondary">{t.flags}</label>
                <input type="text" value={flags} onChange={(e) => setFlags(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm text-foreground focus:border-accent focus:outline-none" />
              </div>
            </div>
            <textarea value={testStr} onChange={(e) => setTestStr(e.target.value)} placeholder={t.regexTestPlaceholder} className="h-40 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {matches.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.matches} ({matches.length})</p>
                  <button onClick={copyMatches} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <div className="mb-3 rounded-xl border border-border bg-surface p-4 text-sm text-foreground" dangerouslySetInnerHTML={{ __html: highlightText() }} />
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">#</th><th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">{t.match}</th>                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">{t.regexPosition}</th></tr></thead>
                    <tbody>{matches.map((m, i) => <tr key={i} className="border-b border-border last:border-0"><td className="px-3 py-2 text-text-secondary">{i + 1}</td><td className="px-3 py-2 font-mono text-foreground">{m.match}</td><td className="px-3 py-2 text-text-secondary">{m.index}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.regexActions}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.regexNote}</p>
              <button onClick={test} disabled={!pattern.trim() || !testStr.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <TestTube2 className="h-4 w-4" />
                {t.regexTest}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
