"use client"

/**
 * PlanPageSkeleton Component (T-060, T-066)
 * Loading skeleton for the plan page
 */

import {
  SkeletonCard,
  SkeletonRing,
  SkeletonBar,
} from "@/components/ui/skeleton"

export function PlanPageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <SkeletonBar className="h-10 w-64 mx-auto" />
          <SkeletonBar className="h-4 w-48 mx-auto" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonRing className="py-8" />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
