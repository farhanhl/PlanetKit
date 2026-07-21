"use client";

import { useState, useRef, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { Play, Trash2, Loader2 } from "lucide-react";

const defaultCode = `# Python Playground
# Write any Python code and click Run

numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]

print("Numbers:", numbers)
print("Doubled:", doubled)
print("Sum:", sum(doubled))

# You can use Python built-ins
import math
print("π =", math.pi)
print("√2 =", math.sqrt(2))`;

interface LogEntry {
  type: "stdout" | "stderr" | "result";
  text: string;
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<{
      runPythonAsync: (code: string) => Promise<unknown>;
      registerJsProxy: (name: string, obj: unknown) => void;
      globals: { get: (name: string) => unknown };
    }>;
  }
}

export default function PythonPlaygroundPage() {
  const { t } = useLang();
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const pyodideRef = useRef<Awaited<ReturnType<typeof window.loadPyodide>> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const initPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setLoadingPyodide(true);

    await new Promise<void>((resolve, reject) => {
      if (document.querySelector('script[src*="pyodide"]')) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Pyodide"));
      document.head.appendChild(s);
    });

    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    });

    pyodideRef.current = pyodide;
    setLoadingPyodide(false);
    setPyodideReady(true);
    return pyodide;
  }, []);

  const runCode = useCallback(async () => {
    if (!code.trim()) return;
    setOutput([]);
    setLoading(true);

    try {
      const pyodide = await initPyodide();

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const captured: LogEntry[] = [];

      await pyodide.runPythonAsync(`
import sys, io

class _Capturer:
    def __init__(self):
        self.lines = []
    def write(self, s):
        if s.strip():
            self.lines.append(s.rstrip('\\n'))
    def flush(self):
        pass

_stdout = sys.stdout
_stderr = sys.stderr
_cap = _Capturer()
sys.stdout = _cap
sys.stderr = _cap
`);

      await pyodide.runPythonAsync(code);

      const result = await pyodide.runPythonAsync(`
sys.stdout = _stdout
sys.stderr = _stderr
_cap.lines
`);

      if (Array.isArray(result)) {
        for (const line of result) {
          captured.push({ type: "stdout", text: String(line) });
        }
      }

      setOutput(captured.length > 0 ? captured : [{ type: "stdout", text: "(no output)" }]);
    } catch (err) {
      setOutput([{ type: "stderr", text: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setLoading(false);
    }
  }, [code, initPyodide]);

  return (
    <>
      <ToolSeo title={t.pythonPlaygroundTitle} description={t.pythonPlaygroundDesc} path="/tools/python-playground" />
      <ToolPageLayout title={t.pythonPlaygroundTitle} description={t.pythonPlaygroundDesc}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">Python 3</p>
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
                  {loading || loadingPyodide ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {loadingPyodide
                    ? t.pythonPlaygroundLoading
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
              placeholder={t.pythonPlaygroundPlaceholder}
            />
            {!pyodideReady && !loadingPyodide && (
              <p className="text-xs text-text-secondary/60">{t.pythonPlaygroundNote}</p>
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
