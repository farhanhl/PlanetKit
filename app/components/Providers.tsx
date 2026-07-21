"use client";

import { LanguageProvider } from "@/app/lib/i18n/context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
