/**
 * PageSkeleton Component
 * T-066: No blank screens; shimmer placeholders during load
 * Reusable skeleton for any page with configurable row shapes
 */

interface PageSkeletonProps {
  /** Number of card rows to show */
  rows?: number
  /** Whether to show a header block */
  showHeader?: boolean
  /** Surface context class e.g. "bg-surface-analytics/10" */
  surfaceClass?: string
}

export function PageSkeleton({
  rows = 4,
  showHeader = true,
  surfaceClass = '',
}: PageSkeletonProps) {
  return (
    <div className={`min-h-screen p-4 md:p-6 ${surfaceClass}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {showHeader && (
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-muted animate-skeleton-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-skeleton-pulse" />
          </div>
        )}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border-2 border-border bg-muted/50 animate-skeleton-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
