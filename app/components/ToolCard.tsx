import Link from "next/link";
import { LucideIcon } from "lucide-react";

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
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:bg-surface-hover sm:p-8"
      style={{
        borderColor: `${color}30`,
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
