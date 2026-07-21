interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
}

export default function ProgressBar({
  progress,
  label,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-xs text-text-secondary">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
