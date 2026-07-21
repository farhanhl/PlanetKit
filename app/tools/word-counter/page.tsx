"use client";

import { useState } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

function countStats(text: string) {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text ? text.split("\n").length : 0;
  return { chars, charsNoSpace, words, sentences, paragraphs, lines };
}

export default function WordCounterPage() {
  const { t } = useLang();
  const [text, setText] = useState("");
  const stats = countStats(text);

  return (
    <>
      <ToolSeo title={t.wordCounterTitle} description={t.wordCounterDesc} path="/tools/word-counter" />
      <ToolPageLayout title={t.wordCounterTitle} description={t.wordCounterDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.wordCounterPlaceholder}
              className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.statistics}</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label={t.wcWords} value={stats.words} />
                <StatCard label={t.wcCharacters} value={stats.chars} />
                <StatCard label={t.wcCharsNoSpace} value={stats.charsNoSpace} />
                <StatCard label={t.wcSentences} value={stats.sentences} />
                <StatCard label={t.wcParagraphs} value={stats.paragraphs} />
                <StatCard label={t.wcLines} value={stats.lines} />
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <p className="text-lg font-bold text-accent">{value.toLocaleString()}</p>
      <p className="text-[10px] text-text-secondary">{label}</p>
    </div>
  );
}
