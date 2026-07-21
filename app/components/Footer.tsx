"use client";

import { useLang } from "@/app/lib/i18n/context";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/planetkit.png" alt="PlanetKit" className="h-5 w-5 rounded" />
          <span className="text-sm font-semibold text-foreground">
            Planet<span className="text-accent">Kit</span>
          </span>
        </div>
        <p className="text-xs text-text-secondary">{t.footerPrivacy}</p>
        <p className="text-xs text-text-secondary">
          {t.developedBy}{" "}
          <a
            href="https://x.com/strr4angerz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent transition-colors hover:text-accent-hover"
          >
            Sin
          </a>
        </p>
      </div>
    </footer>
  );
}
