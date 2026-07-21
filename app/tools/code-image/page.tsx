"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Download, Copy, Check, ChevronDown } from "lucide-react";
import html2canvas from "html2canvas-pro";
import hljs from "highlight.js";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface Theme {
  name: string;
  bg: string;
  text: string;
  keyword: string;
  string: string;
  comment: string;
  function: string;
  number: string;
  operator: string;
  type: string;
  titleBar: string;
}

const themes: Theme[] = [
  { name: "Seti", bg: "#151718", text: "#E3E3E3", keyword: "#E3E3E3", string: "#C5A332", comment: "#73817D", function: "#6AB0F3", number: "#C5A332", operator: "#E3E3E3", type: "#6AB0F3", titleBar: "#1B1D1E" },
  { name: "Monokai", bg: "#272822", text: "#F8F8F2", keyword: "#F92672", string: "#E6DB74", comment: "#75715E", function: "#A6E22E", number: "#AE81FF", operator: "#F92672", type: "#66D9EF", titleBar: "#1E1F1C" },
  { name: "Dracula", bg: "#282A36", text: "#F8F8F2", keyword: "#FF79C6", string: "#F1FA8C", comment: "#6272A4", function: "#50FA7B", number: "#BD93F9", operator: "#FF79C6", type: "#8BE9FD", titleBar: "#1E1F29" },
  { name: "Nord", bg: "#2E3440", text: "#D8DEE9", keyword: "#81A1C1", string: "#A3BE8C", comment: "#616E88", function: "#88C0D0", number: "#B48EAD", operator: "#81A1C1", type: "#8FBCBB", titleBar: "#242933" },
  { name: "Solarized Dark", bg: "#002B36", text: "#839496", keyword: "#859900", string: "#2AA198", comment: "#586E75", function: "#268BD2", number: "#D33682", operator: "#859900", type: "#CB4B16", titleBar: "#001E27" },
  { name: "One Dark", bg: "#282C34", text: "#ABB2BF", keyword: "#C678DD", string: "#98C379", comment: "#5C6370", function: "#61AFEF", number: "#D19A66", operator: "#56B6C2", type: "#E5C07B", titleBar: "#1E2127" },
  { name: "Material", bg: "#263238", text: "#EEFFFF", keyword: "#C792EA", string: "#C3E88D", comment: "#546E7A", function: "#82AAFF", number: "#F78C6C", operator: "#89DDFF", type: "#FFCB6B", titleBar: "#1C2328" },
  { name: "GitHub Light", bg: "#FFFFFF", text: "#24292E", keyword: "#D73A49", string: "#032F62", comment: "#6A737D", function: "#6F42C1", number: "#005CC5", operator: "#D73A49", type: "#005CC5", titleBar: "#F6F8FA" },
  { name: "Ocean", bg: "#2B303B", text: "#C0C5CE", keyword: "#B48EAD", string: "#A3BE8C", comment: "#65737E", function: "#8FA1B3", number: "#D08770", operator: "#BF616A", type: "#8FA1B3", titleBar: "#232830" },
  { name: "Synthwave '84", bg: "#27213E", text: "#FFFFFF", keyword: "#FED766", string: "#36F9F6", comment: "#8480C9", function: "#F97E72", number: "#FED766", operator: "#F97E72", type: "#36F9F6", titleBar: "#1E1835" },
  { name: "Night Owl", bg: "#011627", text: "#D7DEE9", keyword: "#C792EA", string: "#C3E88D", comment: "#637777", function: "#82AAFF", number: "#F78C6C", operator: "#89DDFF", type: "#FFCB6B", titleBar: "#001420" },
  { name: "A11y Dark", bg: "#2B2B2B", text: "#A9B7C6", keyword: "#CC7832", string: "#6A8759", comment: "#808080", function: "#FFC66D", number: "#6897BB", operator: "#A9B7C6", type: "#A9B7C6", titleBar: "#232323" },
];

const languages = [
  "javascript", "typescript", "python", "java", "go", "rust", "c", "cpp",
  "csharp", "ruby", "php", "swift", "kotlin", "scala", "html", "css",
  "sql", "bash", "json", "yaml", "markdown", "xml", "dart", "lua",
  "r", "perl", "haskell", "elixir", "graphql", "toml",
];

const langMap: Record<string, string> = {
  javascript: "javascript", typescript: "typescript", python: "python", java: "java",
  go: "go", rust: "rust", c: "c", cpp: "cpp", csharp: "csharp", ruby: "ruby",
  php: "php", swift: "swift", kotlin: "kotlin", scala: "scala", html: "xml",
  css: "css", sql: "sql", bash: "bash", json: "json", yaml: "yaml",
  markdown: "markdown", xml: "xml", dart: "dart", lua: "lua", r: "r",
  perl: "perl", haskell: "haskell", elixir: "elixir", graphql: "graphql", toml: "ini",
};

