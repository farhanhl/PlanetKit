"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { useLang } from "@/app/lib/i18n/context";
import AnalyticsTracker from "./AnalyticsTracker";

interface ToolPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function ToolPageLayout({
  title,
  description,
  children,
}: ToolPageLayoutProps) {
  const { t } = useLang();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <AnalyticsTracker />
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.backToTools}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-text-secondary sm:text-base">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}
