"use client";

import { useEffect } from "react";

interface ToolSeoProps {
  title: string;
  description: string;
  path: string;
}

export default function ToolSeo({ title, description, path }: ToolSeoProps) {
  useEffect(() => {
    document.title = `${title} | PlanetKit`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:")) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", `${title} | PlanetKit`);
    setMeta("og:description", description);
    setMeta("og:url", `https://planetkit.vercel.app${path}`);
    setMeta("twitter:title", `${title} | PlanetKit`);
    setMeta("twitter:description", description);
  }, [title, description, path]);

  return null;
}