const fonts = [
  { name: "Hack", value: "Hack, monospace" },
  { name: "Fira Code", value: "'Fira Code', monospace" },
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { name: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { name: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
  { name: "Inconsolata", value: "Inconsolata, monospace" },
  { name: "SF Mono", value: "'SF Mono', monospace" },
  { name: "Cascadia Code", value: "'Cascadia Code', monospace" },
  { name: "Ubuntu Mono", value: "'Ubuntu Mono', monospace" },
];

type WindowStyle = "none" | "macos" | "bw" | "sharp" | "boxy";

const defaultCode = `// Welcome to Code Image Generator!
// Create beautiful code screenshots instantly.

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`Fibonacci(10) = \${result}\`);

// Try changing the theme, language, and settings!
interface Config {
  theme: string;
  language: string;
  fontSize: number;
}`;

export default function CodeImagePage() {
  const { t } = useLang();
  const [code, setCode] = useState(defaultCode);
  const [themeIdx, setThemeIdx] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [fontFamily, setFontFamily] = useState(fonts[0].value);
  const [fontSize, setFontSize] = useState(16);
  const [padding, setPadding] = useState(50);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showWindowControls, setShowWindowControls] = useState(true);
  const [windowStyle, setWindowStyle] = useState<WindowStyle>("macos");
  const [dropShadow, setDropShadow] = useState(true);
  const [bgColor, setBgColor] = useState("#ABABAB");
  const [useThemeBg, setUseThemeBg] = useState(true);
  const [exportScale, setExportScale] = useState<"1x" | "2x" | "4x">("2x");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const theme = themes[themeIdx];
  const effectiveBg = useThemeBg ? theme.bg : bgColor;

  const highlighted = useMemo(() => {
    const lang = langMap[language] || language;
    try {
      if (hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [code, language]);

  const lines = useMemo(() => code.split("\n"), [code]);

  const handleCopyImage = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: parseInt(exportScale),
        backgroundColor: null,
      });
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch {}
  }, [exportScale]);

  const handleExport = useCallback(async (fmt: "png" | "svg") => {
    if (!previewRef.current) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: parseInt(exportScale),
        backgroundColor: null,
      });
      if (fmt === "svg") {
        const dataUrl = canvas.toDataURL("image/png");
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
        const blob = new Blob([svgStr], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.download = "code-image.svg";
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        const link = document.createElement("a");
        link.download = "code-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch {} finally {
      setExporting(false);
    }
  }, [exportScale]);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      setCode((prev) => prev.substring(0, start) + "  " + prev.substring(end));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const dotColors: Record<WindowStyle, string[]> = {
    none: [],
    macos: ["#FF5F57", "#FEBC2E", "#28C840"],
    bw: ["#999", "#999", "#999"],
    sharp: ["#FF5F57", "#FEBC2E", "#28C840"],
    boxy: ["#FF5F57", "#FEBC2E", "#28C840"],
  };

  return (
    <>
      <ToolSeo title={t.codeImageTitle} description={t.codeImageDesc} path="/tools/code-image" />
      <ToolPageLayout title={t.codeImageTitle} description={t.codeImageDesc}>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: Preview + Editor */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <div className="flex">
                  <button
                    onClick={() => handleExport("png")}
                    disabled={!code.trim() || exporting}
                    className="flex items-center gap-1.5 rounded-l-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exporting ? t.codeImageExporting : t.codeImageExport}
                  </button>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={!code.trim() || exporting}
                    className="rounded-r-lg border-l border-accent-hover bg-accent px-2 py-2 text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                {showExportMenu && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-surface py-1 shadow-lg">
                    <button onClick={() => handleExport("png")} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent/10">PNG</button>
                    <button onClick={() => handleExport("svg")} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent/10">SVG</button>
                  </div>
                )}
              </div>
              <button
                onClick={handleCopyImage}
                disabled={!code.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t.copied : t.codeImageCopy}
              </button>
              <div className="ml-auto flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-text-secondary">
                <select
                  value={exportScale}
                  onChange={(e) => setExportScale(e.target.value as "1x" | "2x" | "4x")}
                  className="bg-transparent text-xs text-foreground focus:outline-none"
                >
                  <option value="1x">1x</option>
                  <option value="2x">2x</option>
                  <option value="4x">4x</option>
                </select>
              </div>
            </div>

            {/* Preview card */}
            <div
              ref={previewRef}
              style={{
                background: effectiveBg,
                borderRadius: 12,
                boxShadow: dropShadow ? "0 25px 60px -12px rgba(0,0,0,0.5)" : "none",
              }}
            >
              {showWindowControls && windowStyle !== "none" && (
                <div
                  style={{
                    background: theme.titleBar,
                    borderRadius: windowStyle === "boxy" ? "4px 4px 0 0" : "12px 12px 0 0",
                    padding: "14px 16px",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  {dotColors[windowStyle].map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: windowStyle === "boxy" ? 2 : 6,
                        background: c,
                      }}
                    />
                  ))}
                </div>
              )}
              <pre
                style={{
                  margin: 0,
                  padding,
                  fontFamily,
                  fontSize,
                  lineHeight: `${lineHeight * 100}%`,
                  color: theme.text,
                  whiteSpace: "pre",
                  overflowX: "auto",
                  tabSize: 2,
                }}
              >
                <code style={{ display: "flex" }}>
                  {showLineNumbers && (
                    <span
                      style={{
                        flexShrink: 0,
                        width: `${String(lines.length).length + 1}em`,
                        textAlign: "right",
                        marginRight: "1.5em",
                        opacity: 0.3,
                        userSelect: "none",
                      }}
                    >
                      {lines.map((_, i) => (
                        <span key={i} style={{ display: "block" }}>{i + 1}</span>
                      ))}
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }} dangerouslySetInnerHTML={{ __html: highlighted }} />
                </code>
              </pre>
            </div>

            {/* Code editor textarea */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.codeImageEditor}</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                placeholder={t.codeImagePlaceholder}
                className="h-48 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Settings */}
          <div className="w-full shrink-0 lg:w-72">
            <div className="space-y-4">
              {/* Language */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.codeImageLang}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.codeImageTheme}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {themes.map((th, i) => (
                    <button
                      key={th.name}
                      onClick={() => setThemeIdx(i)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                        themeIdx === i
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:border-accent/40"
                      }`}
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ background: th.bg }}
                      />
                      <span className="truncate">{th.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.codeImageFont}</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  {fonts.map((f) => (
                    <option key={f.name} value={f.value}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">{t.codeImageFontSize}</label>
                  <span className="text-xs text-text-secondary">{fontSize}px</span>
                </div>
                <input
                  type="range" min={10} max={24} step={1} value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              {/* Padding */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">{t.codeImagePadding}</label>
                  <span className="text-xs text-text-secondary">{padding}px</span>
                </div>
                <input
                  type="range" min={16} max={120} step={4} value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              {/* Line Height */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">{t.codeImageLineHeight}</label>
                  <span className="text-xs text-text-secondary">{Math.round(lineHeight * 100)}%</span>
                </div>
                <input
                  type="range" min={1} max={2.5} step={0.05} value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              {/* Background */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.codeImageBg}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseThemeBg(true)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      useThemeBg ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {t.codeImageBgTheme}
                  </button>
                  <button
                    onClick={() => setUseThemeBg(false)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      !useThemeBg ? "bg-accent/10 text-accent border border-accent/30" : "border border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {t.codeImageBgCustom}
                  </button>
                </div>
                {!useThemeBg && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Window Style */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.codeImageWindow}</label>
                <div className="grid grid-cols-5 gap-1">
                  {(["none", "macos", "bw", "sharp", "boxy"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => { setWindowStyle(w); if (w !== "none") setShowWindowControls(true); }}
                      className={`rounded-lg px-1 py-2 text-xs font-medium transition-colors ${
                        windowStyle === w
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "border border-border text-text-secondary hover:border-accent/40"
                      }`}
                    >
                      {w === "none" ? t.codeImageWindowNone : w === "macos" ? "macOS" : w === "bw" ? "BW" : w === "sharp" ? "Sharp" : "Boxy"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.codeImageLineNumbers}</span>
                  <button
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${showLineNumbers ? "bg-accent" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showLineNumbers ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.codeImageWindowControls}</span>
                  <button
                    onClick={() => setShowWindowControls(!showWindowControls)}
                    disabled={windowStyle === "none"}
                    className={`relative h-5 w-9 rounded-full transition-colors ${showWindowControls ? "bg-accent" : "bg-border"} disabled:opacity-40`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showWindowControls ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.codeImageShadow}</span>
                  <button
                    onClick={() => setDropShadow(!dropShadow)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${dropShadow ? "bg-accent" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${dropShadow ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
