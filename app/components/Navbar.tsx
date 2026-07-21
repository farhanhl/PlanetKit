"use client";

import Link from "next/link";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ShareButton from "./ShareButton";

function UkFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" className="h-4 w-4 rounded-sm">
      <path fill="#012169" d="M0 0h36v36H0z"/>
      <path fill="#FFF" d="M0 0v36l9-9h18V0H0z" opacity=".8"/>
      <path fill="#FFF" d="M36 0v9L27 0H36z" opacity=".5"/>
      <path fill="#FFF" d="M36 36V27L27 36H36z" opacity=".5"/>
      <path fill="#FFF" d="M0 36V27l9 9H0z" opacity=".5"/>
      <path fill="#FFF" d="M0 0l9 9V0H0z" opacity=".5"/>
      <path fill="#C8102E" d="M0 16.5h36v3H0z"/>
      <path fill="#C8102E" d="M16.5 0v36h3V0z"/>
      <path fill="#FFF" d="M0 15h36v6H0z"/>
      <path fill="#FFF" d="M15 0v36h6V0z"/>
      <path fill="#C8102E" d="M0 16h36v4H0z"/>
      <path fill="#C8102E" d="M16 0v36h4V0z"/>
    </svg>
  );
}

function IdFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" className="h-4 w-4 rounded-sm">
      <path fill="#FF0000" d="M0 0h36v18H0z"/>
      <path fill="#FFF" d="M0 18h36v18H0z"/>
    </svg>
  );
}

export default function Navbar() {
  const { lang, toggle, theme, toggleTheme } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const switchLang = (newLang: "en" | "id") => {
    if (newLang !== lang) toggle();
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/planetkit.png" alt="PlanetKit" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Planet<span className="text-accent">Kit</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <ShareButton />

          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
            >
              {lang === "en" ? <UkFlag /> : <IdFlag />}
              <span className="hidden sm:inline">{lang === "en" ? "English" : "Indonesia"}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                <button
                  onClick={() => switchLang("en")}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover ${
                    lang === "en" ? "text-accent" : "text-text-secondary hover:text-foreground"
                  }`}
                >
                  <UkFlag />
                  English
                  {lang === "en" && <span className="ml-auto text-xs">✓</span>}
                </button>
                <button
                  onClick={() => switchLang("id")}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover ${
                    lang === "id" ? "text-accent" : "text-text-secondary hover:text-foreground"
                  }`}
                >
                  <IdFlag />
                  Indonesia
                  {lang === "id" && <span className="ml-auto text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
