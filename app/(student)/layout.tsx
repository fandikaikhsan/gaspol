/**
 * Student Layout
 * Phase 9: Mobile Optimization
 * Updated with Desktop TopNav + i18n language sync
 */

import { BottomNav } from "@/components/navigation/BottomNav"
import { TopNav } from "@/components/navigation/TopNav"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { StudentLayoutClient } from "./layout-client"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StudentLayoutClient>
      <TopNav userRole="student" />
      <div className="pt-6 pb-16 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
      <BottomNav />
    </StudentLayoutClient>
  )
}
