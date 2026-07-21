export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-6 h-4 w-20 animate-pulse rounded bg-surface" />
      <div className="mb-3 h-8 w-64 animate-pulse rounded bg-surface" />
      <div className="mb-8 h-4 w-96 animate-pulse rounded bg-surface" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
        </div>
        <div>
          <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
        </div>
      </div>
    </div>
  );
}
