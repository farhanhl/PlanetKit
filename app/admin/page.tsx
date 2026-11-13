"use client";

import { useState } from "react";
import {
  Settings,
  Lock,
  Save,
  RefreshCw,
  CheckCircle,
  MessageSquare,
  ImageIcon,
  Palette,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";

interface SettingsState {
  telegramBotToken: string;
  telegramChatId: string;
  canvaInviteLink: string;
  removeBgApiKey: string;
  updatedAt?: string;
}

interface ToolStat {
  slug: string;
  totalVisits: number;
  uniqueVisitors: number;
  lastUsed: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "analytics">("settings");

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settings, setSettings] = useState<SettingsState>({
    telegramBotToken: "",
    telegramChatId: "",
    canvaInviteLink: "",
    removeBgApiKey: "",
    updatedAt: "",
  });

  // Analytics State
  const [stats, setStats] = useState<ToolStat[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) return;

    setSettingsLoading(true);
    setSettingsError("");
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-password": password },
      });

      if (!res.ok) {
        setSettingsError("Password salah atau tidak berwenang.");
        return;
      }

      const data = await res.json();
      if (data.config) {
        setSettings({
          telegramBotToken: data.config.telegramBotToken || "",
          telegramChatId: data.config.telegramChatId || "",
          canvaInviteLink: data.config.canvaInviteLink || "",
          removeBgApiKey: data.config.removeBgApiKey || "",
          updatedAt: data.config.updatedAt || "",
        });
      }
      setAuthenticated(true);
      // Fetch analytics in parallel
      fetchAnalytics(password);
    } catch {
      setSettingsError("Gagal menghubungi server.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-password": password },
      });

      if (!res.ok) throw new Error("Gagal mengambil data pengaturan.");
      const data = await res.json();
      if (data.config) {
        setSettings({
          telegramBotToken: data.config.telegramBotToken || "",
          telegramChatId: data.config.telegramChatId || "",
          canvaInviteLink: data.config.canvaInviteLink || "",
          removeBgApiKey: data.config.removeBgApiKey || "",
          updatedAt: data.config.updatedAt || "",
        });
      }
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error memuat pengaturan.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Gagal menyimpan konfigurasi.");
      }

      const data = await res.json();
      if (data.config) {
        setSettings((prev) => ({
          ...prev,
          ...data.config,
        }));
      }
      setSettingsSuccess("Pengaturan berhasil disimpan ke Firebase!");
      setTimeout(() => setSettingsSuccess(""), 4000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const fetchAnalytics = async (pwd = password) => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const res = await fetch("/api/analytics/stats", {
        headers: { "x-analytics-password": pwd },
      });
      if (!res.ok) {
        setAnalyticsError("Gagal memuat data statistik.");
        return;
      }
      const data = await res.json();
      setStats(data.stats || []);
      setTotalVisits(data.totalVisits || 0);
    } catch {
      setAnalyticsError("Gagal mengambil analitik.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Portal</h1>
              <p className="text-xs text-text-secondary">PlanetKit Admin & Analytics</p>
            </div>
          </div>

          <p className="mb-4 text-sm text-text-secondary">
            Masukkan password admin untuk mengakses pengaturan sistem & data analitik.
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="mb-4 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />

            {settingsError && <p className="mb-4 text-xs font-medium text-error">{settingsError}</p>}

            <button
              type="submit"
              disabled={!password || settingsLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {settingsLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Memeriksa...
                </>
              ) : (
                "Masuk ke Admin Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin & Analytics Control Center</h1>
          <p className="text-xs text-text-secondary">
            Konfigurasi tersimpan langsung di Firebase Firestore & pemantauan penggunaan tool
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === "settings") fetchSettings();
            else fetchAnalytics();
          }}
          disabled={settingsLoading || analyticsLoading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              settingsLoading || analyticsLoading ? "animate-spin" : ""
            }`}
          />
          Segarkan Data
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-border">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "settings"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-foreground"
          }`}
        >
          <Settings className="h-4 w-4" />
          Konfigurasi Firebase
        </button>
        <button
          onClick={() => {
            setActiveTab("analytics");
            fetchAnalytics();
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Statistik & Analitik
        </button>
      </div>

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div>
          {settingsSuccess && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          {settingsError && (
            <div className="mb-6 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
              {settingsError}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Telegram Section */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <h3>Telegram Notifications</h3>
              </div>
              <p className="mb-4 text-xs text-text-secondary">
                Konfigurasi bot Telegram untuk pengiriman notifikasi pengunjung & klik Canva. Disimpan di Firebase.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={settings.telegramBotToken}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramBotToken: e.target.value })
                    }
                    placeholder="Contoh: 7673904668:AAFBGmFQ..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={settings.telegramChatId}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramChatId: e.target.value })
                    }
                    placeholder="Contoh: 7101696494"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Canva Section */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Palette className="h-4 w-4 text-purple-400" />
                <h3>Canva Invite Link</h3>
              </div>
              <p className="mb-4 text-xs text-text-secondary">
                Tautan undangan tim Canva Premium untuk pengunjung di alat Canva. Disimpan di Firebase.
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Link Undangan
                </label>
                <input
                  type="url"
                  value={settings.canvaInviteLink}
                  onChange={(e) =>
                    setSettings({ ...settings, canvaInviteLink: e.target.value })
                  }
                  placeholder="https://www.canva.com/brand/join?token=..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Remove.bg Section */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ImageIcon className="h-4 w-4 text-emerald-400" />
                <h3>Remove.bg API Key</h3>
              </div>
              <p className="mb-4 text-xs text-text-secondary">
                Kunci API remove.bg untuk tool hapus background gambar. Disimpan di Firebase.
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  API Key
                </label>
                <input
                  type="text"
                  value={settings.removeBgApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, removeBgApiKey: e.target.value })
                  }
                  placeholder="zk5Juku7NtWW..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Footer submit */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-secondary">
                {settings.updatedAt ? (
                  <span>Terakhir disimpan: {new Date(settings.updatedAt).toLocaleString()}</span>
                ) : (
                  <span>Belum ada konfigurasi tersimpan di Firebase Firestore</span>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Simpan Perubahan ke Firebase
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {analyticsError && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
              {analyticsError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">Total Penggunaan</p>
                <Activity className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-2 text-3xl font-bold text-accent">{totalVisits.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">Jumlah Tool Aktif</p>
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-2 text-3xl font-bold text-accent">{stats.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">Paling Sering Digunakan</p>
                <Users className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-2 text-xl font-bold text-accent truncate">
                {stats.length > 0 ? stats[0].slug : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">
                Statistik Penggunaan Alat (Berdasarkan Frekuensi)
              </h2>
            </div>

            {stats.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-secondary">
                {analyticsLoading ? "Memuat analitik..." : "Belum ada riwayat aktivitas yang tercatat."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.map((s, i) => {
                  const maxVisits = stats[0]?.totalVisits || 1;
                  const barWidth = maxVisits > 0 ? (s.totalVisits / maxVisits) * 100 : 0;
                  return (
                    <div key={s.slug} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="w-6 text-right text-xs font-bold text-text-secondary">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate">
                            {s.slug}
                          </span>
                          <span className="ml-2 text-xs text-text-secondary whitespace-nowrap">
                            {s.totalVisits.toLocaleString()} kunjungan · {s.uniqueVisitors} IP unik
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
      )}
    </div>
  );
}
