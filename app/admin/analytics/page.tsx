"use client";

import { useState } from "react";
import { BarChart3, Lock, RefreshCw } from "lucide-react";

interface ToolStat {
  slug: string;
  totalVisits: number;
  uniqueVisitors: number;
  lastUsed: string;
}

export default function AnalyticsPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<ToolStat[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/stats", {
        headers: { "x-analytics-password": password },
      });
      if (!res.ok) {
        setError("Wrong password");
        return;
      }
      const data = await res.json();
      setStats(data.stats || []);
      setTotalVisits(data.totalVisits || 0);
      setAuthenticated(true);
    } catch {
      setError("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <div className="w-full rounded-xl border border-border bg-surface p-8">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-bold text-foreground">Analytics Dashboard</h1>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            Enter admin password to view tool usage analytics.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchStats()}
            placeholder="Password"
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
          />
          {error && (
            <p className="mb-4 text-sm text-error">{error}</p>
          )}
          <button
            onClick={fetchStats}
            disabled={!password || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Loading..." : "View Analytics"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 text-center">
          <p className="text-3xl font-bold text-accent">{totalVisits.toLocaleString()}</p>
          <p className="mt-1 text-xs text-text-secondary">Total Visits</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-center">
          <p className="text-3xl font-bold text-accent">{stats.length}</p>
          <p className="mt-1 text-xs text-text-secondary">Tools Used</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-center">
          <p className="text-3xl font-bold text-accent">
            {stats.length > 0 ? stats[0].slug : "—"}
          </p>
          <p className="mt-1 text-xs text-text-secondary">Most Popular</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Tool Usage (sorted by frequency)</h2>
        </div>
        {stats.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">No data yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {stats.map((s, i) => {
              const maxVisits = stats[0].totalVisits;
              const barWidth = maxVisits > 0 ? (s.totalVisits / maxVisits) * 100 : 0;
              return (
                <div key={s.slug} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-6 text-right text-xs font-bold text-text-secondary">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {s.slug}
                      </span>
                      <span className="ml-2 text-xs text-text-secondary whitespace-nowrap">
                        {s.totalVisits.toLocaleString()} visits · {s.uniqueVisitors} unique
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
