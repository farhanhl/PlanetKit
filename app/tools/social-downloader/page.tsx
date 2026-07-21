"use client";

import { useState, useCallback } from "react";
import { Download, Globe, AtSign, Music, Loader2, ExternalLink } from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import { useLang } from "@/app/lib/i18n/context";

type Platform = "instagram" | "twitter" | "tiktok" | null;

interface MediaItem {
  url: string;
  type: "image" | "video";
  thumbnail?: string;
}

function detectPlatform(url: string): Platform {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("tiktok.com")) return "tiktok";
  return null;
}

const platformIcons: Record<string, typeof Globe> = {
  instagram: Globe,
  twitter: AtSign,
  tiktok: Music,
};

export default function SocialDownloaderPage() {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>(null);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setPlatform(detectPlatform(value));
    setMedia([]);
    setError(null);
  }, []);

  const fetchMedia = async () => {
    if (!url.trim() || !platform) return;
    setLoading(true);
    setError(null);
    setMedia([]);

    try {
      const res = await fetch(`/api/download/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch media");
        return;
      }

      setMedia(data.media || []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (mediaUrl: string, filename: string) => {
    try {
      // Try direct download first (works for most URLs)
      const a = document.createElement("a");
      a.href = mediaUrl;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Fallback: open in new tab
      window.open(mediaUrl, "_blank");
    }
  };

  const PlatformIcon = platform ? platformIcons[platform] : null;

  return (
    <ToolPageLayout
      title={t.socialDownloaderTitle}
      description={t.socialDownloaderDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <label className="mb-1 block text-xs text-text-secondary">
              {t.socialPasteUrl}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={t.socialUrlPlaceholder}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
              />
              <button
                onClick={fetchMedia}
                disabled={!url.trim() || !platform || loading}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t.socialFetch}
              </button>
            </div>

            {platform && (
              <div className="mt-3 flex items-center gap-2">
                {PlatformIcon && <PlatformIcon className="h-4 w-4 text-accent" />}
                <span className="text-xs text-text-secondary">
                  {t.socialDetected}: <span className="font-medium text-foreground">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                </span>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                {error}
              </div>
            )}
          </div>

          {media.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {t.socialFound}: {media.length} {media.length === 1 ? "item" : "items"}
              </h3>
              {media.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/30"
                >
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={`Media ${i + 1}`}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-hover">
                      {item.type === "video" ? (
                        <Music className="h-6 w-6 text-text-secondary" />
                      ) : (
                        <span className="text-2xl">📷</span>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.type === "video" ? t.socialVideo : t.socialImage} {i + 1}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {item.url.substring(0, 60)}...
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() =>
                        downloadFile(item.url, `${platform}_${i + 1}.${item.type === "video" ? "mp4" : "jpg"}`)
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      <Download className="h-3 w-3" />
                      {t.socialDownload}
                    </button>
                    <button
                      onClick={() => window.open(item.url, "_blank")}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.socialSupported}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-lg bg-background p-3">
                <Globe className="h-5 w-5 text-pink-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Instagram</p>
                  <p className="text-xs text-text-secondary">{t.socialIgDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-background p-3">
                <AtSign className="h-5 w-5 text-sky-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Twitter / X</p>
                  <p className="text-xs text-text-secondary">{t.socialTwDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-background p-3">
                <Music className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">TikTok</p>
                  <p className="text-xs text-text-secondary">{t.socialTkDesc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">{t.socialNote}</h3>
            <p className="text-xs text-text-secondary">{t.socialDisclaimer}</p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
