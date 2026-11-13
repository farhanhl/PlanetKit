"use client";

import { useState, useCallback } from "react";
import {
  Download,
  HardDrive,
  Video,
  Image,
  File,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

interface MediaItem {
  url: string;
  type: "image" | "video" | "file";
  thumbnail?: string;
  filename: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

const typeIcon = {
  video: Video,
  image: Image,
  file: File,
};

function extractSurl(rawUrl: string): string {
  const surlParam = rawUrl.match(/surl=([^&]+)/)?.[1];
  if (surlParam) return surlParam;
  const sPath = rawUrl.match(/\/s\/(?:1)?([a-zA-Z0-9_-]+)/)?.[1];
  if (sPath) return sPath;
  return "";
}

export default function TeraBoxDownloaderPage() {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [hasDlink, setHasDlink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchMedia = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setMedia([]);
    setTitle("");
    setShowAll(false);

    try {
      const res = await fetch("/api/download/terabox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch files");
        return;
      }

      setMedia(data.media || []);
      setTitle(data.title || "");
      setHasDlink(data.hasDlink || false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(
    (item: MediaItem) => {
      if (hasDlink && item.url) {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.filename;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const surl = extractSurl(url);
        window.open(
          `https://1024terabox.com/sharing/link?surl=${surl}`,
          "_blank"
        );
      }
    },
    [hasDlink, url]
  );

  const displayed = showAll ? media : media.slice(0, 20);
  const videos = media.filter((m) => m.type === "video");
  const images = media.filter((m) => m.type === "image");

  return (
    <>
      <ToolSeo
        title={t.teraBoxTitle}
        description={t.teraBoxDesc}
        path="/tools/terabox-downloader"
      />
      <ToolPageLayout
        title={t.teraBoxTitle}
        description={t.teraBoxDesc}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <label className="mb-1 block text-xs text-text-secondary">
                {t.teraBoxPasteUrl}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setMedia([]);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchMedia();
                  }}
                  placeholder="https://1024tera.com/sharing/link?surl=... or https://terabox.com/s/..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                />
                <button
                  onClick={fetchMedia}
                  disabled={!url.trim() || loading}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t.teraBoxFetch}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                  {error}
                </div>
              )}
            </div>

            {media.length > 0 && (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {videos.length > 0 && `${videos.length} video`}
                      {videos.length > 0 && images.length > 0 && " · "}
                      {images.length > 0 && `${images.length} image`}
                      {!hasDlink && (
                        <span className="ml-2 text-xs text-text-secondary">
                          ({t.teraBoxNoCookieNote})
                        </span>
                      )}
                    </p>
                  </div>
                  {!hasDlink && (
                    <a
                      href={`https://1024terabox.com/sharing/link?surl=${extractSurl(url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t.teraBoxOpenOnTeraBox}
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {displayed.map((item, i) => {
                    const Icon = typeIcon[item.type];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/30"
                      >
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt={item.filename}
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-hover">
                            <Icon className="h-5 w-5 text-text-secondary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.filename}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatSize(item.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                        >
                          <Download className="h-3 w-3" />
                          {hasDlink ? t.teraBoxDownload : t.teraBoxView}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {media.length > 20 && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <ChevronDown className="h-4 w-4" />
                    {t.teraBoxShowAll} ({media.length})
                  </button>
                )}
                {showAll && media.length > 20 && (
                  <button
                    onClick={() => setShowAll(false)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <ChevronUp className="h-4 w-4" />
                    {t.teraBoxShowLess}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {t.teraBoxHowTo}
              </h3>
              <ol className="space-y-3 text-xs text-text-secondary">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    1
                  </span>
                  <span>{t.teraBoxStep1}</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    2
                  </span>
                  <span>{t.teraBoxStep2}</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    3
                  </span>
                  <span>{t.teraBoxStep3}</span>
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {t.teraBoxSupported}
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg bg-background p-3">
                  <HardDrive className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      TeraBox
                    </p>
                    <p className="text-xs text-text-secondary">
                      terabox.com, 1024tera.com, teraboxapp.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {t.teraBoxNote}
              </h3>
              <p className="text-xs text-text-secondary">
                {t.teraBoxNoteDesc}
              </p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
