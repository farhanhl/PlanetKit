"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ToolCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  anim: string;
  index?: number;
}

export default function ToolCard({
  href,
  icon: Icon,
  title,
  description,
  color,
  anim,
  index = 0,
}: ToolCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delay = `${index * 40}ms`;

  return (
    <Link
      ref={ref}
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-surface-hover sm:p-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}, transform 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}, border-color 0.3s ease`,
        borderColor: visible ? `${color}30` : undefined,
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon
          className={`h-6 w-6 ${anim}`}
          style={{ color }}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
      </div>
    </Link>
  );
}
