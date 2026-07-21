"use client";

import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import MarkdownIt from "markdown-it";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const sampleMd = `# Heading 1

## Heading 2

This is **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

> Blockquote example

\`inline code\`

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

[Link to example](https://example.com)
`;

export default function MarkdownPreviewPage() {
  const { t } = useLang();
  const [input, setInput] = useState(sampleMd);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => md.render(input), [input]);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.mdPreviewTitle} description={t.mdPreviewDesc} path="/tools/markdown-preview" />
      <ToolPageLayout title={t.mdPreviewTitle} description={t.mdPreviewDesc}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t.mdPreviewEditor}</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.mdPreviewPlaceholder}
              className="h-[500px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t.mdPreviewPreview}</label>
              <button
                onClick={copyHtml}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copied ? t.copied : t.mdPreviewCopyHtml}
              </button>
            </div>
            <div
              className="prose prose-sm h-[500px] overflow-y-auto rounded-xl border border-border bg-surface p-4 text-foreground dark:prose-invert prose-headings:font-bold prose-a:text-accent prose-code:text-accent prose-pre:bg-background"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
