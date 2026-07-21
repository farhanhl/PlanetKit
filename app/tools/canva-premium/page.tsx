"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function CanvaPremiumPage() {
  const { t } = useLang();
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/canva-link")
      .then((res) => res.json())
      .then((data) => {
        if (data.link) setLink(data.link);
        else setError(t.canvaLinkNotFound);
      })
      .catch(() => setError(t.canvaLinkNotFound))
      .finally(() => setLoading(false));
  }, [t]);

  const go = async () => {
    if (!link) return;

    if (window.location.hostname === "localhost") {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    let ip = "unknown";
    let location = "Unknown";
    try {
      const ipRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        ip = ipData.ip || "unknown";
        location = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(", ") || "Unknown";
      }
    } catch {}

    fetch("/api/canva-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, location }),
    }).catch(() => {});

    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <ToolSeo title={t.canvaTitle} description={t.canvaDesc} path="/tools/canva-premium" />
      <ToolPageLayout title={t.canvaTitle} description={t.canvaDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
                <svg className="h-10 w-10 text-accent" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.168 1.648-.804 5.656-1.14 7.488-.144.768-.408 1.032-.672 1.06-.576.048-1.008-.384-1.56-.756-.864-.588-1.356-.948-2.184-1.524-1.224-.672-.432-1.044.264-1.656.18-.156 3.3-3.024 3.36-3.264.008-.032.016-.144-.056-.208-.072-.064-.176-.04-.256-.024-.112.024-1.88 1.192-5.304 3.48-.504.348-.96.516-1.368.504-.456-.012-1.332-.256-1.98-.468-.8-.264-1.44-.408-1.384-.864.032-.24.36-.48.996-.728 3.888-1.692 6.48-2.808 7.776-3.348 3.672-1.536 4.44-1.8 4.932-1.808.104 0 .352.024.504.144.132.096.168.224.184.328.016.08.032.264.016.408z"/>
                </svg>
              </div>

              <h2 className="mb-3 text-xl font-bold text-foreground">{t.canvaHeading}</h2>
              <p className="mb-6 text-sm text-text-secondary max-w-md mx-auto">{t.canvaDescription}</p>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.canvaLoading}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                  {error}
                </div>
              )}

              {!loading && !error && link && (
                <div className="space-y-4">
                  <button
                    onClick={go}
                    className="flex mx-auto items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t.canvaOpenLink}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.canvaHowTo}</h3>
              <ol className="space-y-3 text-xs text-text-secondary">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">1</span>
                  <span>{t.canvaStep1}</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">2</span>
                  <span>{t.canvaStep2}</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">3</span>
                  <span>{t.canvaStep3}</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">4</span>
                  <span>{t.canvaStep4}</span>
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.canvaNote}</h3>
              <p className="text-xs text-text-secondary">{t.canvaNoteDesc}</p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
