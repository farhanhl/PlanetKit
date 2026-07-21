"use client";

import { useState, useRef, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { Play, Trash2, Loader2 } from "lucide-react";

const defaultCode = `<?php
// PHP Playground — runs in-browser via WASM

$name = "World";
echo "Hello, $name!\\n";

$numbers = [1, 2, 3, 4, 5];
echo "Numbers: " . implode(", ", $numbers) . "\\n";

$even = array_filter($numbers, fn($n) => $n % 2 === 0);
echo "Even: " . implode(", ", $even) . "\\n";

echo "Sum: " . array_sum($numbers) . "\\n";
echo "Pi: " . pi() . "\\n";
?>`;

interface LogEntry {
  type: "stdout" | "stderr" | "result";
  text: string;
}

declare global {
  interface Window {
    PhpWasm: {
      load: () => Promise<{
        stdin: (callback: () => string) => void;
        stdout: (callback: (text: string) => void) => void;
        stderr: (callback: (text: string) => void) => void;
        runPHP: (code: string) => Promise<{ exitCode: number }>;
      }>;
    };
  }
}

const PHP_CDN = "https://cdn.jsdelivr.net/npm/php-wasm@0.0.7/php-web.js";

export default function PhpPlaygroundPage() {
  const { t } = useLang();
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhp, setLoadingPhp] = useState(false);
  const [phpReady, setPhpReady] = useState(false);
  const phpRef = useRef<{ stdin: (callback: () => string) => void; stdout: (callback: (text: string) => void) => void; stderr: (callback: (text: string) => void) => void; runPHP: (code: string) => Promise<{ exitCode: number }> } | null>(null);

  const initPhp = useCallback(async () => {
    if (phpRef.current) return phpRef.current;
    setLoadingPhp(true);

    await new Promise<void>((resolve, reject) => {
      if (document.querySelector('script[src*="php-web.js"]')) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = PHP_CDN;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load PHP WASM"));
      document.head.appendChild(s);
    });

    const php = await window.PhpWasm.load();
    phpRef.current = php;
    setLoadingPhp(false);
    setPhpReady(true);
    return php;
  }, []);

  const runCode = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    setOutput([]);

    try {
      const php = await initPhp();
      const captured: LogEntry[] = [];

      php.stdout((text: string) => {
        captured.push({ type: "stdout", text });
      });
      php.stderr((text: string) => {
        captured.push({ type: "stderr", text });
      });

      const result = await php.runPHP(code);

      setOutput(
        captured.length > 0
          ? captured
          : result.exitCode !== 0
            ? [{ type: "stderr", text: `Exit code: ${result.exitCode}` }]
            : [{ type: "result", text: "(no output)" }]
      );
    } catch (err) {
      setOutput([{ type: "stderr", text: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setLoading(false);
    }
  }, [code, initPhp]);

  return (
    <>
      <ToolSeo title={t.phpPlaygroundTitle} description={t.phpPlaygroundDesc} path="/tools/php-playground" />
      <ToolPageLayout title={t.phpPlaygroundTitle} description={t.phpPlaygroundDesc}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">PHP</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCode(""); setOutput([]); }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                  {t.jsPlaygroundClear}
                </button>
                <button
                  onClick={runCode}
                  disabled={loading || !code.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading || loadingPhp ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {loadingPhp
                    ? t.phpPlaygroundLoading
                    : loading
                      ? t.jsPlaygroundRunning
                      : t.jsPlaygroundRun}
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
              spellCheck={false}
              placeholder={t.phpPlaygroundPlaceholder}
            />
            {!phpReady && !loadingPhp && (
              <p className="text-xs text-text-secondary/60">{t.phpPlaygroundNote}</p>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="mb-2 text-xs font-medium text-text-secondary">{t.jsPlaygroundOutput}</p>
            <div className="h-[432px] w-full overflow-auto rounded-xl border border-border bg-surface p-4 font-mono text-sm">
              {output.length === 0 ? (
                <p className="text-text-secondary/50">{t.jsPlaygroundEmpty}</p>
              ) : (
                <div className="space-y-1">
                  {output.map((entry, i) => (
                    <div
                      key={i}
                      className={`whitespace-pre-wrap break-all ${
                        entry.type === "stderr" ? "text-red-400" : "text-foreground"
                      }`}
                    >
                      {entry.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
