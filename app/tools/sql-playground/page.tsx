"use client";

import { useState, useRef, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { Play, Trash2, Loader2, RotateCcw } from "lucide-react";

const SAMPLE_DB = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  city TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  order_date TEXT
);

INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', 30, 'Jakarta');
INSERT INTO users VALUES (2, 'Bob', 'bob@example.com', 25, 'Bandung');
INSERT INTO users VALUES (3, 'Charlie', 'charlie@example.com', 35, 'Surabaya');
INSERT INTO users VALUES (4, 'Diana', 'diana@example.com', 28, 'Jakarta');
INSERT INTO users VALUES (5, 'Eve', 'eve@example.com', 32, 'Yogyakarta');

INSERT INTO products VALUES (1, 'Laptop', 'Electronics', 12000000, 50);
INSERT INTO products VALUES (2, 'Mouse', 'Electronics', 150000, 200);
INSERT INTO products VALUES (3, 'Keyboard', 'Electronics', 350000, 150);
INSERT INTO products VALUES (4, 'Desk', 'Furniture', 2500000, 30);
INSERT INTO products VALUES (5, 'Chair', 'Furniture', 1800000, 45);

INSERT INTO orders VALUES (1, 1, 1, 1, '2024-01-15');
INSERT INTO orders VALUES (2, 2, 2, 3, '2024-01-16');
INSERT INTO orders VALUES (3, 1, 3, 2, '2024-02-01');
INSERT INTO orders VALUES (4, 3, 5, 1, '2024-02-10');
INSERT INTO orders VALUES (5, 4, 4, 1, '2024-03-05');
INSERT INTO orders VALUES (6, 5, 1, 2, '2024-03-15');
INSERT INTO orders VALUES (7, 2, 3, 1, '2024-03-20');
INSERT INTO orders VALUES (8, 3, 2, 5, '2024-04-01');
`;

const defaultQuery = `SELECT u.name, p.name AS product, o.quantity, o.order_date
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
ORDER BY o.order_date;`;

interface QueryResult {
  columns: string[];
  values: (string | number | null)[][];
  error?: string;
  time?: number;
}

declare global {
  interface Window {
    initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<{
      Database: new (data?: ArrayLike<number>) => {
        run: (sql: string) => void;
        exec: (sql: string) => { columns: string[]; values: unknown[][] }[];
        close: () => void;
      };
    }>;
  }
}

export default function SqlPlaygroundPage() {
  const { t } = useLang();
  const [query, setQuery] = useState(defaultQuery);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const dbRef = useRef<InstanceType<Awaited<ReturnType<typeof window.initSqlJs>>["Database"]> | null>(null);

  const initDb = useCallback(async () => {
    if (dbRef.current) return dbRef.current;
    setLoadingDb(true);

    await new Promise<void>((resolve, reject) => {
      if (document.querySelector('script[src*="sql.js"]')) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load sql.js"));
      document.head.appendChild(s);
    });

    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`,
    });

    const db = new SQL.Database();
    db.run(SAMPLE_DB);
    dbRef.current = db;
    setLoadingDb(false);
    setDbReady(true);
    return db;
  }, []);

  const runQuery = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const db = await initDb();
      const start = performance.now();

      const statements = query
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

      let lastResult: { columns: string[]; values: unknown[][] } | null = null;
      let error: string | undefined;

      for (const stmt of statements) {
        try {
          const res = db.exec(stmt);
          if (res.length > 0) lastResult = res[res.length - 1];
        } catch (err) {
          error = err instanceof Error ? err.message : String(err);
          break;
        }
      }

      const elapsed = performance.now() - start;

      if (error) {
        setResult({ columns: [], values: [], error, time: elapsed });
      } else if (lastResult) {
        setResult({
          columns: lastResult.columns,
          values: lastResult.values as (string | number | null)[][],
          time: elapsed,
        });
      } else {
        setResult({ columns: [], values: [], time: elapsed });
      }
    } catch (err) {
      setResult({ columns: [], values: [], error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }, [query, initDb]);

  const resetDb = useCallback(() => {
    if (dbRef.current) {
      dbRef.current.close();
      dbRef.current = null;
    }
    setDbReady(false);
    setResult(null);
  }, []);

  return (
    <>
      <ToolSeo title={t.sqlPlaygroundTitle} description={t.sqlPlaygroundDesc} path="/tools/sql-playground" />
      <ToolPageLayout title={t.sqlPlaygroundTitle} description={t.sqlPlaygroundDesc}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">SQL (SQLite)</p>
              <div className="flex gap-2">
                <button
                  onClick={resetDb}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t.sqlPlaygroundReset}
                </button>
                <button
                  onClick={runQuery}
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading || loadingDb ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {loadingDb
                    ? t.sqlPlaygroundLoading
                    : loading
                      ? t.jsPlaygroundRunning
                      : t.sqlPlaygroundRun}
                </button>
              </div>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-[400px] w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
              spellCheck={false}
              placeholder={t.sqlPlaygroundPlaceholder}
            />
            <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text-secondary">
              <p className="font-medium text-foreground mb-1">{t.sqlPlaygroundTables}</p>
              <code className="text-accent">users</code> (id, name, email, age, city) ·{" "}
              <code className="text-accent">products</code> (id, name, category, price, stock) ·{" "}
              <code className="text-accent">orders</code> (id, user_id, product_id, quantity, order_date)
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="mb-2 text-xs font-medium text-text-secondary">{t.sqlPlaygroundResults}</p>
            <div className="h-[432px] w-full overflow-auto rounded-xl border border-border bg-surface p-4">
              {!result ? (
                <p className="text-sm text-text-secondary/50">{t.jsPlaygroundEmpty}</p>
              ) : result.error ? (
                <p className="text-sm text-red-400 whitespace-pre-wrap">{result.error}</p>
              ) : result.columns.length === 0 ? (
                <p className="text-sm text-foreground">Query executed successfully. {result.time != null && `(${result.time.toFixed(1)}ms)`}</p>
              ) : (
                <>
                  {result.time != null && (
                    <p className="mb-2 text-xs text-text-secondary">{result.values.length} rows · {result.time.toFixed(1)}ms</p>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {result.columns.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.values.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-text-secondary font-mono text-xs">
                              {cell === null ? <span className="text-text-secondary/40">NULL</span> : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
