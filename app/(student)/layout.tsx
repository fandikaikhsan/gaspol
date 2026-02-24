/**
 * Student Layout
 * Phase 9: Mobile Optimization
 * Updated with Desktop TopNav
 */

import { BottomNav } from "@/components/navigation/BottomNav"
import { TopNav } from "@/components/navigation/TopNav"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopNav userRole="student" />
      <div className="pt-6 pb-16 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
      <BottomNav />
    </>
  )
}
