"use client";

import { useState, useMemo } from "react";
import { GitCompare, Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface DiffLine {
  type: "same" | "added" | "removed";
  lineA: number | null;
  lineB: number | null;
  text: string;
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const m = linesA.length;
  const n = linesB.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = linesA[i - 1] === linesB[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      result.unshift({ type: "same", lineA: i, lineB: j, text: linesA[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", lineA: null, lineB: j, text: linesB[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", lineA: i, lineB: null, text: linesA[i - 1] });
      i--;
    }
  }
  return result;
}

export default function TextDiffPage() {
  const { t } = useLang();
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);

  const diff = useMemo(() => {
    if (!showDiff) return [];
    return computeDiff(textA, textB);
  }, [textA, textB, showDiff]);

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === "added").length;
    const removed = diff.filter((d) => d.type === "removed").length;
    return { added, removed };
  }, [diff]);

  const copyResult = async () => {
    const text = diff
      .map((d) => {
        if (d.type === "added") return `+ ${d.text}`;
        if (d.type === "removed") return `- ${d.text}`;
        return `  ${d.text}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.textDiffTitle} description={t.textDiffDesc} path="/tools/text-diff" />
      <ToolPageLayout title={t.textDiffTitle} description={t.textDiffDesc}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t.textDiffOriginal}</label>
            <textarea
              value={textA}
              onChange={(e) => { setTextA(e.target.value); setShowDiff(false); }}
              placeholder={t.textDiffPlaceholderA}
              className="h-64 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t.textDiffModified}</label>
            <textarea
              value={textB}
              onChange={(e) => { setTextB(e.target.value); setShowDiff(false); }}
              placeholder={t.textDiffPlaceholderB}
              className="h-64 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setShowDiff(true)}
            disabled={!textA && !textB}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GitCompare className="h-4 w-4" />
            {t.textDiffCompare}
          </button>
          {showDiff && diff.length > 0 && (
            <button
              onClick={copyResult}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              {copied ? t.copied : t.copy}
            </button>
          )}
        </div>

        {showDiff && diff.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex gap-4 text-xs text-text-secondary">
              <span className="text-success">+{stats.added} {t.textDiffAdded}</span>
              <span className="text-error">-{stats.removed} {t.textDiffRemoved}</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full font-mono text-sm">
                <tbody>
                  {diff.map((d, i) => (
                    <tr key={i} className={
                      d.type === "added" ? "bg-success/10" : d.type === "removed" ? "bg-error/10" : ""
                    }>
                      <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-xs text-text-secondary/50">
                        {d.lineA ?? ""}
                      </td>
                      <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-xs text-text-secondary/50">
                        {d.lineB ?? ""}
                      </td>
                      <td className="w-8 select-none px-2 py-0.5 text-center text-xs font-bold">
                        {d.type === "added" ? "+" : d.type === "removed" ? "-" : " "}
                      </td>
                      <td className="whitespace-pre px-2 py-0.5">{d.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showDiff && diff.length === 0 && textA === textB && (
          <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-4 text-center text-sm text-success">
            {t.textDiffNoDiff}
          </div>
        )}
      </ToolPageLayout>
    </>
  );
}
