"use client";

import { useState, useRef, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { Play, Trash2 } from "lucide-react";

const defaultCode = `// JavaScript Playground
// Write any JS code and click Run

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

console.log("Numbers:", numbers);
console.log("Doubled:", doubled);
console.log("Sum:", doubled.reduce((a, b) => a + b, 0));`;

interface LogEntry {
  type: "log" | "error" | "warn" | "info";
  args: string[];
  timestamp: number;
}

export default function JsPlaygroundPage() {
  const { t } = useLang();
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const runCode = useCallback(() => {
    setRunning(true);
    setOutput([]);

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const logs: LogEntry[] = [];
    const ts = Date.now();

    const blob = new Blob(
      [
        `
        const _logs = [];
        const _post = (type, args) => {
          _logs.push({ type, args: args.map(a => {
            if (a === undefined) return "undefined";
            if (a === null) return "null";
            if (typeof a === "object") {
              try { return JSON.stringify(a, null, 2); } catch { return String(a); }
            }
            return String(a);
          }), timestamp: Date.now() });
        };

        const console = {
          log: (...args) => _post("log", args),
          error: (...args) => _post("error", args),
          warn: (...args) => _post("warn", args),
          info: (...args) => _post("info", args),
        };

        try {
          const _fn = new Function(${JSON.stringify(code)});
          const _result = _fn();
          if (_result !== undefined) _post("log", ["→ " + (typeof _result === "object" ? JSON.stringify(_result, null, 2) : String(_result))]);
        } catch (e) {
          _post("error", [e instanceof Error ? e.message : String(e)]);
        }

        postMessage(_logs);
        `,
      ],
      { type: "application/javascript" }
    );

    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      setOutput(e.data);
      setRunning(false);
      worker.terminate();
    };

    worker.onerror = (e) => {
      setOutput([{ type: "error", args: [e.message || "Unknown error"], timestamp: Date.now() }]);
      setRunning(false);
      worker.terminate();
    };

    setTimeout(() => {
      if (workerRef.current === worker) {
        setOutput((prev) => [
          ...prev,
          { type: "warn", args: ["Execution timed out (3s)"], timestamp: Date.now() },
        ]);
        worker.terminate();
        setRunning(false);
      }
    }, 3000);
  }, [code]);

  return (
    <>
      <ToolSeo title={t.jsPlaygroundTitle} description={t.jsPlaygroundDesc} path="/tools/js-playground" />
      <ToolPageLayout title={t.jsPlaygroundTitle} description={t.jsPlaygroundDesc}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">JavaScript</p>
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
                  disabled={running || !code.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play className="h-3 w-3" />
                  {running ? t.jsPlaygroundRunning : t.jsPlaygroundRun}
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
              spellCheck={false}
              placeholder={t.jsPlaygroundPlaceholder}
            />
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
                        entry.type === "error"
                          ? "text-red-400"
                          : entry.type === "warn"
                            ? "text-yellow-400"
                            : entry.type === "info"
                              ? "text-blue-400"
                              : "text-foreground"
                      }`}
                    >
                      {entry.args.join(" ")}
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
