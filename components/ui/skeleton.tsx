import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function SkeletonRing({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Skeleton className="h-32 w-32 rounded-full" />
    </div>
  )
}

function SkeletonBar({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 w-full rounded-full", className)} />
}

export { Skeleton, SkeletonCard, SkeletonRing, SkeletonBar }
