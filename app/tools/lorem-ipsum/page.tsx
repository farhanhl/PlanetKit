"use client";

import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const words = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde",
  "omnis", "iste", "natus", "error", "voluptatem", "accusantium", "doloremque",
  "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo",
  "inventore", "veritatis", "quasi", "architecto", "beatae", "vitae", "dicta",
  "explicabo", "nemo", "ipsam", "quia", "voluptas", "aspernatur", "aut", "odit",
  "fugit", "consequuntur", "magni", "dolores", "eos", "ratione", "sequi", "nesciunt",
  "neque", "porro", "quisquam", "nihil", "impedit", "quo", "minus", "maxime",
  "placeat", "facere", "possimus", "omnis", "repellat",
];

function generateParagraph(): string {
  const len = 40 + Math.floor(Math.random() * 40);
  const result: string[] = [];
  for (let i = 0; i < len; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  result[0] = result[0][0].toUpperCase() + result[0].slice(1);
  return result.join(" ") + ".";
}

function generateText(paragraphs: number): string {
  return Array.from({ length: paragraphs }, () => generateParagraph()).join("\n\n");
}

export default function LoremIpsumPage() {
  const { t } = useLang();
  const [paragraphs, setParagraphs] = useState(3);
  const [text, setText] = useState(() => generateText(3));
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setText(generateText(paragraphs));
  }, [paragraphs]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <>
      <ToolSeo title={t.loremTitle} description={t.loremDesc} path="/tools/lorem-ipsum" />
      <ToolPageLayout title={t.loremTitle} description={t.loremDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              readOnly
              value={text}
              className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none"
            />
            <p className="mt-2 text-xs text-text-secondary">{wordCount} {t.loremWords}</p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.loremSettings}</h3>
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                  <span>{t.loremParagraphs}</span>
                  <span>{paragraphs}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={paragraphs}
                  onChange={(e) => setParagraphs(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={generate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.loremGenerate}
                </button>
                <button
                  onClick={copyText}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
