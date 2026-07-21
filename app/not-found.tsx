"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <FileQuestion className="mb-6 h-16 w-16 text-accent/40" />
      <h1 className="text-4xl font-bold text-foreground">{t.notFoundTitle}</h1>
      <p className="mt-2 text-lg text-text-secondary">{t.notFoundMsg}</p>
      <p className="mt-1 max-w-md text-sm text-text-secondary">
        {t.notFoundDesc}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
      >
        {t.backToHome}
      </Link>
    </div>
  );
}
