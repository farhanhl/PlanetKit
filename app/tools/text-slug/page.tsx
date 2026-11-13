"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSlug(text: string, opts: { lowercase: boolean; removeSpecial: boolean; separator: string }): string {
  const sep = escapeRegExp(opts.separator);
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, opts.removeSpecial ? "" : " ")
    .replace(/[\s_]+/g, opts.separator)
    .replace(new RegExp(`${sep}+`, "g"), opts.separator)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
  return opts.lowercase ? slug.toLowerCase() : slug;
}

export default function TextSlugPage() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [lowercase, setLowercase] = useState(true);
  const [removeSpecial, setRemoveSpecial] = useState(true);
  const [separator, setSeparator] = useState("-");
  const [copied, setCopied] = useState(false);

  const slug = input ? toSlug(input, { lowercase, removeSpecial, separator }) : "";

  const copySlug = async () => {
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.slugTitle} description={t.slugDesc} path="/tools/text-slug" />
      <ToolPageLayout title={t.slugTitle} description={t.slugDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.slugPlaceholder}
              className="h-32 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
            {slug && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.result}</p>
                  <button onClick={copySlug} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground">{slug}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.slugSettings}</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={lowercase} onChange={(e) => setLowercase(e.target.checked)} className="accent-accent" />
                  {t.slugLowercase}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={removeSpecial} onChange={(e) => setRemoveSpecial(e.target.checked)} className="accent-accent" />
                  {t.slugRemoveSpecial}
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.slugSeparator}</label>
                  <div className="flex gap-2">
                    {["-", "_", "+"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeparator(s)}
                        className={`rounded-lg border px-4 py-2 text-sm font-mono font-medium transition-colors ${
                          separator === s ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-accent/40"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
