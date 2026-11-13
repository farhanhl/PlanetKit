"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

const defaultHTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    h1 { font-size: 2rem; }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <h1>Hello World!</h1>
    <p>Edit the HTML/CSS on the left</p>
  </div>
</body>
</html>`;

export default function HtmlPlaygroundPage() {
  const { t } = useLang();
  const [html, setHtml] = useState(defaultHTML);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cssMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const cssContent = cssMatch ? cssMatch[1] : "";
  const bodyContent = bodyMatch ? bodyMatch[1] : "";

  const updateHTML = (section: "body" | "css", value: string) => {
    let newHtml = html;
    if (section === "css") {
      if (cssMatch) {
        newHtml = newHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/i, `<style>\n${value}\n</style>`);
      } else {
        newHtml = newHtml.replace(/<head([^>]*)>/, `<head$1>\n<style>\n${value}\n</style>`);
      }
    } else if (section === "body") {
      if (bodyMatch) {
        newHtml = newHtml.replace(/<body[^>]*>([\s\S]*?)<\/body>/i, `<body>${value}</body>`);
      }
    }
    setHtml(newHtml);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [html]);

  return (
    <>
      <ToolSeo title={t.playgroundTitle} description={t.playgroundDesc} path="/tools/html-playground" />
      <ToolPageLayout title={t.playgroundTitle} description={t.playgroundDesc}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex gap-1">
              {(["html", "css", "js"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            {activeTab === "html" && (
              <textarea
                value={bodyContent}
                onChange={(e) => updateHTML("body", e.target.value)}
                className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
                spellCheck={false}
              />
            )}
            {activeTab === "css" && (
              <textarea
                value={cssContent}
                onChange={(e) => updateHTML("css", e.target.value)}
                className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
                spellCheck={false}
              />
            )}
            {activeTab === "js" && (
              <textarea
                value={`<script>\n${html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ""}\n</script>`}
                onChange={(e) => {
                  const js = e.target.value.replace(/^<script>\n?/, "").replace(/\n?<\/script>$/, "");
                  if (html.match(/<script[^>]*>[\s\S]*?<\/script>/i)) {
                    setHtml(html.replace(/<script[^>]*>[\s\S]*?<\/script>/i, `<script>\n${js}\n</script>`));
                  } else {
                    setHtml(html.replace(/<\/body>/, `<script>\n${js}\n</script>\n</body>`));
                  }
                }}
                className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
                spellCheck={false}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-xs font-medium text-text-secondary">{t.playgroundPreview}</p>
            <iframe
              ref={iframeRef}
              className="h-[432px] w-full rounded-xl border border-border bg-white"
              sandbox="allow-scripts"
              title="Preview"
            />
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
