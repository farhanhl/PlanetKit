"use client";

import { Share2, Link, MessageCircle, Send, Mail, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLang } from "@/app/lib/i18n/context";

const SITE_URL = "https://planetkit.vercel.app";
const SHARE_TEXT = "Free browser-based tools to convert, merge, split, and edit files without server uploads.";

export default function ShareButton() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const encoded = {
    text: encodeURIComponent(SHARE_TEXT),
    url: encodeURIComponent(SITE_URL),
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
        aria-label="Share"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <a
            href={`https://wa.me/?text=${encoded.text}%20${encoded.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4 text-success" />
            WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encoded.text}&url=${encoded.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter / X
          </a>
          <a
            href={`https://t.me/share/url?url=${encoded.url}&text=${encoded.text}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Send className="h-4 w-4 text-[#26A5E4]" />
            Telegram
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("Check out PlanetKit")}&body=${encoded.text}%0A%0A${encoded.url}`}
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Mail className="h-4 w-4 text-accent" />
            Email
          </a>
          <button
            onClick={copyLink}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Link className="h-4 w-4 text-text-secondary" />
            )}
            {copied ? t.copied : t.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
